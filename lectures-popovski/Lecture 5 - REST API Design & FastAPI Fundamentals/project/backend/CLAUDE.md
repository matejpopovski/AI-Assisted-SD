# backend/

**Purpose:** the Book Review API — a FastAPI backend, continuing the Book Review arc
(Lectures 4–9: API → database → frontend → auth → Docker/Redis/tests). As of Lecture 5: an
in-memory `GET /books` API, `truncate_review_text` (Lecture 4), and `POST /reviews`
(this lecture's task) — all implemented and tested.

**Contents:**
- `app/` — the application package (FastAPI app, routers, schemas, services, utils). See
  `app/CLAUDE.md` for the full breakdown.
- `tests/` — one file per concern: `test_books_router.py`, `test_text_format.py`,
  `test_reviews_router.py` (the HTTP contract for `POST /reviews`). All 19 tests pass.
  `conftest.py` provides the shared `client` fixture (a `TestClient` over the app; state is
  **not** reset between tests within a run, since it wraps a single shared `app` instance —
  review IDs must stay unique across the whole test session, not just within one test; see
  `services/CLAUDE.md` for how `review_service` guarantees that).
- `requirements.txt` — `fastapi`, `uvicorn[standard]`, `pytest`, `httpx`.

**How it fits in:** run with `uvicorn app.main:app --reload` from this directory; tested with
`pytest tests/ -v` from this directory.

**Gotchas:** `docs/plans/post-reviews.md` documents the `POST /reviews` design, including why
id generation needs a lock. `books.py`/`book.py`/`book_service.py` remain the reference
pattern for structure, not to modify.
