# app/routers/

**Purpose:** FastAPI `APIRouter` definitions — the HTTP-facing layer that maps routes to
service calls and turns service results into HTTP responses (including error responses).

**Contents:**
- `books.py` — `router = APIRouter(prefix="/books", tags=["books"])`. `GET /books` returns
  every book via `book_service.list_books()`. `GET /books/{book_id}` looks up one book via
  `book_service.get_book(book_id)` and raises `HTTPException(404, detail="Book not found")`
  when it's `None`.

**How it fits in:** included into the app in `app/main.py` via
`app.include_router(books.router)`. Routers only talk to `app/services/`, never to
`app/schemas/` internals beyond using the Pydantic model as a `response_model` — validation
and serialization are FastAPI/Pydantic's job, not this layer's.

**Gotchas:** none yet — `books.py` is the reference pattern this lecture's design should
follow for any new router (e.g. a future `reviews.py`), not something to modify.
