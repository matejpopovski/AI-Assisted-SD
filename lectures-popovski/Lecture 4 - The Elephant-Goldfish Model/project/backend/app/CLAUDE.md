# app/

**Purpose:** the FastAPI application package — a small, layered Book Review API. Four
sub-packages, each with its own `CLAUDE.md`: `routers/`, `schemas/`, `services/`, `utils/`.

**Contents:**
- `main.py` — creates the `FastAPI` app, registers `books.router`, and exposes `GET /health`.
- `routers/` — HTTP layer: route → service call → HTTP response/error. See `routers/CLAUDE.md`.
- `schemas/` — Pydantic data shapes crossing the HTTP boundary. See `schemas/CLAUDE.md`.
- `services/` — business logic / data access, HTTP-agnostic. See `services/CLAUDE.md`.
- `utils/` — standalone helpers with no dependency on the other layers; currently just review
  text truncation (`truncate_review_text`, implemented). See `utils/CLAUDE.md`.

**How it fits in:** the layering is strict and one-directional — `routers` depend on
`services` and `schemas`; `services` depend on `schemas`; `utils` depends on nothing else in
`app/`. A request flows `main.py` → matching router → service → schema-validated response.

**Gotchas:** the books catalog (`services/book_service.py`) is an intentional in-memory
placeholder until Lecture 6 adds a real database — don't design anything in `utils/` or a
future router around it being permanent.
