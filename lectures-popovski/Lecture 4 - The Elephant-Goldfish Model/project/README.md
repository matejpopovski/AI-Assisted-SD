# Lecture 4 Activity — Book Review: The Elephant-Goldfish Model

This folder has a working `.claude/` setup — `CLAUDE.md`, `.claude/rules/`, and
`.claude/skills/` — built to practice EGM directly rather than just follow it from memory. Open
**this folder** (`project/`) in VS Code, not the repo root or the `Lecture 4 - ...` folder one
level up — Claude Code only picks up rules/skills from the exact folder it's launched from.

## The Codebase

This is the **first lecture of the Book Review arc** — the same application grows one layer
per lecture through Lecture 9 (API → database → frontend → auth → Docker/Redis/tests). Today
it's a small FastAPI backend with a working `GET /books` endpoint over an in-memory mock
catalog — no database yet, that's Lecture 6.

```
project/
└── backend/
    ├── app/
    │   ├── main.py             FastAPI app, includes the books router
    │   ├── routers/
    │   │   └── books.py         GET /books, GET /books/{id} -- already working
    │   ├── schemas/
    │   │   └── book.py          Pydantic Book model
    │   ├── services/
    │   │   └── book_service.py  in-memory mock catalog of 5 books
    │   └── utils/
    │       └── text_format.py   truncate_review_text() -- TODAY'S TASK, see below
    ├── tests/
    │   ├── test_books_router.py   already passing -- sanity-checks the provided app
    │   └── test_text_format.py    failing until you implement truncate_review_text()
    └── requirements.txt
```

## Grading (10 points)

This lecture grades the EGM process, not just the finished feature:

- **6 pts — Tests.** `pytest tests/ -v` (from `backend/`) passes, scored proportionally.
- **2 pts — EGM artifacts exist.** A context hierarchy (a non-empty `CLAUDE.md` or `README.md`
  in `backend/`, plus at least one more somewhere under `backend/app/`) and a non-empty design
  doc under `docs/plans/`. Existence only — either filename convention counts equally.
- **2 pts — Design doc quality.** Your design doc under `docs/plans/` is read and graded for
  whether it actually describes a specific plan for `truncate_review_text` and engages with at
  least one real edge case — not whether it's exhaustive or polished.

Grading is generous and formative, same as every lecture activity: a genuine, substantive
attempt at each part earns full or near-full credit even if imperfect.

## Pre-Class Work (do this before class)

Run the **`context-hierarchy`** skill (`/context-hierarchy`, or just ask Claude to build it —
the skill covers the procedure and the format). It works bottom-up: deepest source directories
first, verifying each summary before moving to the next, ending at `backend/CLAUDE.md`.

This is the pre-class reading's "README hierarchy" technique — recursive summarization from
leaves to root, so a session can orient in seconds instead of reading the whole codebase — but
built as nested **`CLAUDE.md`** files rather than `README.md` files. Claude Code loads a
subdirectory's `CLAUDE.md` automatically as it reads into that directory, and keeping this
separate from `README.md` means it never competes with the human-facing "how do I get started"
README.md every project in this course already has — including **this file**, `project/README.md`,
which the hierarchy never touches.

The hierarchy covers `app/routers/`, `app/schemas/`, `app/services/`, `app/utils/` (note that
`text_format.py`'s one function isn't implemented yet — its summary should describe the
intended purpose, not pretend it's done), then `app/`, then `backend/`.

Arrive at class with these `CLAUDE.md` files committed.

## Using Claude Code's Permission Modes

Claude Code has a few interaction modes, cycled with **Shift+Tab**. Sessions on Pro/Max/Team
plans now **start in Auto**, so you'll need to switch modes explicitly rather than assume
you're starting from Manual:

- **Auto** (the default) — a background safety classifier approves routine actions for you.
  It can still write code, just with review, so it isn't enough on its own for the phases below.
- **Manual** — every edit and command needs your explicit OK.
- **Accept Edits** — file edits apply automatically; you review the full `git diff` afterward
  instead of approving each change inline.
- **Plan** — fully read-only: Claude can explore and discuss, but literally cannot edit
  anything until you approve its plan. Enter it with `Shift+Tab` (a few presses from Auto) or by
  prefixing a prompt with `/plan`.

**Phases 1–3 of today's activity (design → spec → Goldfish test) should happen in Plan Mode** —
it's the one mode where the No Code Rule is enforced mechanically instead of by willpower. The
`no-code-during-design` rule in `.claude/rules/` is a second layer, but Plan Mode is what
actually blocks the edit. When you're ready to implement (Phase 4), approve the plan (or
`Shift+Tab` out of Plan Mode) and switch to Manual if you want to review each change, or Accept
Edits to move faster and check the diff after.

