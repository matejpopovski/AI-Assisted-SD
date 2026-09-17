"""Sanity checks for the already-working GET /books endpoint.

These should pass before you touch any code -- run them first to
confirm the provided starter is in a good state.
"""


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_books_returns_all_books(client):
    response = client.get("/books")
    assert response.status_code == 200
    books = response.json()
    assert len(books) == 5
    assert {b["title"] for b in books} == {
        "The Pragmatic Programmer",
        "Clean Code",
        "Designing Data-Intensive Applications",
        "The Mythical Man-Month",
        "Structure and Interpretation of Computer Programs",
    }


def test_get_single_book(client):
    response = client.get("/books/1")
    assert response.status_code == 200
    assert response.json()["title"] == "The Pragmatic Programmer"


def test_get_missing_book_returns_404(client):
    response = client.get("/books/999")
    assert response.status_code == 404
