# frontend/player/src/components/

**Purpose:** presentational primitives for the player app — `ui/button.tsx`, `ui/card.tsx`,
`ui/input.tsx`, `ui/TimerBar.tsx`, same raw-Tailwind-utility styling as `host`'s and `admin`'s
copies (see `frontend/host/src/components/CLAUDE.md` for the T9 token-migration note — applies
identically here, and this app's `TimerBar` is the most player-visible/time-critical piece to
get right in both themes).

**Gotchas:** a third independent copy — see `frontend/host/src/lib/CLAUDE.md` for why that
matters (no shared package across the three apps).
