from luma_spikes.citations import sanitize_visible_text


def test_sanitize_strips_bracketed_and_bare_chunk_ids() -> None:
    text = (
        "Sparse matrices store mostly zeros. "
        "[1d0ba653-0b57-56a6-9292-9fb1043e0fa3] "
        "Use triplet form "
        "(91561db0-1111-4111-8111-1234567890ab)."
    )

    cleaned = sanitize_visible_text(text)

    assert "1d0ba653" not in cleaned
    assert "91561db0" not in cleaned
    assert "[" not in cleaned
    assert "Sparse matrices store mostly zeros." in cleaned
    assert "Use triplet form." in cleaned
