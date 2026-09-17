# backend/

**Purpose:** the Book Review API — a FastAPI backend, first layer of the Book Review arc
(Lectures 4–9: API → database → frontend → auth → Docker/Redis/tests). Today (Lecture 4) it's
an in-memory `GET /books` API plus one unimplemented utility function.

**Contents:**
- `app/` — the application package (FastAPI app, routers, schemas, services, utils). See
  `app/CLAUDE.md` for the full breakdown.
- `tests/` — one file per concern: `test_books_router.py` (sanity-checks the provided app),
  `test_text_format.py` (exercises `truncate_review_text`). All 12 tests pass. `conftest.py`
  provides shared pytest fixtures (e.g. the FastAPI `TestClient`).
- `requirements.txt` — `fastapi`, `uvicorn[standard]`, `pytest`, `httpx`.

**How it fits in:** run with `uvicorn app.main:app --reload` from this directory; tested with
`pytest tests/ -v` from this directory. This is the root of the source-code context
hierarchy — everything under `app/` is summarized bottom-up into this file.

**Gotchas:** this lecture's task, `truncate_review_text` in `app/utils/text_format.py`, is now
implemented per `docs/plans/truncate-review-text.md`. The rest of the app (`routers/`,
`schemas/`, `services/`) is provided, working reference code to read for patterns, not to
modify.
