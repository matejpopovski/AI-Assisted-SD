# host-admin-restructuring

## Problem

The Host and Admin interfaces currently don't reflect who actually does what. Everything a
Host needs — creating games, editing questions, managing a course roster, downloading a
completed session's summary or scores — lives exclusively under `/admin/*`, gated by
`require_admin`. A `USER` granted `HOST` role on a course (via `UserCourseAccess`) can create a
game room and run it live, but cannot manage the game's questions, cannot touch the course
roster, and cannot download anything afterward — they'd need to be a global `ADMIN` for all of
that, which defeats the purpose of a per-course Host role. Separately, a `Game` has no
`course_id`: `RoomCreateRequest` accepts an independent `course_id` and `game_id` with no
enforced relationship, so a game created "for" one course can currently be run inside any other
course a host happens to have both grants for.

T4 fixes both: gives Hosts the five capabilities instructions.md lists, scoped to courses they
actually have `HOST` access to, and enforces that a game belongs to one course. The five,
restated here so this doc is self-contained:

1. Download session summary (HTML)
2. Download session scores (CSV)
3. Roster management (view, CSV upload, activate/deactivate) for courses they host
4. Game management (create games; add/edit/delete/reorder questions and scoring)
5. Course-specific games (a game is only usable/reachable within the course it belongs to)

## Technical Plan

### 1. Database: `Game.course_id`

Add `course_id: int | None` (FK → `courses.id`, `ON DELETE SET NULL`) to `Game`. **Nullable at
the DB level** — this is a new migration on a table that may already have rows (a fresh
install has none, but the grading environment or a team's own testing might), and adding a
`NOT NULL` FK to existing data requires a backfill decision I don't want to force silently.
Required-ness going forward is enforced at the application layer instead:
`GameCreate.course_id: int` (non-optional in the Pydantic schema `admin.py`'s
`create_game` and the new host-facing create-game endpoint both use) means every *newly
created* game always has one; only pre-migration rows can be `NULL`.

Migration: `backend/app/migrations/versions/004_game_course_id.py`, `alembic revision
--autogenerate`, reviewed by hand (autogenerate won't infer the `ON DELETE SET NULL` policy
correctly on its own).

### 2. Backend: new access-control dependency, built on existing helpers

`game_service.py` already has `assert_host_can_use_course(db, user, course_id)` and
`assert_host_can_use_game(db, user, game_id)` — admin bypasses both, non-admin needs
`UserCourseAccess(role=HOST)` / `UserGameAccess` respectively. These are the right foundation;
I'm not inventing a parallel permission system.

**Widen `assert_host_can_use_game`** to accept a host via *either* path: the existing
`UserGameAccess` grant (kept, for backward compatibility with any admin-granted per-game
access and so `tests/integration/conftest.py`'s existing test flow through `create_room`
never breaks), **or** `UserCourseAccess(role=HOST)` on the game's own `course_id` (new — a host
who creates a game for their own course can use it immediately, without an admin needing to
separately grant `UserGameAccess`). Purely additive (an `OR` condition) — cannot make any
currently-passing check fail.

**`create_room`**: keep `RoomCreateRequest` accepting both `course_id` and `game_id`
unchanged (so `conftest.py`'s `create_room(base_url, admin_token, course_id, game_id)` helper
and `test_game_flow.py` keep working without modification). Add one new check: if
`game.course_id is not None` and `game.course_id != course_id`, raise `ConflictError` — a
mismatched pair is now rejected. If `game.course_id is None` (a pre-migration legacy game),
fall back to today's behavior unchanged. This enforces "a game is only accessible to hosts and
players of its course" without a breaking schema change.

**`my_games`** (`game.py`): currently lists games via `UserGameAccess` for non-admins. Add
games reachable via `UserCourseAccess(role=HOST)` → matching `Game.course_id` too (union of
both sets) — same additive-widening principle.

**New dependency in `common/dependencies.py`**, thin wrappers so the new routes can use
`Depends(...)` the way every other route does:

```python
async def require_course_host(
    course_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    await game_service.assert_host_can_use_course(db, user, course_id)
    return user
```

(and a `require_game_host(game_id, ...)` variant calling the widened
`assert_host_can_use_game`). These call the *same* underlying functions `create_room` already
uses — one source of truth for "is this user allowed to act as host here."

