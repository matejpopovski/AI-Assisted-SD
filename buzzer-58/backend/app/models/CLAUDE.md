# backend/app/models/

**Purpose:** SQLAlchemy ORM models — the persistent schema. Every table Buzzer has.

**Contents:**
- `user.py` — `User`: global identity + global `role` (`ADMIN`/`USER`/`GUEST`). Local accounts
  (`username`/`password_hash`) and netid-based accounts (OAuth2/dev-login) share this table;
  netid is nullable so guests/local accounts can omit it.
- `course.py` — `Course` (a semester offering), `CourseRoster` (one row per enrolled
  netid/name/email, `is_active` toggle, unique per `(course_id, netid)`), and
  `UserCourseAccess` (composite PK `user_id`+`course_id`, a *per-course* `role` of
  `HOST`/`PLAYER` — separate from `User.role`). A user can be globally `USER` but `HOST` on one
  course and `PLAYER` on another.
- `game.py` — `Game` (a quiz: title/description/max_players), `Question` (belongs to one
  `Game`, has `type`, `grading_type` (`ACCURACY`/`COMPLETENESS`), `prompt`, JSON `config`
  (player-visible shape) and JSON `answer_data` (server-only correct answer/scoring — never
  serialized to a player), `order_index`), and `UserGameAccess` (grants a user the ability to
  run a specific game, independent of course).
- `session.py` — `GameSession` (one played instance of a `Game` in a `Course`, has
  `room_code`, `status`, `host_user_id`) and `SessionScore` (one row per player per question
  answered in a session).

**How it fits in:** `routers/` never touch the DB directly except via `Depends(get_db)` +
these models; `services/` contain the actual query/mutation logic.

**Gotchas (as of T4 work):** `Game` currently has **no `course_id`** — a game and a session's
`course_id` are chosen independently at room-creation time (`RoomCreateRequest` takes both
`game_id` and `course_id` with no enforced relationship). T4 adds `Game.course_id` (nullable at
the DB level for backward compatibility with any pre-existing rows; enforced required by the
`GameCreate` schema for all new games going forward) so a game is only usable within its own
course. See `docs/plans/host-admin-restructuring.md`.
