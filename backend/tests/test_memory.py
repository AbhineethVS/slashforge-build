from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from luma_api.memory import (
    build_learning_memory,
    overlay_follow_up_questions,
    resolve_concept,
)
from luma_api.sessions import DemoSession


def _session_with_attempts(*attempts: dict[str, object]) -> DemoSession:
    now = datetime(2026, 9, 3, tzinfo=timezone.utc)
    session = DemoSession(
        id=uuid4(),
        created_at=now,
        expires_at=now,
    )
    session.attempts.extend(attempts)
    return session


def test_costs_label_maps_to_demo_concept_graph() -> None:
    spec = resolve_concept("Costs")
    assert spec.concept_id == "explicit_implicit"
    assert spec.label == "Explicit and implicit cost"


def test_open_misconception_drives_shared_memory_and_suggestions() -> None:
    session = _session_with_attempts(
        {
            "concept_label": "Costs",
            "activity_type": "quiz",
            "classification": "confident_misconception",
            "citations": [
                {
                    "source_name": "Economics - Theory of Cost.pdf",
                    "page_start": 2,
                }
            ],
        }
    )
    memory = build_learning_memory(
        session,
        default_suggestions=["What is explicit cost?", "What is implicit cost?"],
    )

    assert memory.open_misconception is not None
    assert memory.open_misconception.state == "needs_recheck"
    assert memory.open_misconception.misconception is not None
    assert memory.open_misconception.misconception.status == "open"
    assert memory.open_misconception.misconception.evidence_pages == [2]
    assert memory.suggested_questions[0] == (
        memory.open_misconception.misconception.transfer_question
    )
    follow_ups = overlay_follow_up_questions(
        memory,
        ["How does implicit cost differ?"],
    )
    assert follow_ups[0] == memory.suggested_questions[0]
    assert "How does implicit cost differ?" in follow_ups


def test_teach_back_then_mastered_recheck_closes_misconception() -> None:
    session = _session_with_attempts(
        {
            "concept_label": "Total cost",
            "activity_type": "quiz",
            "classification": "confident_misconception",
            "citations": [{"page_start": 4, "source_name": "Economics notes"}],
        },
        {
            "concept_label": "Total cost",
            "activity_type": "teach_back",
            "classification": "unscored",
            "missing_count": 1,
            "check_this_count": 0,
            "missing_points": ["Total cost is TFC plus TVC."],
            "citations": [{"page_start": 4, "source_name": "Economics notes"}],
        },
    )
    repairing = build_learning_memory(session)
    assert repairing.open_misconception is not None
    assert repairing.open_misconception.misconception is not None
    assert repairing.open_misconception.misconception.status == "repairing"

    session.attempts.append(
        {
            "concept_label": "Total cost",
            "activity_type": "quiz",
            "classification": "mastered",
            "citations": [{"page_start": 4}],
        }
    )
    repaired = build_learning_memory(session)
    assert repaired.open_misconception is None
    assert repaired.concepts[0].state == "stable"
    assert repaired.concepts[0].misconception is not None
    assert repaired.concepts[0].misconception.status == "rechecked"


def test_empty_session_memory_keeps_default_suggestions() -> None:
    memory = build_learning_memory(
        _session_with_attempts(),
        default_suggestions=["What is explicit cost?"],
    )
    assert memory.concepts == []
    assert memory.open_misconception is None
    assert memory.suggested_questions == ["What is explicit cost?"]
