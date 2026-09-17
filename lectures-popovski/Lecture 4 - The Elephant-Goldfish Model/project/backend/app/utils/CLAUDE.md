# app/utils/

**Purpose:** stateless helper functions used across the app that don't belong to a single
router, schema, or service — currently just text display formatting.

**Contents:**
- `text_format.py` — `truncate_review_text(text, max_length)`. Implemented per
  `docs/plans/truncate-review-text.md`: shortens a review's text to a preview of at most
  `max_length` characters for display in a review list, appending an ellipsis when truncated,
  backing up to the nearest word boundary (a literal space) rather than cutting mid-word, and
  raising `ValueError` if `max_length < 4`.

**How it fits in:** a plain function, not a class — imported directly wherever a review
preview needs to be rendered (a future reviews router/service, per the Book Review arc's
plan). No dependency on FastAPI, Pydantic, or any other layer.

**Gotchas:** the function's docstring in `text_format.py` pins the exact behavior the test
suite checks (word-boundary truncation, trailing-whitespace handling, the `max_length < 4`
error case) — any design doc for this function must match the docstring, not invent different
behavior.
