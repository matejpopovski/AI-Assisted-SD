"""Text formatting utilities for review display.

See ../../../docs/plans/truncate-review-text.md for this module's design rationale.
"""


def truncate_review_text(text: str, max_length: int) -> str:
    """Truncate `text` to at most `max_length` characters for display in a
    review list, appending an ellipsis ("...") when truncation occurs,
    without ever splitting a word in half.

    If `text` already fits within `max_length` characters, it is returned
    unchanged -- no ellipsis is appended. Otherwise the text is cut so the
    result (including the appended "...") is at most `max_length`
    characters, backing up to the nearest earlier word boundary (a literal
    space) rather than cutting mid-word. If no word boundary exists before
    the cutoff (one long unbroken word), falls back to a hard character
    cut. Any whitespace immediately before the ellipsis is stripped.

    Args:
        text: the review text to display.
        max_length: the maximum length of the returned string; must be at
            least 4 (room for one real character plus "...").

    Returns:
        `text` unchanged, or a truncated version ending in "...".

    Raises:
        ValueError: if `max_length` is less than 4.
    """
    if max_length < 4:
        raise ValueError("max_length must be at least 4")
    if len(text) <= max_length:
        return text

    cutoff = max_length - len("...")
    if text[cutoff] == " ":
        candidate = text[:cutoff].rstrip()
    else:
        stripped = text[:cutoff].rstrip()
        last_space = stripped.rfind(" ")
        candidate = stripped[:last_space] if last_space != -1 else stripped
    return candidate + "..."
