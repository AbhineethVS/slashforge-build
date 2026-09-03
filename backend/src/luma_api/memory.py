from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, Field

from .sessions import DemoSession

Classification = Literal[
    "mastered",
    "lucky_guess",
    "needs_practice",
    "confident_misconception",
    "unscored",
]
ConceptState = Literal["unseen", "emerging", "stable", "needs_recheck"]
MisconceptionStatus = Literal["open", "repairing", "rechecked"]
NextAction = Literal["counterexample", "teach_back", "transfer_question"]
ConfidencePattern = Literal["low_confidence", "confident_misconception"]


@dataclass(frozen=True, slots=True)
class ConceptSpec:
    concept_id: str
    label: str
    aliases: frozenset[str]
    confused_with: tuple[str, ...]
    evidence_pages: tuple[int, ...]
    misconception_claim: str
    transfer_question: str
    source_name: str = "Economics - Theory of Cost.pdf"


# Hardcoded concept graph for the bundled economics demo. Unknown labels from
# uploaded sources still receive memory records, but without graph enrichment.
DEMO_CONCEPT_GRAPH: tuple[ConceptSpec, ...] = (
    ConceptSpec(
        concept_id="explicit_implicit",
        label="Explicit and implicit cost",
        aliases=frozenset(
            {
                "costs",
                "explicit cost",
                "implicit cost",
                "explicit and implicit cost",
                "explicit vs implicit",
                "explicit versus implicit cost",
            }
        ),
        confused_with=("Opportunity cost",),
        evidence_pages=(2,),
        misconception_claim=(
            "The student treats a cash payment and an owned-input cost as the "
            "same kind of cost."
        ),
        transfer_question=(
            "A firm uses its own building instead of paying rent. Is that an "
            "explicit cost? Why or why not?"
        ),
    ),
    ConceptSpec(
        concept_id="total_cost",
        label="Total cost",
        aliases=frozenset({"total cost", "tc", "tc = tfc + tvc"}),
        confused_with=("Fixed cost", "Variable cost"),
        evidence_pages=(3, 4, 5),
        misconception_claim=(
            "The student does not treat total cost as the sum of fixed and "
            "variable cost."
        ),
        transfer_question=(
            "If output is zero in the short run, can total cost still be "
            "positive? Explain using TFC and TVC."
        ),
    ),
    ConceptSpec(
        concept_id="fixed_cost",
        label="Fixed cost",
        aliases=frozenset(
            {"fixed cost", "total fixed cost", "tfc", "unavoidable cost"}
        ),
        confused_with=("Variable cost",),
        evidence_pages=(3, 4),
        misconception_claim=(
            "The student believes fixed cost changes with short-run output, or "
            "that it becomes zero when production stops."
        ),
        transfer_question=(
            "Production stops for a week but the plant is unchanged. What "
            "happens to total fixed cost?"
        ),
    ),
    ConceptSpec(
        concept_id="variable_cost",
        label="Variable cost",
        aliases=frozenset({"variable cost", "total variable cost", "tvc"}),
        confused_with=("Fixed cost",),
        evidence_pages=(3, 4, 5),
        misconception_claim=(
            "The student treats variable cost as independent of output, or as "
            "a cost that remains when production is zero."
        ),
        transfer_question=(
            "If a firm produces nothing this week, what happens to total "
            "variable cost, and why?"
        ),
    ),
    ConceptSpec(
        concept_id="marginal_average",
        label="Marginal and average cost",
        aliases=frozenset(
            {
                "marginal cost",
                "average cost",
                "marginal and average cost",
                "mc",
                "ac",
                "atc",
            }
        ),
        confused_with=("Total cost",),
        evidence_pages=(8, 9),
        misconception_claim=(
            "The student does not use the rule that average cost falls when "
            "marginal cost is below it, and rises when marginal cost is above it."
        ),
        transfer_question=(
            "Marginal cost is below average cost. What happens to average "
            "cost as output increases, and why?"
        ),
    ),
    ConceptSpec(
        concept_id="opportunity_cost",
        label="Opportunity cost",
        aliases=frozenset({"opportunity cost"}),
        confused_with=("Explicit and implicit cost",),
        evidence_pages=(3,),
        misconception_claim=(
            "The student describes opportunity cost as money spent rather than "
            "the next-best alternative forgone."
        ),
        transfer_question=(
            "A student spends an hour in lecture instead of paid work. What is "
            "the opportunity cost of attending?"
        ),
    ),
)


class MisconceptionRecord(BaseModel):
    claim: str
    status: MisconceptionStatus
    evidence_pages: list[int] = Field(default_factory=list)
    source_name: str | None = None
    transfer_question: str


class ConceptMemoryRecord(BaseModel):
    concept_id: str
    concept_label: str
    state: ConceptState
    classification: Classification
    attempt_count: int
    confidence_pattern: ConfidencePattern | None = None
    misconception: MisconceptionRecord | None = None
    confused_with: list[str] = Field(default_factory=list)
    next_action: NextAction | None = None
    next_action_label: str
    evidence_pages: list[int] = Field(default_factory=list)


