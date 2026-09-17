# backend/app/schemas/

**Purpose:** Pydantic request/response models — the HTTP contract layer. `model_config =
ConfigDict(extra="forbid")` on every input schema (unknown fields are a `422`, not silently
dropped).

**Contents:**
- `auth.py` — login/token/guest-join request+response shapes.
- `admin.py` — the admin-facing CRUD contract: `CourseCreate/Update/Response`,
  `RosterEntryResponse`/`RosterUploadResult`/`RosterEntryPatch`/`RosterImportPayload`,
  `GameCreate/Update/Response`, `QuestionCreate/Update/Response` (the interesting one —
  `QuestionCreate.validate_structure()` is a `model_validator` enforcing per-`type` shape
  rules on `config`/`answer_data`, e.g. `multiple_choice` needs an `options` list and, under
  `ACCURACY` grading, an `answer_points` list of matching length), `QuestionReorder`,
  `UserCreate/Update/Response`, `CourseAccessGrant`/`GameAccessGrant`, `AdminSessionItem`.
- `game.py` — the player/host-facing contract: `QuestionPublic` (deliberately omits
  `answer_data` and `grading_type` — what a player's browser is allowed to see),
  `RoomCreateRequest/Response`, `ActiveSessionItem`, `RoomInfoResponse`, `MyCourseItem`,
  `MyGameItem`, `ScoreResult` (internal, not an API response).

**How it fits in:** a router's request body type IS one of these classes; FastAPI validates
against it before the route function runs. `QuestionCreate`'s validator is the single source of
truth for "is this question well-formed" — both `admin.py`'s create/update endpoints and JSON
game-file import go through it.

**Gotchas:** `QuestionCreate` has no `course_id` — it's nested under `/admin/games/{game_id}/questions`,
so course scoping comes from the parent `Game`, not the question itself. When T4 adds
`Game.course_id`, `GameCreate`/`GameResponse` need a `course_id` field too — a host must
specify (and see) which course a game belongs to.
