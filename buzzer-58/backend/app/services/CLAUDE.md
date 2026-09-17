# backend/app/services/

**Purpose:** all business logic and persistence, independent of HTTP — routers call these,
never touch models/DB queries beyond simple `db.get()` lookups directly in a route.

**Contents:**
- `auth_service.py` — password hashing (bcrypt), JWT create/decode (RS256, auto-generated dev
  keys if unset), local/netid/guest user lookup+creation.
- `game_service.py` — the core game engine: room code generation, **access-control helpers**
  `assert_host_can_use_course(db, user, course_id)` and
  `assert_host_can_use_game(db, user, game_id)` (admin bypasses both; non-admin needs
  `UserCourseAccess(role=HOST)` / `UserGameAccess` respectively — see Gotchas), `create_room`
  (calls both, enforces the global room cap, writes `GameSession` + Redis state),
  session lifecycle (`start_game`/`complete_game`/`abandon_game`), `calculate_score` (dispatches
  scoring by `question.type`), `record_answer`, leaderboard/summary builders.
- `state_service.py` — every Redis key/operation for live game state (room, players, current
  question, answered sets, answer-distribution hashes). Pure key-value ops, no business rules.
- `export_service.py` — `build_session_csv` (raw per-question CSV) and `build_canvas_csv`
  (Canvas-gradebook-compatible format with column-title/SIS-domain options).
- `report_service.py` — `build_session_report`: a **self-contained HTML file** (inline
  bar-chart/word-cloud rendering, no external assets) summarizing a session — this is the
  existing engine behind admin's HTML "session report" download, reusable as-is for T4's
  host-facing summary download.
- `roster_service.py` — `process_roster_csv` (Canvas gradebook format) and
  `process_roster_rows` (frontend-mapped rows) — both pure functions of `(db, course_id, ...)`
  with no auth/role logic inside; the caller (router) is entirely responsible for permission
  checks, which is exactly why they're safe to call from a new host-scoped route unchanged.
- `bootstrap.py` — creates the admin account from `ADMIN_USERNAME`/`ADMIN_PASSWORD` on first
  startup, once the DB schema exists.

**How it fits in:** this is where T4's real backend work happens — not new business logic
(roster processing, CSV/HTML building, room creation are all already correct and reusable) but
**new/widened access-control paths** on top of existing functions, plus the `Game.course_id`
addition.

**Gotchas:** `assert_host_can_use_game` currently checks `UserGameAccess` — a per-game grant
**independent of course**, set by an admin via `POST /admin/users/{id}/game-access`. This
predates course-specific games and doesn't yet know about `Game.course_id`. T4 must decide (see
design doc) whether/how course-based host access to a game supplements this, without breaking
existing `UserGameAccess`-based grants or the `create_room` call sites and tests that already
depend on today's independent `course_id`/`game_id` pair.
