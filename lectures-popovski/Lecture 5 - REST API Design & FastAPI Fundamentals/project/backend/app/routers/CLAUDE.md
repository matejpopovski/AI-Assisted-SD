# app/routers/

**Purpose:** FastAPI `APIRouter` definitions — the HTTP-facing layer that maps routes to
service calls and turns service results into HTTP responses (including error responses).

**Contents:**
- `books.py` — `router = APIRouter(prefix="/books", tags=["books"])`. `GET /books` returns
  every book via `book_service.list_books()`. `GET /books/{book_id}` looks up one book via
  `book_service.get_book(book_id)` and raises `HTTPException(404, detail="Book not found")`
  when it's `None`.
- `reviews.py` — `router = APIRouter(prefix="/reviews", tags=["reviews"])`.
  `POST /reviews` (`status_code=201`, `response_model=Review`) checks
  `book_service.get_book(data.book_id)`; raises the same `404 "Book not found"` if it's `None`,
  otherwise delegates to `review_service.create_review(data)`. Field-level validation
  (required fields, `rating` 1–5) happens entirely in the `ReviewCreate` schema, before this
  function ever runs.

**How it fits in:** included into the app in `app/main.py` via `app.include_router(...)` for
each router. Routers only talk to `app/services/`, never to `app/schemas/` internals beyond
using a Pydantic model as a `response_model` — validation and serialization are
FastAPI/Pydantic's job, not this layer's.

**Gotchas:** `books.py` is the reference pattern both routers follow — route → service call →
HTTP response/error, nothing more. A router never duplicates checks Pydantic already performs
on the request schema.
