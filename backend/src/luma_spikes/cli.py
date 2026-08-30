from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

from openai import OpenAI

from .chunking import chunk_document
from .citations import generate_grounded_answer, map_citations
from .config import MissingOpenAICredentialsError, load_project_environment
from .pdf import PdfSpikeError, extract_pdf
from .retrieval import OpenAIEmbedder, build_index, retrieve


def _openai_client() -> OpenAI:
    load_project_environment()
    if not os.getenv("OPENAI_API_KEY"):
        raise MissingOpenAICredentialsError(
            "Set OPENAI_API_KEY in the project .env file or shell environment."
        )
    return OpenAI(timeout=30.0, max_retries=2)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run LUMA feasibility spikes.")
    commands = parser.add_subparsers(dest="command", required=True)

    extraction = commands.add_parser("extract", help="Run page-aware extraction.")
    extraction.add_argument("pdf", type=Path)

    retrieval = commands.add_parser("retrieve", help="Evaluate retrieval hit@5.")
    retrieval.add_argument("pdf", type=Path)
    retrieval.add_argument(
        "questions",
        type=Path,
        help='JSON list of {"question": str, "expected_pages": [int]}.',
    )

    answer = commands.add_parser("answer", help="Generate one grounded answer.")
    answer.add_argument("pdf", type=Path)
    answer.add_argument("question")
    return parser


def _prepare(pdf: Path):
    document = extract_pdf(pdf)
    source_id = uuid5(NAMESPACE_URL, str(pdf.resolve()))
    chunks = chunk_document(document, source_id)
    return document, source_id, chunks


def _extract(pdf: Path) -> int:
    document, _, chunks = _prepare(pdf)
    print(
        json.dumps(
            {
                "pdf": pdf.name,
                "page_count": document.page_count,
                "characters_by_page": [
                    page.character_count for page in document.pages
                ],
                "chunk_count": len(chunks),
                "page_numbers": [page.number for page in document.pages],
            },
            indent=2,
        )
    )
    return 0


def _retrieve(pdf: Path, questions_path: Path) -> int:
    _, source_id, chunks = _prepare(pdf)
    questions = json.loads(questions_path.read_text(encoding="utf-8"))
    embedder = OpenAIEmbedder(_openai_client())
    index = build_index(chunks, embedder)

    results = []
    hits = 0
    for item in questions:
        retrieved = retrieve(
            item["question"],
            index=index,
            embedder=embedder,
            selected_source_ids={source_id},
            limit=5,
        )
        returned_pages = [hit.chunk.page_start for hit in retrieved]
        passed = bool(set(item["expected_pages"]) & set(returned_pages))
        hits += int(passed)
        results.append(
            {
                "question": item["question"],
                "expected_pages": item["expected_pages"],
                "returned_pages": returned_pages,
                "hit_at_5": passed,
            }
        )

    print(
        json.dumps(
            {
                "embedding_model": embedder.model,
                "questions": len(results),
                "hits": hits,
                "hit_at_5": hits / len(results) if results else 0,
                "results": results,
            },
            indent=2,
        )
    )
    return 0 if hits == len(results) else 1


def _answer(pdf: Path, question: str) -> int:
    _, source_id, chunks = _prepare(pdf)
    client = _openai_client()
    embedder = OpenAIEmbedder(client)
    index = build_index(chunks, embedder)
    hits = retrieve(
        question,
        index=index,
        embedder=embedder,
        selected_source_ids={source_id},
        limit=5,
    )
    answer = generate_grounded_answer(
        client=client,
        model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-5-mini"),
        question=question,
        chunks=[hit.chunk for hit in hits],
    )
    citations = map_citations(
        answer,
        chunks=[hit.chunk for hit in hits],
        source_names={source_id: pdf.name},
    )
    print(
        json.dumps(
            {
                "prompt_version": "grounded_answer.spike.v1",
                "answer": answer.model_dump(mode="json"),
                "citations": [
                    citation.model_dump(mode="json") for citation in citations
                ],
            },
            indent=2,
        )
    )
    return 0


def main() -> None:
    args = _parser().parse_args()
    try:
        if args.command == "extract":
            exit_code = _extract(args.pdf)
        elif args.command == "retrieve":
            exit_code = _retrieve(args.pdf, args.questions)
        else:
            exit_code = _answer(args.pdf, args.question)
    except PdfSpikeError as error:
        print(json.dumps({"error": {"code": error.code, "message": str(error)}}))
        raise SystemExit(2) from error
    except MissingOpenAICredentialsError as error:
        print(
            json.dumps(
                {"error": {"code": "AI_NOT_CONFIGURED", "message": str(error)}}
            )
        )
        raise SystemExit(2) from error
    raise SystemExit(exit_code)


if __name__ == "__main__":
    main()

