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
