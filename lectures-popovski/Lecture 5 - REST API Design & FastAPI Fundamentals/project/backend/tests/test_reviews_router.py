"""Self-check tests for the POST /reviews endpoint you're building today.

These test the HTTP contract only (not any particular file layout), so
build your routers/schemas/services however your SPEC.md describes it
-- following the pattern already set by app/routers/books.py,
app/schemas/book.py, and app/services/book_service.py is a reasonable
starting point, but the tests below are what actually has to pass.

All of these fail right now (no route registered, so every request 404s
with FastAPI's default "Not Found" detail) -- that's expected until you
wire up the endpoint.
"""


def _valid_payload(**overrides):
    payload = {
        "book_id": 1,
        "reviewer_name": "Ada",
        "rating": 5,
        "review_text": "A genuinely excellent book that changed how I think about writing code.",
    }
    payload.update(overrides)
    return payload


def test_create_review_returns_201_with_expected_shape(client):
    response = client.post("/reviews", json=_valid_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["book_id"] == 1
    assert body["reviewer_name"] == "Ada"
    assert body["rating"] == 5
    assert body["review_text"] == _valid_payload()["review_text"]
    assert "id" in body
    assert "created_at" in body


def test_create_review_includes_truncated_preview(client):
    long_text = "This is a very long review. " * 10  # well over 100 chars
    response = client.post("/reviews", json=_valid_payload(review_text=long_text))
    assert response.status_code == 201
    body = response.json()
    assert body["review_preview"] != long_text
    assert len(body["review_preview"]) <= 100
    assert body["review_preview"].endswith("...")


def test_create_review_for_short_text_preview_matches_full_text(client):
    short_text = "Loved it!"
    response = client.post("/reviews", json=_valid_payload(review_text=short_text))
    assert response.status_code == 201
    assert response.json()["review_preview"] == short_text


def test_rating_out_of_range_is_rejected(client):
    response = client.post("/reviews", json=_valid_payload(rating=6))
    assert response.status_code == 422

    response = client.post("/reviews", json=_valid_payload(rating=0))
    assert response.status_code == 422


def test_missing_required_field_is_rejected(client):
    payload = _valid_payload()
    del payload["reviewer_name"]
    response = client.post("/reviews", json=payload)
    assert response.status_code == 422


def test_unknown_book_id_returns_404(client):
    response = client.post("/reviews", json=_valid_payload(book_id=999))
    assert response.status_code == 404
    # A route that doesn't exist yet also 404s -- the detail is what proves
    # *your* code looked the book up and didn't find it.
    assert response.json()["detail"] == "Book not found"


def test_each_review_gets_a_unique_id(client):
    first = client.post("/reviews", json=_valid_payload()).json()
    second = client.post("/reviews", json=_valid_payload()).json()
    assert first["id"] != second["id"]
