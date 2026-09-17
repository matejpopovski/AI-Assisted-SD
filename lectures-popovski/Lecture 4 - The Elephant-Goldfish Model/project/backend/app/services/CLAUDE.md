# app/services/

**Purpose:** business logic and data access, isolated from HTTP concerns — routers call
these functions and translate their results (or absence of a result) into responses.

**Contents:**
- `book_service.py` — an in-memory mock catalog: `_BOOKS`, a hardcoded list of 5 `Book`
  instances. `list_books()` returns all of them. `get_book(book_id)` returns the matching
  `Book` or `None` (never raises — the router decides that `None` means a 404).

**How it fits in:** the only thing `app/routers/books.py` calls. Returns domain objects
(`Book`) or `None`, not HTTP-specific values — a service function never raises
`HTTPException` itself, keeping HTTP status decisions in the router layer.

**Gotchas:** explicitly a placeholder — its own module docstring says Lecture 6 replaces this
with a real MySQL-backed service via SQLAlchemy. Don't build anything that assumes `_BOOKS` is
permanent or that `get_book`'s O(n) scan matters; both are intentionally disposable.
