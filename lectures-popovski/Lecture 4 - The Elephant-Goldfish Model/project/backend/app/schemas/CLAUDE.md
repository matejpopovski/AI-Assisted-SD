# app/schemas/

**Purpose:** Pydantic models — the data shapes that cross the HTTP boundary (request bodies
and response bodies). Pure data definitions, no behavior.

**Contents:**
- `book.py` — `Book(BaseModel)`: `id: int`, `title: str`, `author: str`,
  `published_year: int`, `description: str`. Used directly as both the storage shape (in
  `book_service._BOOKS`) and the API `response_model` for the books endpoints.

**How it fits in:** routers (`app/routers/`) use these as `response_model=...` so FastAPI
validates and serializes responses automatically; services (`app/services/`) construct and
return instances of these models.

**Gotchas:** `Book` currently doubles as both the in-memory storage record and the API
response shape — fine while the catalog is a hardcoded list, but a real DB-backed model
(Lecture 6+) would likely need to separate a storage model from a response schema.
