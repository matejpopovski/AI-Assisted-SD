# app/utils/

**Purpose:** stateless helper functions used across the app that don't belong to a single
router, schema, or service — currently just text display formatting.

**Contents:**
- `text_format.py` — `truncate_review_text(text, max_length)`. Implemented (Lecture 4's task):
  shortens text to a preview of at most `max_length` characters for display, appending an
  ellipsis when truncated, backing up to the nearest word boundary (a literal space) rather
  than cutting mid-word, and raising `ValueError` if `max_length < 4`.

**How it fits in:** a plain function, not a class — imported directly wherever a preview needs
to be rendered. This lecture's `POST /reviews` endpoint reuses it as-is to compute
`review_preview` from the submitted `review_text`; no changes to this file are expected.

**Gotchas:** none currently — fully implemented and tested (`tests/test_text_format.py`).
