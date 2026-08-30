from __future__ import annotations

import re
import unicodedata
from pathlib import Path

import pymupdf

from .models import ExtractedDocument, ExtractedPage

PDF_SIGNATURE = b"%PDF-"
MAX_PDF_BYTES = 20 * 1024 * 1024
MAX_PAGES = 50
MIN_DOCUMENT_CHARACTERS = 40


class PdfSpikeError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value)
    value = value.replace("\u00ad", "").replace("\x00", "")
    lines = (re.sub(r"[^\S\n]+", " ", line).strip() for line in value.splitlines())
    paragraphs = [line for line in lines if line]
    return "\n".join(paragraphs)


def extract_pdf(
    path: Path,
    *,
    max_bytes: int = MAX_PDF_BYTES,
    max_pages: int = MAX_PAGES,
    min_characters: int = MIN_DOCUMENT_CHARACTERS,
) -> ExtractedDocument:
    if not path.is_file():
        raise PdfSpikeError("SOURCE_PROCESSING_FAILED", "The PDF does not exist.")
    if path.stat().st_size > max_bytes:
        raise PdfSpikeError("SOURCE_TOO_LARGE", "The PDF exceeds the size limit.")

    with path.open("rb") as stream:
        if stream.read(len(PDF_SIGNATURE)) != PDF_SIGNATURE:
            raise PdfSpikeError("SOURCE_TYPE_UNSUPPORTED", "The file is not a PDF.")

    try:
        document = pymupdf.open(path)
    except (pymupdf.FileDataError, RuntimeError) as error:
        raise PdfSpikeError("SOURCE_PROCESSING_FAILED", "The PDF is corrupt.") from error

    try:
        if document.needs_pass:
            raise PdfSpikeError("SOURCE_ENCRYPTED", "Encrypted PDFs are unsupported.")
        if document.page_count > max_pages:
            raise PdfSpikeError("SOURCE_PAGE_LIMIT", "The PDF exceeds the page limit.")

        pages = tuple(
            ExtractedPage(
                number=index + 1,
                text=(text := normalize_text(page.get_text("text"))),
                character_count=len(text),
            )
            for index, page in enumerate(document)
        )
    finally:
        document.close()

    if sum(page.character_count for page in pages) < min_characters:
        raise PdfSpikeError(
            "SOURCE_TEXT_NOT_FOUND",
            "The PDF does not contain enough readable text.",
        )

    return ExtractedDocument(path=path, page_count=len(pages), pages=pages)

