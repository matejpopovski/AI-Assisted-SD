# Lecture 5 Activity — Book Review: A REST Endpoint from Scratch

This folder carries the same `.claude/` setup as Lecture 4 — `.claude/rules/` and
the EGM skills (`context-hierarchy`, `design-discussion`, `write-spec`, `goldfish-test`,
`mean-review`). Open **this folder** (`project/`) in VS Code, not the repo root, so Claude Code
picks them up. Your context hierarchy from Lecture 4 does not carry over — refresh it here first
(`/context-hierarchy`), since `text_format.py` is now implemented and the hierarchy should say so.

## The Codebase

Continuing the Book Review arc from Lecture 4. `truncate_review_text()` is now implemented
(that was last lecture's task) — today you're adding a genuinely new endpoint on top of it.

```
project/
├── .claude/                EGM rules + skills, same as Lecture 4
├── docs/plans/             your design doc goes here
└── backend/
    ├── app/
    │   ├── main.py             FastAPI app -- you'll register your new router here
    │   ├── routers/
    │   │   └── books.py         GET /books, GET /books/{id} -- the pattern to follow
    │   ├── schemas/
    │   │   └── book.py          the pattern to follow for your new Review schema(s)
    │   ├── services/
    │   │   └── book_service.py  the pattern to follow for your new review service
    │   └── utils/
    │       └── text_format.py   truncate_review_text() -- already implemented
    ├── tests/
    │   ├── test_books_router.py   already passing
    │   ├── test_text_format.py    already passing
    │   └── test_reviews_router.py TODAY'S TASK -- all 7 tests fail until you build the endpoint
    └── requirements.txt
```

**Before touching any code**, ask Claude Code to walk you through `app/routers/books.py`,
`app/schemas/book.py`, and `app/services/book_service.py` — that three-file pattern
(router / schema / service) is what you're about to repeat for reviews.

## In-Class Activity — The Elephant Phase

Design `POST /reviews` in prose, before writing any code. **Enter Plan Mode** (`Shift+Tab` or
`/plan`), then run **`/design-discussion`** and make sure the conversation settles these:

1. What does the request body need? What does a successful response look like?
2. What HTTP status code signals success? What should happen if the `book_id` doesn't
   correspond to a real book?
3. **Apply the sycophant challenge** — what validation is Claude's first proposal missing?
   (Rating bounds? A required field with no default?) The standing rule in `.claude/rules/`
   should surface this unprompted; if it doesn't, ask.
4. Run **`/write-spec`** to capture the agreed design as `docs/plans/post-reviews.md` — a new
   file, not an edit to Lecture 4's `truncate-review-text.md`. One file per feature.

### The fixed contract

This is a self-checked activity, so the endpoint's *observable behavior* is fixed — your
design discussion should arrive here, not somewhere else. Use this to check your own design
against, and as the target `tests/test_reviews_router.py` actually verifies:

<div style="font-size: 0.95em">

| | |
|---|---|
| **Route** | `POST /reviews` |
| **Request body** | `book_id: int`, `reviewer_name: str`, `rating: int` (1–5), `review_text: str` |
| **Success** | `201 Created` |
| **Response body** | request fields, plus `id: int`, `review_preview: str`, `created_at` |
| **`review_preview`** | `truncate_review_text(review_text, 100)` — reuse Lecture 4's function |
| **Invalid `rating`** (outside 1–5) or missing field | `422 Unprocessable Entity` |
| **Unknown `book_id`** | `404 Not Found`, body `{"detail": "Book not found"}` — same message `GET /books/{id}` already uses |

</div>

## Complete Before Next Lecture

1. **Goldfish test.** Fresh Claude session (`/clear`), still in Plan Mode, run
   `/goldfish-test docs/plans/post-reviews.md`. Revise the spec to close whatever gap it finds.
2. **Implement** the endpoint — a new `app/schemas/review.py`, `app/services/review_service.py`,
   and `app/routers/reviews.py`, following the `books.py`/`book.py`/`book_service.py` pattern,
   registered in `app/main.py`. Data is in-memory only (a module-level list) — no database
   until Lecture 6. Exit Plan Mode first (`Shift+Tab` to Manual or Accept Edits).
3. Run `pytest tests/ -v` — all 19 tests should pass (12 already did; the 7 in
   `test_reviews_router.py` are the ones your endpoint fixes).
4. **Verify via Swagger UI** (`http://localhost:8000/docs`) that `POST /reviews` is documented
   correctly and matches the contract above.
5. **Mean code review.** Run `/mean-review` against your new router/service/schema; fix what it
   finds and re-run the tests.
6. Push to GitLab.

## How to Run

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # first time only
pip install -r requirements.txt

python -m pytest tests/ -v
uvicorn app.main:app --reload                           # http://localhost:8000/docs
```

## Git Workflow

```bash
git add "Lecture 5 - REST API Design & FastAPI Fundamentals/project"
git commit -m "Implement POST /reviews"
git push
```

## You Are Done When

- `docs/plans/post-reviews.md` describes the `POST /reviews` contract precisely
  (Goldfish-tested).
- `pytest tests/ -v` (run from `backend/`) passes all 19 tests.
- You ran a mean code review on the finished endpoint and addressed what it found.
- Swagger UI at `/docs` shows `POST /reviews` correctly documented.
- Your commit is visible on your fork's `main` branch on GitLab.
