# backend/app/routers/

**Purpose:** HTTP endpoints — the only layer that knows about FastAPI, status codes, and auth
dependencies. Delegates all real logic to `services/`.

**Contents:**
- `health.py` — `/api/health`, no auth.
- `auth.py` — `/api/auth/*`: local login, OAuth2 callback (netid via Traefik header), temp→full
  token exchange, guest join, refresh, logout. Issues JWTs via `auth_service`.
- `admin.py` — `/api/admin/*`, **every route gated by `require_admin`**: courses, roster,
  games, questions (create/update/delete/reorder/export/import), local user accounts, guest
  merge, course/game access grants, all-sessions view + CSV/HTML export. This is currently
  where *all* game/question/roster management and session export lives — T4 doesn't move it,
  but adds host-reachable equivalents elsewhere (see below) so hosts don't need admin rights.
- `game.py` — `/api/game/*`, gated by `require_user` (or public for room-code pings): the
  **host- and player-facing** router. `my-courses`/`my-games`/`my-active-sessions` (host
  resource discovery), room creation/lookup, session delete, guest-merge-by-host, and
  `export_session_scores` (CSV) — this last one is the existing precedent for "host or admin,
  scoped to their own session," reused as the model for T4's new host endpoints.

**How it fits in:** `main.py` mounts each router under its own prefix. The
`admin.py`/`game.py` split is really an *admin-only* vs. *host-or-player* split, not a
REST-resource split — both routers touch `Game`/`Question`/`CourseRoster`.

**T4 plan (see `docs/plans/host-admin-restructuring.md`):** add new host-scoped routes to
`game.py` (roster view/upload/patch, game create, question CRUD/reorder, session HTML report)
that call the **same service-layer functions** `admin.py` already uses, gated by a new
`require_admin_or_course_host` / `require_admin_or_game_host` dependency built on the existing
`game_service.assert_host_can_use_course`/`assert_host_can_use_game` helpers — not a parallel
permission system.

**Gotchas:** `admin.py`'s `delete_game`/`delete_user` manually clean up dependent rows
(`SessionScore`, `GameSession`) before deleting, because those FKs are `NOT NULL` and
SQLAlchemy's default cascade would fail otherwise — any new delete path needs the same care
(see T5's note about resource-limit test failures tracing back to missing cleanup).