### 3. Backend: new host-scoped routes in `game.py`

Added to the existing host-facing router (not a new router, not modifying `admin.py`'s
existing admin-only routes), reusing the exact service-layer functions `admin.py` already
calls:

| Route | Permission | Reuses |
|---|---|---|
| `GET /game/courses/{course_id}/roster` | `require_course_host` | same query as `admin.list_roster` |
| `POST /game/courses/{course_id}/roster` (CSV) | `require_course_host` | `roster_service.process_roster_csv` |
| `PATCH /game/courses/{course_id}/roster/{roster_id}` | `require_course_host` | same as `admin.patch_roster_entry` |
| `POST /game/games` (create) | manual check: `assert_host_can_use_course(db, user, body.course_id)` inside the route (body-based, not path-based — can't be a path `Depends`) | same `Game(...)` construction as `admin.create_game`, plus `course_id` |
| `GET /game/games/{game_id}/questions` | `require_game_host` | same query as `admin.list_questions` |
| `POST` / `PUT` / `DELETE` / `POST .../reorder` question routes | `require_game_host` | identical bodies to `admin.py`'s equivalents (including the `bleach.clean` prompt sanitization and the `order_index` auto-assign logic) |
| `GET /game/sessions/{session_id}/report` (HTML) | same pattern as the existing `export_session_scores`: `user.role != "ADMIN" and session.host_user_id != user.id` → `ForbiddenError` | `report_service.build_session_report` (already used by `admin.py`'s equivalent) — returns `(filename, content)`; wrap identically to `admin.py`'s `session_report`: `Response(content=content, media_type="text/html", headers={"Content-Disposition": f'attachment; filename="{filename}"'})` |

`export_session_scores` (CSV) already exists in `game.py` with exactly this permission
pattern — nothing to add there, just to make sure the host frontend actually calls it (today
nothing does).

**Response schema for the new question routes:** `QuestionResponse` (from `schemas/admin.py`
— includes `config` *and* `answer_data`), **not** `QuestionPublic` (from `schemas/game.py` —
deliberately strips `answer_data` for players). A host authoring/editing a question must see
the answer key; a player must never receive it. Reusing `QuestionPublic` here would be a real
bug, not just an inconsistency — it's the schema `docs/realtime.md` explicitly calls out as
the one guaranteeing "the correct answer is never in the browser," and that guarantee is only
true for the *player*-facing path.

### 4. Frontend: Host app

New pages under `frontend/host/src/pages/` (follow `HomePage.tsx`'s existing
`api`/`Card`/`Button` patterns, not a new styling approach):

- `GamesPage.tsx` — list/create games for a selected course (mirrors admin's `GamesPage.tsx`,
  scoped to `/game/my-courses` + the new `/game/games` create endpoint).
- `QuestionEditorPage.tsx` — add/edit/delete/reorder questions (mirrors admin's, against the
  new `/game/games/{id}/questions` routes).
- `RosterPage.tsx` — view/upload/toggle roster entries for a course the host runs.
- A sessions/history view (new `SessionsPage.tsx`, host-scoped — `my-active-sessions` already
  exists for *active* ones; a completed-sessions list is new) with **Download Summary** (HTML)
  and **Download Scores** (CSV) buttons using `api.download(...)`.

`lib/api.ts` needs `postForm` and `download` ported from `admin`'s copy (see
`frontend/host/src/lib/CLAUDE.md`) before any of the above can upload a CSV or download a file.

`App.tsx` gains routes for the above; `HomePage.tsx` gets navigation links into them (exact nav
shape — a persistent sidebar like admin's `AdminLayout`, or simple in-page links — decided
during implementation, not a hard requirement of this doc).

**Course/game context passing:** follow the admin app's existing URL-param convention exactly
(`/courses/:courseId/roster`, `/games/:gameId/questions`) rather than inventing a new
mechanism — `/games?courseId=X` (or a course picker on the page itself, mirroring
`HomePage.tsx`'s two `<select>`s) for the host games list, `/games/:gameId/questions` for the
question editor, `/roster/:courseId` for roster management. No global "current course" state
needed — each page resolves its own scope from the URL, same as admin does today.

### 5. Frontend: Admin app — admin-first layout

No functional routes are removed — admin keeps every capability it has today. Change
`AdminLayout` in `App.tsx` to visually and structurally prioritize the admin-only concerns
(`Users`, `Courses` — where course/access creation happens) over the host-overlapping ones
(`Games`, `Roster` access via `Courses`, `Sessions`): group the nav into "Admin" (Users,
Courses, Guests) and "Also available" (Games, Sessions) sections, Admin group first and
visually primary. No backend change required for this part — it's routing/layout only.

## Alternatives

- **Duplicate all of `admin.py`'s game/question/roster logic into a new standalone `host.py`
  router with its own permission model.** Rejected — duplicates business logic that's
  currently correct and tested, doubling the maintenance surface and the chance the two copies
  drift. Extending `game.py` (already the host/player router) reuses the same service
  functions both routers already share.
- **Relax `admin.py`'s existing endpoints in place to accept host-or-admin.** Considered — it
  would mean *one* set of routes instead of two. Rejected because it changes the meaning of
  currently-admin-only routes that other tests and the admin frontend depend on exactly as-is,
  and mixes two different audiences' request/response assumptions (e.g. admin's `list_games`
  returns *all* games; a host's equivalent must return only their own). Two thin route sets
  calling one shared service layer is safer and clearer than one route set with branching
  behavior by caller.
- **Remove the independent `course_id` from `RoomCreateRequest`, deriving it from
  `Game.course_id` server-side.** Simpler code, and directly prevents any mismatch by
  construction. Rejected (see Technical Plan §2) because it breaks
  `tests/integration/conftest.py`'s existing `create_room` helper signature and any test built
  on it — an additive validation check achieves the same enforcement without a breaking change
  to shared test infrastructure Matt's T7/T8 tests also use.
- **Make `Game.course_id` `NOT NULL` immediately, backfilling existing games to an arbitrary
  "first course."** Rejected — silently reassigning existing games to a course nobody chose is
  a worse failure mode than a nullable column plus an application-level requirement for new
  games.

## Detailed Implementation

Order of work (each a separate, atomic commit per T1):

1. Migration `004_game_course_id.py` — add nullable `course_id` FK to `games`.
2. `models/game.py` — add `course_id` field + `course` relationship.
3. `schemas/admin.py` — add `course_id: int` to `GameCreate`, `course_id: int | None` to
   `GameResponse`.
4. `services/game_service.py` — widen `assert_host_can_use_game`; add the mismatch check in
   `create_room`; widen `my_games`. (Done before step 5 — the new dependencies call this
   widened function, so it must exist first.)
5. `common/dependencies.py` — add `require_course_host` / `require_game_host`, calling the
   now-widened helpers from step 4.
6. `routers/game.py` — add the new host-scoped routes from the table above.
7. `routers/admin.py` — `create_game` already takes a `GameCreate` body (step 3 makes its
   `course_id` field required), so admin's create-game flow automatically requires a
   `course_id` too, with no separate decision needed — just pass `body.course_id` into the
   `Game(...)` construction alongside the existing fields. The admin `GamesPage.tsx` frontend
   form needs a course `<select>` added so it can supply one (see Frontend below).
8. Frontend: port `postForm`/`download` into `frontend/host/src/lib/api.ts`.
9. Frontend: new host pages (Games, Questions, Roster, Sessions-with-downloads), wired into
   `App.tsx` and linked from `HomePage.tsx`.
10. Frontend: `AdminLayout` nav regrouping in `admin/src/App.tsx`.
11. T5 integration tests (separate file, see `tests/integration/CLAUDE.md` once written) —
    host can manage their own course's roster/games/questions and download reports; host
    **cannot** touch another host's course; a room can't be created with a
    course_id/game_id that don't match once a game has a `course_id` set.

## Edge cases this doc covers

- A pre-migration game with `course_id IS NULL` — `create_room`'s mismatch check no-ops
  (backward compatible), and `assert_host_can_use_game` still honors `UserGameAccess`.
- A host with `UserCourseAccess(role=HOST)` on course A tries to manage a game whose
  `course_id` is course B — `require_game_host` (via widened `assert_host_can_use_game`)
  rejects with `ForbiddenError`, since they have neither `UserGameAccess` for that game nor
  HOST access to course B.
- Admin still bypasses every one of these checks, exactly as today.
- A host CSV-uploads a roster for a course they don't have HOST access to — `require_course_host`
  rejects before `roster_service.process_roster_csv` ever runs.
