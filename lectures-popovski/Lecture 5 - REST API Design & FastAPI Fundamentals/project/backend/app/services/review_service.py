"""In-memory review storage.

Placeholder like `book_service.py` -- Lecture 6 replaces it with a real
database. `id` generation and the list append are guarded by a lock
because FastAPI runs sync route handlers in a threadpool, so concurrent
POST /reviews requests can genuinely interleave here.
"""

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
