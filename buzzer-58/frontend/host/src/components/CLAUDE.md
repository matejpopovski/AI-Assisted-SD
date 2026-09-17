# frontend/host/src/components/

**Purpose:** presentational building blocks, no data-fetching.

**Contents:**
- `ui/button.tsx`, `ui/card.tsx`, `ui/input.tsx` — small primitives (variant/size props via
  `cn()`). Every color is a **raw Tailwind utility** (`bg-indigo-600`, `text-slate-100`,
  `border-slate-600`, ...) applied directly in the `variant === '...' && '...'` branches —
  there is no semantic token layer yet. This is exactly what T9 replaces: these files become
  the first place raw palette classes turn into `bg-surface`, `text-primary`, etc.
- `ui/TimerBar.tsx` — the countdown bar shown during a question; likely has its own hardcoded
  color (e.g. a fixed progress-bar fill) worth checking during T9's token migration.

**How it fits in:** `pages/` compose these; there's no intermediate "feature component" layer
yet. T4's new host pages (game management, roster management) will need new components here
(a question-type editor form, a roster table row) — follow the existing `ui/*` primitive shape
rather than introducing a different styling approach.

**Gotchas:** identical files exist in `frontend/admin/src/components/ui/` and
`frontend/player/src/components/ui/`, copy-pasted rather than shared — a token-layer change
(T9) has to be applied to all three copies, not just one.