class LearningMemoryResponse(BaseModel):
    concepts: list[ConceptMemoryRecord]
    open_misconception: ConceptMemoryRecord | None = None
    recommended_concept: str | None = None
    next_action: str
    suggested_questions: list[str] = Field(max_length=3)


def normalize_concept_key(label: str) -> str:
    return " ".join(label.lower().split())


def resolve_concept(label: str | None) -> ConceptSpec:
    raw = " ".join((label or "").split())
    if not raw:
        return ConceptSpec(
            concept_id="unknown",
            label="Unlabeled concept",
            aliases=frozenset(),
            confused_with=(),
            evidence_pages=(),
            misconception_claim="This concept still needs another look.",
            transfer_question="Can you explain this idea using only the selected source?",
        )
    key = normalize_concept_key(raw)
    for spec in DEMO_CONCEPT_GRAPH:
        if key == normalize_concept_key(spec.label) or key in spec.aliases:
            return spec
    slug = key.replace(" ", "_")[:40]
    return ConceptSpec(
        concept_id=slug,
        label=raw,
        aliases=frozenset({key}),
        confused_with=(),
        evidence_pages=(),
        misconception_claim="The latest attempt suggests this idea is not yet stable.",
        transfer_question=f"Explain {raw} using a case that is different from the last question.",
    )


def _pages_from_attempt(attempt: dict[str, object]) -> list[int]:
    citations = attempt.get("citations")
    pages: list[int] = []
    if isinstance(citations, list):
        for item in citations:
            if not isinstance(item, dict):
                continue
            page = item.get("page_start")
            if isinstance(page, int) and page >= 1 and page not in pages:
                pages.append(page)
    return pages


def _source_name_from_attempt(attempt: dict[str, object]) -> str | None:
    citations = attempt.get("citations")
    if isinstance(citations, list):
        for item in citations:
            if isinstance(item, dict) and isinstance(item.get("source_name"), str):
                return str(item["source_name"])
    return None


def _action_label(action: NextAction | None, concept_label: str) -> str:
    if action == "counterexample":
        return f"Test the distinction in {concept_label} with a contrast case."
    if action == "teach_back":
        return f"Explain {concept_label} against the source evidence."
    if action == "transfer_question":
        return f"Retest {concept_label} in a different form."
    return f"Keep {concept_label} in rotation until a later check."


def empty_learning_memory(
    default_suggestions: list[str] | None = None,
) -> LearningMemoryResponse:
    suggestions = [item for item in (default_suggestions or []) if item.strip()][:3]
    return LearningMemoryResponse(
        concepts=[],
        next_action="Complete a quiz to reveal what still needs repair.",
        suggested_questions=suggestions,
    )


def overlay_suggested_questions(
    memory: LearningMemoryResponse,
    default_suggestions: list[str] | None = None,
) -> list[str]:
    defaults = [item for item in (default_suggestions or []) if item.strip()]
    prioritized: list[str] = []
    focus = memory.open_misconception or next(
        (item for item in memory.concepts if item.next_action),
        None,
    )
    if focus is not None and focus.misconception is not None:
        prioritized.append(focus.misconception.transfer_question)
    elif focus is not None:
        spec = resolve_concept(focus.concept_label)
        prioritized.append(spec.transfer_question)
    merged: list[str] = []
    for question in [*prioritized, *defaults]:
        if question not in merged:
            merged.append(question)
        if len(merged) == 3:
            break
    return merged


def overlay_follow_up_questions(
    memory: LearningMemoryResponse,
    existing: list[str] | None = None,
) -> list[str]:
    return overlay_suggested_questions(memory, existing)


