# frontend/admin/src/lib/

**Purpose:** shared, non-UI code for the admin app.

**Contents:**
- `api.ts` — the fullest of the three apps' copies: `get/post/put/patch/delete`, `postForm`
  (multipart upload — used by roster CSV upload and game JSON import), and `download` (fetches
  a file response and triggers a browser save using the `Content-Disposition` filename — used
  by session score/report export). This is the reference version `host`'s `api.ts` needs to
  match for T4.
- `utils.ts` — `cn()` classname combiner, same as the other two apps.

**How it fits in:** every admin page imports `{ api }` from here for all backend calls.

**Gotchas:** not shared with `host`/`player` — see `frontend/host/src/lib/CLAUDE.md`.