## In-Class Activity — The Elephant Phase

Your task today is `truncate_review_text(text, max_length)` in `app/utils/text_format.py` —
review lists need to show a short preview of long review text, ending in an ellipsis, without
cutting a word in half.

**Enter Plan Mode** (`Shift+Tab` or `/plan`), then run the **`design-discussion`** skill
(`/design-discussion`) to talk through `truncate_review_text` — it loads the relevant
`CLAUDE.md` context and produces a first-draft proposal; the standing sycophant-challenge rule
handles pushing back on it, but make sure these get surfaced one way or another:

- What happens when the text already fits? Should anything be appended?
- What if `max_length` is too small to fit even one character plus the ellipsis?
- What if there's no word boundary anywhere before the cutoff (one very long word)?
- Should trailing whitespace right before the ellipsis be visible?

Once the design is agreed, run **`write-spec`** (`/write-spec`) to capture it as
`docs/plans/truncate-review-text.md` — precise enough that a fresh Claude session with no other
context could implement it correctly from the doc alone plus the context hierarchy.

Produce `docs/plans/truncate-review-text.md` before the end of class.

## Complete Before Next Lecture

1. **Goldfish test.** Open a brand-new Claude Code session (`/clear`, or a fresh terminal —
   zero prior context), still in **Plan Mode**, and run **`goldfish-test`**
   (`/goldfish-test docs/plans/truncate-review-text.md`). It loads only that spec plus the
   relevant `CLAUDE.md` context (see the skill for why that's the right scope, not literally
   nothing) and runs comprehension/critic/readiness checks. Revise the spec to close whatever
   gap it finds.
2. **Implement** `truncate_review_text` in `app/utils/text_format.py` following the revised
   spec exactly. Now exit Plan Mode — `Shift+Tab` to Manual (review each edit) or Accept Edits
   (apply automatically, check `git diff` after). Read the function's docstring first — it
   pins down the exact behavior the tests check, so if your spec disagrees with it anywhere,
   that's worth noting in your own reflection, but implement to the docstring so the tests
   pass.
3. Run `pytest tests/ -v` — all 12 tests should pass (4 already did; the 8 in
   `test_text_format.py` are the ones your implementation fixes).
4. **Mean code review.** Run **`mean-review`** (`/mean-review`) against your finished
   `text_format.py` — it hunts for every problem with the implementation, not just confirms it
   works. Fix what it finds (re-run the tests after).
5. Push to GitLab.

## How to Run

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # first time only
pip install -r requirements.txt

python -m pytest tests/ -v                             # run the test suite
uvicorn app.main:app --reload                           # run the API -- http://localhost:8000/docs
```

## Git Workflow

```bash
git add "Lecture 4 - The Elephant-Goldfish Model/project"
git commit -m "Implement truncate_review_text() via the Elephant-Goldfish Model"
git push
```

## You Are Done When

- Your context hierarchy (routers/schemas/services/utils/app/top-level, ending at
  `backend/CLAUDE.md`) is committed (see **Grading** above).
- `docs/plans/truncate-review-text.md` exists and describes `truncate_review_text` precisely
  enough for a zero-context Claude session to explain it back correctly (your Goldfish test;
  see **Grading** above).
- `pytest tests/ -v` (run from `backend/`) passes all 12 tests.
- You ran a mean code review on your finished implementation and addressed what it found.
- Your commit is visible on your fork's `main` branch on GitLab.
