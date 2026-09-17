# backend/app/common/

**Purpose:** cross-cutting infrastructure shared by every router — auth dependencies, error
types, logging setup, rate limiting.

**Contents:**
- `dependencies.py` — FastAPI `Depends()` chain for auth. `get_current_user` decodes the JWT
  (from the `Authorization` header or the `access_token` cookie) and loads the `User`.
  `require_admin` narrows to `User.role == "ADMIN"`. `require_user` allows `ADMIN`/`USER`,
  rejects `GUEST`. **No per-course-host dependency exists yet** — every admin-only endpoint
  currently uses `require_admin` even where the actual requirement should be "admin, or a host
  of this specific course/game." T4 adds `require_admin_or_course_host` /
  `require_admin_or_game_host` here.
- `exceptions.py` — `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404),
  `ConflictError` (409) — routers raise these directly; a global handler (see `main.py`) turns
  them into the right HTTP response shape.
- `logging.py` — `structlog` configuration.
- `rate_limit.py` — `slowapi` limiter instance, applied per-route with `@limiter.limit(...)`
  (see `routers/auth.py` for the pattern).

**How it fits in:** every router's endpoint signature includes a `Depends(...)` from here as
its first non-path parameter — that's the whole access-control model. There is no
middleware-based auth; every route opts in explicitly.

**Gotchas:** a route that forgets its `Depends(get_current_user)` (or stronger) is
unauthenticated by default — FastAPI doesn't require it. Always check what a new host-facing
route actually asserts, not just that *a* dependency is present.