def build_learning_memory(
    session: DemoSession,
    *,
    default_suggestions: list[str] | None = None,
) -> LearningMemoryResponse:
    records: dict[str, ConceptMemoryRecord] = {}
    for attempt in session.attempts:
        label = attempt.get("concept_label")
        if not isinstance(label, str) or not label.strip():
            continue
        spec = resolve_concept(label)
        current = records.get(spec.concept_id)
        classification = str(attempt.get("classification", "unscored"))
        if (
            current is not None
            and current.classification == "confident_misconception"
            and classification == "unscored"
        ):
            stored_classification = current.classification
        else:
            stored_classification = classification  # type: ignore[assignment]
        pages = _pages_from_attempt(attempt) or list(spec.evidence_pages)
        source_name = _source_name_from_attempt(attempt) or (
            spec.source_name if spec.evidence_pages else None
        )
        activity = str(attempt.get("activity_type") or "")
        missing_count = int(attempt.get("missing_count") or 0)
        check_count = int(attempt.get("check_this_count") or 0)
        next_state, next_pattern, misconception, action = _advance_record(
            current,
            spec=spec,
            classification=classification,  # type: ignore[arg-type]
            activity=activity,
            missing_count=missing_count,
            check_count=check_count,
            pages=pages,
            source_name=source_name,
            missing_points=attempt.get("missing_points"),
        )
        records[spec.concept_id] = ConceptMemoryRecord(
            concept_id=spec.concept_id,
            concept_label=spec.label,
            state=next_state,
            classification=stored_classification,
            attempt_count=(current.attempt_count if current is not None else 0) + 1,
            confidence_pattern=next_pattern,
            misconception=misconception,
            confused_with=list(spec.confused_with),
            next_action=action,
            next_action_label=_action_label(action, spec.label),
            evidence_pages=pages,
        )

    concepts = sorted(
        records.values(),
        key=lambda item: (
            -_priority(item),
            -item.attempt_count,
            item.concept_label,
        ),
    )
    open_misconception = next(
        (
            item
            for item in concepts
            if item.misconception is not None
            and item.misconception.status in {"open", "repairing"}
        ),
        None,
    )
    recommended = open_misconception or next(
        (item for item in concepts if item.state != "stable"),
        None,
    )
    if recommended is None:
        next_action = (
            "Your attempted concepts currently look stable. Recheck later with a new question."
            if concepts
            else "Complete a quiz to reveal what still needs repair."
        )
    else:
        next_action = recommended.next_action_label
    memory = LearningMemoryResponse(
        concepts=concepts,
        open_misconception=open_misconception,
        recommended_concept=(
            recommended.concept_label if recommended is not None else None
        ),
        next_action=next_action,
        suggested_questions=[],
    )
    memory.suggested_questions = overlay_suggested_questions(
        memory,
        default_suggestions,
    )
    return memory


def citation_pages_from_content(content: dict[str, object]) -> list[dict[str, object]]:
    citations: list[dict[str, object]] = []
    for key in ("missing", "check_this", "covered"):
        points = content.get(key)
        if not isinstance(points, list):
            continue
        for point in points:
            if not isinstance(point, dict):
                continue
            items = point.get("citations")
            if isinstance(items, list):
                citations.extend(
                    item for item in items if isinstance(item, dict)
                )
    return citations


def _priority(item: ConceptMemoryRecord) -> int:
    if item.misconception is not None and item.misconception.status == "open":
        return 5
    if item.misconception is not None and item.misconception.status == "repairing":
        return 4
    if item.state == "needs_recheck":
        return 3
    if item.state == "emerging":
        return 2
    return 1


def _advance_record(
    current: ConceptMemoryRecord | None,
    *,
    spec: ConceptSpec,
    classification: Classification,
    activity: str,
    missing_count: int,
    check_count: int,
    pages: list[int],
    source_name: str | None,
    missing_points: object,
) -> tuple[
    ConceptState,
    ConfidencePattern | None,
    MisconceptionRecord | None,
    NextAction | None,
]:
    misconception = current.misconception if current is not None else None
    pattern = current.confidence_pattern if current is not None else None
    missing_claim = None
    if isinstance(missing_points, list):
        texts = [str(item) for item in missing_points if str(item).strip()]
        if texts:
            missing_claim = texts[0]

    if classification == "confident_misconception":
        return (
            "needs_recheck",
            "confident_misconception",
            MisconceptionRecord(
                claim=spec.misconception_claim,
                status="open",
                evidence_pages=pages,
                source_name=source_name,
                transfer_question=spec.transfer_question,
            ),
            "counterexample",
        )
    if classification == "needs_practice":
        if misconception is not None and misconception.status == "open":
            return "needs_recheck", pattern, misconception, "counterexample"
        return "needs_recheck", pattern, misconception, "teach_back"
    if classification == "lucky_guess":
        return (
            "needs_recheck",
            "low_confidence",
            misconception,
            "transfer_question",
        )
    if classification == "mastered":
        if misconception is not None and misconception.status in {
            "open",
            "repairing",
        }:
            updated = misconception.model_copy(update={"status": "rechecked"})
            return "stable", None, updated, None
        return "stable", None, misconception, None
    if activity == "teach_back":
        if missing_count or check_count:
            claim = missing_claim or spec.misconception_claim
            status: MisconceptionStatus = (
                "repairing"
                if misconception is not None
                and misconception.status in {"open", "repairing"}
                else "open"
            )
            return (
                "needs_recheck",
                pattern,
                MisconceptionRecord(
                    claim=claim,
                    status=status,
                    evidence_pages=pages or list(spec.evidence_pages),
                    source_name=source_name or spec.source_name,
                    transfer_question=spec.transfer_question,
                ),
                "counterexample" if check_count else "teach_back",
            )
        if misconception is not None and misconception.status in {
            "open",
            "repairing",
        }:
            updated = misconception.model_copy(update={"status": "rechecked"})
            return "needs_recheck", pattern, updated, "transfer_question"
        return "emerging", pattern, misconception, None
    return (
        current.state if current is not None else "emerging",
        pattern,
        misconception,
        current.next_action if current is not None else None,
    )
