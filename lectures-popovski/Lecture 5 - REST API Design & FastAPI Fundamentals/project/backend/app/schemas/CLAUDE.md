# app/schemas/

**Purpose:** Pydantic models — the data shapes that cross the HTTP boundary (request bodies
and response bodies). Pure data definitions, no behavior.

**Contents:**
- `book.py` — `Book(BaseModel)`: `id: int`, `title: str`, `author: str`,
  `published_year: int`, `description: str`. Used directly as both the storage shape (in
  `book_service._BOOKS`) and the API `response_model` for the books endpoints.
- `review.py` — two models. `ReviewCreate(BaseModel)` is the `POST /reviews` request shape:
  `book_id: int`, `reviewer_name: str`, `rating: int = Field(ge=1, le=5)`, `review_text: str`
  — the `rating` bound and required-ness of every field are enforced here, producing an
  automatic `422` if violated. `Review(ReviewCreate)` is the response shape: everything in
  `ReviewCreate` plus `id: int`, `review_preview: str`, `created_at: datetime`.

**How it fits in:** routers use these as `response_model=...` so FastAPI validates and
serializes responses automatically; services construct and return instances of these models.
Field-level validation (e.g. numeric ranges, required fields) belongs here, expressed as
Pydantic field constraints — FastAPI turns a validation failure into `422` automatically,
before the route body ever runs. `Review` extending `ReviewCreate` (rather than duplicating
its fields) is the pattern for any "input shape plus server-generated fields" schema pair.

**Gotchas:** `Book` doubles as both the in-memory storage record and the API response shape —
fine while the catalog is a hardcoded list; a real DB-backed model (Lecture 6+) would likely
split a storage model from a response schema. `review.py` follows the same single-model-set
approach.
