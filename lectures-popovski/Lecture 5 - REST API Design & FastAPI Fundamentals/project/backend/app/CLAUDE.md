# app/

**Purpose:** the FastAPI application package — a small, layered Book Review API. Sub-packages,
each with its own `CLAUDE.md`: `routers/`, `schemas/`, `services/`, `utils/`.

**Contents:**
- `main.py` — creates the `FastAPI` app and registers both `books.router` and
  `reviews.router`, plus `GET /health`.
- `routers/` — HTTP layer: route → service call → HTTP response/error. See `routers/CLAUDE.md`.
- `schemas/` — Pydantic data shapes crossing the HTTP boundary. See `schemas/CLAUDE.md`.
- `services/` — business logic / data access, HTTP-agnostic. See `services/CLAUDE.md`.
- `utils/` — standalone helpers with no dependency on the other layers; `truncate_review_text`,
  implemented. See `utils/CLAUDE.md`.

**How it fits in:** the layering is strict and one-directional — `routers` depend on
`services` and `schemas`; `services` depend on `schemas`; `utils` depends on nothing else in
`app/`. A request flows `main.py` → matching router → service → schema-validated response. The
books trio (`routers/books.py`, `schemas/book.py`, `services/book_service.py`) is the reference
pattern the reviews trio (`routers/reviews.py`, `schemas/review.py`,
`services/review_service.py`) follows.

**Gotchas:** the books catalog and the reviews list are both intentional in-memory
placeholders until Lecture 6 adds a real database. `review_service.create_review` doesn't
check `book_id` validity itself — `routers/reviews.py` does, before calling it.
