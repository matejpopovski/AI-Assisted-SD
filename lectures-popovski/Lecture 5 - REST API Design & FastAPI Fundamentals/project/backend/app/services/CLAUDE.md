# app/services/

**Purpose:** business logic and data access, isolated from HTTP concerns — routers call
these functions and translate their results (or absence of a result) into responses.

**Contents:**
- `book_service.py` — an in-memory mock catalog: `_BOOKS`, a hardcoded list of 5 `Book`
  instances. `list_books()` returns all of them. `get_book(book_id)` returns the matching
  `Book` or `None` (never raises — the router decides that `None` means a 404).
- `review_service.py` — an in-memory list `_REVIEWS: list[Review]`, empty at startup.
  `create_review(data: ReviewCreate) -> Review` builds a `Review` (id via
  `len(_REVIEWS) + 1`, `review_preview` via `truncate_review_text(review_text, 100)`,
  `created_at` via `datetime.now(timezone.utc)`), appends it, and returns it. The id
  computation and append are guarded by a module-level `threading.Lock` — FastAPI runs sync
  routes in a threadpool, so this is a real race without the lock, not just a theoretical one.

**How it fits in:** the only thing a router calls. Returns domain objects or `None`/raises
nothing HTTP-specific — a service function never raises `HTTPException` itself, keeping HTTP
status decisions in the router layer.

**Gotchas:** `book_service.py` is explicitly a placeholder — its own module docstring says
Lecture 6 replaces it with a real MySQL-backed service via SQLAlchemy; `review_service.py`
carries the same assumption. `review_service.create_review` does not check that `book_id`
refers to a real book — that check happens in `app/routers/reviews.py`, before this function
is ever called.
