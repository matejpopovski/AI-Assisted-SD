# frontend/admin/src/pages/

**Purpose:** every screen in the admin app. This is the directory T4 restructures (not grows —
its capabilities mostly stay, but its layout priority and some route ownership changes).

**Contents:**
- `CoursesPage.tsx` — list/create courses; links into `RosterPage.tsx` per course. **Stays
  admin-first** — course creation is explicitly an admin-only capability per T4.
- `RosterPage.tsx` — view a course's roster, upload a CSV, toggle `is_active`. Currently
  admin-only (`/admin/courses/{id}/roster`); T4 adds a **host-facing equivalent** scoped to
  courses the host has HOST access to — the admin page itself doesn't need to change much
  beyond staying reachable as the admin path into the same underlying data.
- `UsersPage.tsx` / `UserDetailPage.tsx` — local account CRUD + per-user course/game access
  grants (`CourseAccessGrant`/`GameAccessGrant` — this is *where a user becomes a HOST*).
  **Stays admin-only** and becomes primary in the T4 admin-first layout.
- `GuestsPage.tsx` — view/merge/delete guest accounts. Admin-only, secondary.
- `GamesPage.tsx` — list/create/edit/delete games, import JSON, links into
  `QuestionEditorPage.tsx`. Calls `GET/POST /admin/games`. **T4 adds a host-facing equivalent**
  scoped to the host's own courses' games — same underlying `Game`/`Question` data, a new
  host-side entry point.
- `QuestionEditorPage.tsx` — add/edit/delete/reorder questions within one game, export JSON.
  Same T4 treatment as `GamesPage.tsx` — host needs this too, scoped to their own games.
- `SessionsPage.tsx` — view all completed sessions across all hosts, download CSV/HTML report.
  Stays admin-only (all-sessions view); the **host-facing equivalent already partially exists**
  server-side (`game.py`'s `export_session_scores`) but has no page here yet — T4 adds one, and
  a matching HTML-report download.

**How it fits in:** routed + laid out by `AdminLayout` in `App.tsx` (sidebar `NavLink`s,
currently Courses/Users/Games/Guests/Sessions in that order — no visual priority signal beyond
order). T4's "admin-first" requirement means reordering/grouping so Users/Courses/access-grants
read as primary and Games/Roster/Sessions (host-overlapping capabilities) read as secondary,
without removing any of admin's own access to them.

**Gotchas:** every one of these pages currently calls the `require_admin`-gated `/admin/*`
routes directly — none of that changes for the admin app itself; T4's backend work is additive
(new host-scoped routes/permission paths), not a rewrite of what admin already does.
