from __future__ import annotations

import base64
import os
import re
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol
from uuid import UUID, uuid4

import httpx
from sarvamai import AsyncSarvamAI
from sarvamai.core.api_error import ApiError as SarvamApiError

from .sessions import (
    MAX_AUDIO_BYTES_PER_SESSION,
    MAX_TTS_CHARACTERS_PER_SESSION,
    MAX_VOICE_REQUESTS_PER_SESSION,
    AudioAsset,
    DemoSession,
)

MAX_AUDIO_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_TTS_SEGMENT_CHARACTERS = 2_400
SUPPORTED_AUDIO_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/ogg",
    "audio/opus",
    "audio/aac",
    "audio/flac",
}


class VoiceProvider(Protocol):
    async def transcribe(
        self,
        *,
        audio: bytes,
        filename: str,
        content_type: str,
    ) -> tuple[str, str | None]: ...

    async def synthesize(self, text: str) -> bytes: ...


class VoiceProviderError(RuntimeError):
    def __init__(self, message: str, *, retryable: bool, unavailable: bool = False):
        super().__init__(message)
        self.retryable = retryable
        self.unavailable = unavailable


class VoiceBusyError(RuntimeError):
    pass


class VoiceLimitError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class StoredNarration:
    resource_id: UUID
    assets: tuple[AudioAsset, ...]


class SarvamVoiceService:
    def __init__(
        self,
        api_key: str,
        *,
        speaker: str | None = None,
        timeout: float = 35.0,
    ) -> None:
        self._client = AsyncSarvamAI(
            api_subscription_key=api_key,
            timeout=timeout,
        )
        self._speaker = speaker or os.getenv("SARVAM_TTS_SPEAKER", "ishita")

    async def transcribe(
        self,
        *,
        audio: bytes,
        filename: str,
        content_type: str,
    ) -> tuple[str, str | None]:
        try:
            response = await self._client.speech_to_text.transcribe(
                file=(filename, audio, content_type),
                model="saaras:v3",
                mode="transcribe",
                language_code="en-IN",
            )
        except Exception as error:
            raise _provider_error(error, "Speech transcription failed.") from error
        return response.transcript.strip(), response.language_code

    async def synthesize(self, text: str) -> bytes:
        if len(text) > MAX_TTS_SEGMENT_CHARACTERS:
            raise ValueError("Narration segment exceeds the provider limit.")
        try:
            response = await self._client.text_to_speech.convert(
                text=text,
                language_code="en-IN",
                speaker=self._speaker,
                model="bulbul:v3",
                output_audio_codec="mp3",
                pace=0.9,
                speech_sample_rate=24_000,
                temperature=0.45,
                enable_preprocessing=True,
            )
        except Exception as error:
            raise _provider_error(error, "Speech synthesis failed.") from error
        if not response.audios:
            raise VoiceProviderError(
                "Speech synthesis returned no audio.",
                retryable=True,
            )
        try:
            return base64.b64decode("".join(response.audios), validate=True)
        except ValueError as error:
            raise VoiceProviderError(
                "Speech synthesis returned invalid audio.",
                retryable=True,
            ) from error


def _provider_error(error: Exception, message: str) -> VoiceProviderError:
    if isinstance(error, SarvamApiError):
        status_code = error.status_code
        retryable = status_code in {429, 500, 503}
        return VoiceProviderError(
            message,
            retryable=retryable,
            unavailable=status_code == 403,
        )
    if isinstance(error, (httpx.TimeoutException, httpx.NetworkError)):
        return VoiceProviderError(message, retryable=True)
    return VoiceProviderError(message, retryable=False)


def narration_text(markdown: str) -> str:
    text = re.sub(r"```.*?```", " ", markdown, flags=re.DOTALL)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_>~]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_narration(
    text: str,
    *,
    max_characters: int = MAX_TTS_SEGMENT_CHARACTERS,
) -> list[str]:
    normalized = narration_text(text)
    if not normalized:
        return []
    if len(normalized) <= max_characters:
        return [normalized]

    sentences = re.split(r"(?<=[.!?])\s+", normalized)
    segments: list[str] = []
    current = ""
    for sentence in sentences:
        if len(sentence) > max_characters:
            words = sentence.split()
            for word in words:
                candidate = f"{current} {word}".strip()
                if current and len(candidate) > max_characters:
                    segments.append(current)
                    current = word
                else:
                    current = candidate
            continue
        candidate = f"{current} {sentence}".strip()
        if current and len(candidate) > max_characters:
            segments.append(current)
            current = sentence
        else:
            current = candidate
    if current:
        segments.append(current)
    return segments


async def store_narration(
    *,
    session: DemoSession,
    resource_id: UUID,
    texts: Sequence[str],
    provider: VoiceProvider,
    section_indexes: Sequence[int | None] | None = None,
) -> StoredNarration:
    existing = sorted(
        (
            asset
            for asset in session.audio_assets.values()
            if asset.resource_id == resource_id
        ),
        key=lambda asset: asset.sequence,
    )
    if existing:
        return StoredNarration(resource_id, tuple(existing))
    if not session.voice_lock.acquire(blocking=False):
        raise VoiceBusyError("Another voice request is already running.")

    created: list[AudioAsset] = []
    try:
        segments: list[tuple[str, int | None]] = []
        for index, text in enumerate(texts):
            section_index = (
                section_indexes[index]
                if section_indexes is not None
                else None
            )
            segments.extend(
                (segment, section_index) for segment in split_narration(text)
            )
        character_count = sum(len(text) for text, _ in segments)
        if not segments:
            raise ValueError("There is no text available to narrate.")
        if (
            session.voice_request_count + len(segments)
            > MAX_VOICE_REQUESTS_PER_SESSION
            or session.tts_character_count + character_count
            > MAX_TTS_CHARACTERS_PER_SESSION
        ):
            raise VoiceLimitError("This session reached its voice usage limit.")

        directory = session.ensure_temporary_directory()
        for sequence, (segment, section_index) in enumerate(segments):
            session.voice_request_count += 1
            session.tts_character_count += len(segment)
            audio = await provider.synthesize(segment)
            if not audio:
                raise VoiceProviderError(
                    "Speech synthesis returned empty audio.",
                    retryable=True,
                )
            if (
                session.audio_bytes
                + sum(item.path.stat().st_size for item in created)
                + len(audio)
                > MAX_AUDIO_BYTES_PER_SESSION
            ):
                raise VoiceLimitError("This session reached its audio storage limit.")
            asset = AudioAsset(
                id=uuid4(),
                resource_id=resource_id,
                path=directory / f"{uuid4()}.mp3",
                mime_type="audio/mpeg",
                sequence=sequence,
                section_index=section_index,
            )
            asset.path.write_bytes(audio)
            created.append(asset)

        for asset in created:
            session.audio_assets[asset.id] = asset
            session.audio_bytes += asset.path.stat().st_size
        return StoredNarration(resource_id, tuple(created))
    except Exception:
        for asset in created:
            asset.path.unlink(missing_ok=True)
        raise
    finally:
        session.voice_lock.release()
