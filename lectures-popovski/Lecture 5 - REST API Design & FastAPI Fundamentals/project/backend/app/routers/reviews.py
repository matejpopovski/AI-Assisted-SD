from fastapi import APIRouter, HTTPException

from app.schemas.review import Review, ReviewCreate
from app.services import book_service, review_service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=Review, status_code=201)
def create_review(data: ReviewCreate):
    if book_service.get_book(data.book_id) is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return review_service.create_review(data)
