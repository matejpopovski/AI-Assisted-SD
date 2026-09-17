"""In-memory mock book catalog.

This is a placeholder -- Lecture 6 replaces it with a real MySQL-backed
service via SQLAlchemy. Deliberately simple for now: this lecture's
actual task lives in `app/utils/text_format.py`, not here.
"""

from app.schemas.book import Book

_BOOKS = [
    Book(
        id=1,
        title="The Pragmatic Programmer",
        author="David Thomas and Andrew Hunt",
        published_year=1999,
        description="A classic guide to practical software craftsmanship, from cutting boilerplate to owning your mistakes.",
    ),
    Book(
        id=2,
        title="Clean Code",
        author="Robert C. Martin",
        published_year=2008,
        description="A handbook of agile software craftsmanship focused on writing code that reads like well-written prose.",
    ),
    Book(
        id=3,
        title="Designing Data-Intensive Applications",
        author="Martin Kleppmann",
        published_year=2017,
        description="A deep dive into the ideas behind reliable, scalable, and maintainable data systems, from replication to stream processing.",
    ),
    Book(
        id=4,
        title="The Mythical Man-Month",
        author="Frederick P. Brooks Jr.",
        published_year=1975,
        description="Essays on software engineering and project management, drawn from the author's experience managing OS/360.",
    ),
    Book(
        id=5,
        title="Structure and Interpretation of Computer Programs",
        author="Harold Abelson and Gerald Jay Sussman",
        published_year=1985,
        description="A foundational text on programming, using Scheme to teach abstraction, recursion, and the nature of computational processes.",
    ),
]


def list_books() -> list[Book]:
    return _BOOKS


def get_book(book_id: int) -> Book | None:
    return next((b for b in _BOOKS if b.id == book_id), None)
