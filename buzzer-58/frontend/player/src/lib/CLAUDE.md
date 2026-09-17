# frontend/player/src/lib/

**Purpose:** shared, non-UI code for the player app.

**Contents:**
- `api.ts` — same minimal shape as `host`'s pre-T4 copy (`get/post/put/patch/delete`, no
  `postForm`/`download` — players never upload or download files).
- `utils.ts` — `cn()` classname combiner.

**Gotchas:** independent copy, not shared with `host`/`admin` — see
`frontend/host/src/lib/CLAUDE.md`.
