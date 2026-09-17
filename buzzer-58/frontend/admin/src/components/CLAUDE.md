# frontend/admin/src/components/

**Purpose:** presentational primitives for the admin app — same shape and same raw-Tailwind
styling approach as `frontend/host/src/components/CLAUDE.md` describes; see that file for the
T9 token-migration note (applies identically here).

**Contents:** `ui/button.tsx`, `ui/card.tsx`, `ui/input.tsx` — no `TimerBar` here (admin has no
live-game screens).

**How it fits in:** every admin page composes these directly; there's no admin-specific
component beyond the primitives (e.g. no shared "data table" component — each page like
`GamesPage.tsx` builds its own list/table markup inline).

**Gotchas:** T4's admin-first restructuring will likely add new shared pieces here (e.g. a
sidebar nav item component, if `AdminLayout` in `App.tsx` grows beyond a hardcoded `<nav>`).
