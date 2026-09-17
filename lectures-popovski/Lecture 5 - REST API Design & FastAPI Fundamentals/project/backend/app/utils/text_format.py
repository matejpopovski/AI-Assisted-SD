"""Text formatting utilities for review display."""


def truncate_review_text(text: str, max_length: int) -> str:
    """Truncate `text` to at most `max_length` characters, appending an
    ellipsis ("...") when truncation occurs, without cutting a word in
    half. See Lecture 4's SPEC.md-driven design for the full rationale.

    Behavior:
      - If `text` already fits within `max_length`, return it unchanged.
      - Otherwise, cut at `max_length - 3` characters. If that cut point
        already falls on a word boundary (or lands at the end of the
        string), keep the slice as-is (stripped of trailing whitespace).
        If it falls mid-word, back up to the last space in the slice
        instead -- or keep a hard cut if there's no space at all.
      - Always append "...".

    Raises:
        ValueError: if `max_length` is less than 4.
    """
    if max_length < 4:
        raise ValueError("max_length must be at least 4 (room for at least one character plus '...')")
    if len(text) <= max_length:
        return text
    cutoff = max_length - 3
    if cutoff >= len(text) or text[cutoff] == " ":
        candidate = text[:cutoff].rstrip()
    else:
        stripped = text[:cutoff].rstrip()
        last_space = stripped.rfind(" ")
        candidate = stripped[:last_space] if last_space > 0 else stripped
    return candidate + "..."
