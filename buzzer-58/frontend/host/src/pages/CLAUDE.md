# frontend/host/src/pages/

**Purpose:** every screen in the host app. Currently minimal — this is the directory T4 grows
the most.

**Contents (as of pre-T4):**
- `LoginPage.tsx` — username/password (and dev netid) login.
- `HomePage.tsx` — the *entire* pre-game host experience today: pick a course (`GET
  /game/my-courses`) and a game (`GET /game/my-games`) from two `<select>`s, create a room
  (`POST /game/rooms`), or rejoin/delete an active session. No game creation, no question
  editing, no roster management, no downloads — all of that currently only exists in the
  **admin** app, admin-gated.
- `game/GameLayout.tsx`, `LobbyPage.tsx`, `QuestionPage.tsx`, `ResultsPage.tsx`,
  `GameOverPage.tsx` — the live-game screens, driven by the Socket.io connection (see
  `docs/realtime.md`). Out of T4's scope — these already work and aren't part of the
  restructuring.

**How it fits in:** routed from `App.tsx` (`RequireAuth` wraps everything except `/login`).
`HomePage` is the natural landing point to extend with navigation to new T4 pages, or to split
into a host "home" plus a persistent nav (mirroring `admin/src/App.tsx`'s sidebar `AdminLayout`
pattern) once there's more than one non-game screen.

**Gotchas for T4:** none of the five required host capabilities (session summary/score
downloads, roster management, game/question management, course-specific games) has a page
here yet — this isn't a matter of moving existing host pages, it's building new ones, calling
new or relaxed backend endpoints (see `backend/app/routers/CLAUDE.md`).
