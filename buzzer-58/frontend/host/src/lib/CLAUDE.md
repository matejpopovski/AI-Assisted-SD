# frontend/host/src/lib/

**Purpose:** shared, non-UI code for the host app.

**Contents:**
- `api.ts` — thin fetch wrapper. `api.get/post/put/patch/delete` all JSON; token comes from
  `localStorage.getItem('token')`, sent as `Authorization: Bearer`. Throws `Error(detail)` on
  any non-2xx response (`detail` from the FastAPI error body). **Currently missing** `postForm`
  (multipart upload) and `download` (blob-download with filename from
  `Content-Disposition`) — both already exist in `frontend/admin/src/lib/api.ts` and need to be
  ported here for T4 (roster CSV upload, session summary/score downloads).
- `utils.ts` — `cn()`, a `clsx`-style classname combiner used by every `components/ui/*`.

**How it fits in:** every page imports `{ api }` from here instead of calling `fetch`
directly. Keeping `admin`'s and `host`'s `api.ts` in sync (same capabilities, not necessarily
identical code) matters as host gains admin-like capabilities in T4.

**Gotchas:** the three frontend apps (`host`, `player`, `admin`) each have their **own copy**
of `lib/api.ts`, `lib/utils.ts`, and `components/ui/*` — there's no shared package. A fix or
feature added to one app's copy doesn't propagate to the others automatically.
