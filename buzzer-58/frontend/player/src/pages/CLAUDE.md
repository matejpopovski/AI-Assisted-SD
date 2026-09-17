# frontend/player/src/pages/

**Purpose:** every screen in the player app. Out of scope for T4 (no host/admin restructuring
touches this app), but fully in scope for **T9 theming** — must get both light/dark themes and
stay thumb-friendly on mobile.

**Contents:**
- `JoinPage.tsx` — enter a room code (no login required — this is the guest entry point).
- `LoginPage.tsx` — authenticated login (local account or netid dev-login), for players who
  want their scores tied to a real account instead of a guest.
- `NamePage.tsx` — guest display-name entry, shown after `JoinPage` if not authenticated.
- `game/GameLayout.tsx` — opens the Socket.io connection for the joined room (see
  `docs/realtime.md`); wraps the rest.
- `game/LobbyPage.tsx`, `QuestionPage.tsx`, `FeedbackPage.tsx`, `ResultsPage.tsx`,
  `GameOverPage.tsx` — the live-game sequence. `QuestionPage.tsx` renders whichever question
  `type` is active — this is also where T7's two new question types plug into the player side.

**How it fits in:** routed from `App.tsx`, no auth guard on most routes (`RequireAuth` doesn't
exist here the way it does in `host` — joining is meant to be frictionless for guests).

**Gotchas for T9:** this is the app most likely to be used on a phone mid-class — theming here
needs to hold up in bright rooms and small screens, not just look right on a desktop browser.
