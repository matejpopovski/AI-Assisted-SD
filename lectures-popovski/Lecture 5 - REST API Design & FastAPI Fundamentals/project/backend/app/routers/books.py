from fastapi import APIRouter, HTTPException

from app.schemas.book import Book
from app.services import book_service

router = APIRouter(prefix="/books", tags=["books"])


@router.get("", response_model=list[Book])
def get_books():
    return book_service.list_books()


@router.get("/{book_id}", response_model=Book)
def get_book(book_id: int):
    book = book_service.get_book(book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book
