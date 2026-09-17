# post-reviews

## Problem

Reviewers need a way to submit a review for a book. The API needs a `POST /reviews` endpoint
that accepts a review, validates it, stores it, and returns it with a generated id, a
truncated preview, and a creation timestamp.

## Technical Plan

Add a new router/schema/service trio, following the existing `books.py` /
`book.py` / `book_service.py` pattern:

- **`app/schemas/review.py`** — two Pydantic models:
  - `ReviewCreate` (request body): `book_id: int`, `reviewer_name: str`, `rating: int`
    (constrained `ge=1, le=5` via `Field`), `review_text: str`.
  - `Review` (response body): all of `ReviewCreate`'s fields, plus `id: int`,
    `review_preview: str`, `created_at: datetime`.
- **`app/services/review_service.py`** — a module-level in-memory list `_REVIEWS: list[Review]`
  (mirrors `book_service._BOOKS`) and one function:
  - `create_review(data: ReviewCreate) -> Review` — builds a `Review` with
    `id = len(_REVIEWS) + 1`, `review_preview = truncate_review_text(data.review_text, 100)`,
    `created_at = datetime.now(timezone.utc)`, appends it to `_REVIEWS`, returns it. The id
    computation and the append are guarded by one `threading.Lock` — see Concurrency below.
  - Does **not** check that `book_id` refers to a real book — that's the router's job (see
    below), keeping the service HTTP-agnostic, matching `book_service.get_book` returning
    `None` rather than raising.

### Concurrency

FastAPI runs a sync `def` route handler in a threadpool, so two concurrent `POST /reviews`
requests genuinely can interleave inside `create_review` — `id = len(_REVIEWS) + 1` is a
real read-then-append race under that model, not just a theoretical one. Guard the
id-computation-and-append with a single module-level `threading.Lock()` in
`review_service.py` so each call gets a unique id even under concurrent requests. Everything
else about the in-memory list (durability, no real persistence) remains an accepted
placeholder until Lecture 6.
- **`app/routers/reviews.py`** — `router = APIRouter(prefix="/reviews", tags=["reviews"])`,
  one route:
  - `POST ""`, `status_code=201`, `response_model=Review`, body param typed `ReviewCreate`.
  - First calls `book_service.get_book(data.book_id)`; if `None`, raises
    `HTTPException(404, detail="Book not found")` — same message `GET /books/{id}` uses.
  - Otherwise calls `review_service.create_review(data)` and returns the result.
- **`app/main.py`** — register the new router: `app.include_router(reviews.router)`.

`rating`'s 1–5 bound and every required field are enforced by Pydantic on `ReviewCreate`
*before* the route function runs — FastAPI returns `422` automatically for those cases, so the
route body never has to check them. The route body only ever has to check the one thing
Pydantic can't validate on its own: whether `book_id` refers to a real book.

## Alternatives

- **Validate `book_id` existence inside the Pydantic schema** (e.g. a custom validator that
  looks up the book). Rejected — schemas shouldn't depend on service-layer state; keeping the
  book lookup in the router matches how `GET /books/{id}` already does it and keeps
  `ReviewCreate` a pure data shape.
- **Return a plain dict instead of a `Review` response model.** Rejected — `Book` already
  establishes the schema-as-`response_model` pattern; a plain dict would lose automatic
  response validation and OpenAPI documentation for no benefit.
- **Track a separate incrementing counter for review ids instead of `len(_REVIEWS) + 1`.**
  Equivalent in behavior since there's no delete endpoint; rejected only for being an extra
  piece of state to keep in sync with the list, not because it's wrong.

## Detailed Implementation

```python
# app/schemas/review.py
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    book_id: int
    reviewer_name: str
    rating: int = Field(ge=1, le=5)
    review_text: str


class Review(ReviewCreate):
    id: int
    review_preview: str
    created_at: datetime
```

```python
# app/services/review_service.py
import threading
from datetime import datetime, timezone

from app.schemas.review import Review, ReviewCreate
from app.utils.text_format import truncate_review_text

_REVIEWS: list[Review] = []
_lock = threading.Lock()


def create_review(data: ReviewCreate) -> Review:
    with _lock:
        review = Review(
            **data.model_dump(),
            id=len(_REVIEWS) + 1,
            review_preview=truncate_review_text(data.review_text, 100),
            created_at=datetime.now(timezone.utc),
        )
        _REVIEWS.append(review)
    return review
```

```python
# app/routers/reviews.py
from fastapi import APIRouter, HTTPException

from app.schemas.review import Review, ReviewCreate
from app.services import book_service, review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=Review, status_code=201)
def create_review(data: ReviewCreate):
    if book_service.get_book(data.book_id) is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return review_service.create_review(data)
```

`app/main.py` additionally imports `reviews` from `app.routers` and calls
`app.include_router(reviews.router)`.

## Edge cases this spec covers

- `review_text` that fits within 100 characters — `review_preview` equals `review_text`
  exactly (delegated entirely to `truncate_review_text`'s own "already fits" case).
- `review_text` over 100 characters — `review_preview` is truncated, ≤100 chars, ends in `...`.
- `rating` of exactly 1 or 5 (boundary-valid) vs. 0 or 6 (rejected, `422`, via Pydantic's
  `Field(ge=1, le=5)` — no manual bounds check in the route).
- A required field (e.g. `reviewer_name`) missing from the request body — `422` via Pydantic,
  before the route body runs.
- `book_id` that doesn't match any book in `book_service` — `404`, `{"detail": "Book not
  found"}`, checked in the route *after* the body has already passed schema validation.
- Multiple reviews created in sequence (including across different test functions sharing one
  `TestClient`/`app` instance) get strictly increasing, unique `id` values, since `_REVIEWS` is
  module-level state that persists for the process's lifetime.

## Out of scope

- Persistence of the in-memory `_REVIEWS` list beyond process lifetime — same placeholder
  status as `book_service._BOOKS` until Lecture 6's real database. (Unique-id generation under
  concurrent requests *is* handled — see Concurrency above; it's specifically persistence and
  multi-process state that remain out of scope.)
- Any validation of `review_text` or `reviewer_name` length or emptiness beyond what's
  required — neither is part of the fixed contract (an empty `reviewer_name` or `review_text`
  is accepted), and no validation is added speculatively for either field.
- Duplicate/repeated review submissions — no idempotency or uniqueness constraint; every valid
  `POST /reviews` call succeeds and gets a new id, even if identical to a prior submission.
