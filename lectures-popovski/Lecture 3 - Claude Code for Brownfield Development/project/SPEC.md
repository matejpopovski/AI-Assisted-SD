# SPEC.md

Feature specification for the existing behavior of Tower Defense Lite, as implemented in
`src/`. This document describes what the game *does*, derived from the current source and
test suite — it does not propose or imply any new behavior.

Default values referenced below live in `src/Constants.ts`.

## Tower placement

- The player places a tower by clicking anywhere on the canvas (`Main.ts`'s
  `mousePressed()` calls `Game.placeTower(mouseX, mouseY)`).
- `Game.placeTower(x, y)` succeeds only if `Economy.canAfford(TOWER_COST)` is true. On
  success it spends `TOWER_COST` gold and pushes a new `Tower` at `(x, y)`; it returns
  `true`.
- If the player can't afford `TOWER_COST`, no gold is spent, no tower is created, and the
  method returns `false`. `Main.ts` logs a message to the console in this case.
- There is no restriction on *where* a tower can be placed — it can be placed on top of the
  path, on top of another tower, or anywhere else on the canvas. There is no minimum
  distance or collision check between towers.
- A newly placed tower uses the default `range`, `damage`, and `fireIntervalMs` from
  `Constants.ts` (`TOWER_RANGE`, `TOWER_DAMAGE`, `TOWER_FIRE_INTERVAL_MS`) unless
  constructed with explicit overrides (only done in tests).

## Tower cost and economy behavior

- The player starts with `STARTING_GOLD` (100) gold.
- Placing a tower costs `TOWER_COST` (20) gold, deducted immediately on placement.
- Killing an enemy rewards the player `ENEMY_REWARD` (5) gold, credited when the enemy's
  health drops to 0 or below (see "Enemy movement and health").
- `Economy.spend(cost)` throws if called when the balance is less than `cost` — callers
  (`Game`) are required to check `canAfford()` first; `Economy` itself does not clamp or
  silently no-op.
- Gold has no upper bound and there is no cost inflation — every tower placement costs
  exactly `TOWER_COST`, regardless of how many towers already exist.

## Targeting behavior

- Each `Tower` locks onto a single `Enemy` at a time and keeps firing at it until that
  enemy dies or leaves the tower's range — it does not re-evaluate its target on every
  shot.
- When a tower needs a new target (no current target, or the current target died or left
  range), it calls `findTarget()`, which scans all enemies and picks the one that:
  - is not dead (`isDead()` is false),
  - is within `range` pixels of the tower (straight-line distance from the tower's
    position to the enemy's current position on the path), and
  - among those, has traveled the furthest along the path (`progress`, i.e. distance
    traveled) — not the enemy geometrically nearest to the tower.
- If no enemy qualifies, `findTarget()` returns `null` and the tower has no target that
  frame.
- Locking on prevents fire from being redirected every shot to whichever enemy just
  entered range; a tower only re-acquires once its current lock becomes invalid (dead or
  out of range).

## Tower firing/cooldown behavior

- Every tower has a cooldown (`fireIntervalMs`, default `TOWER_FIRE_INTERVAL_MS` = 400ms)
  that must reach zero before it can fire again.
- Each frame, `Tower.tryFire(enemies, path, deltaTime)`:
  1. Decrements the cooldown by `deltaTime`.
  2. If the cooldown is still above 0, returns `null` (no shot fired).
  3. Otherwise, validates the current lock-on target (alive and in range); if invalid,
     calls `findTarget()` to acquire a new one.
  4. If no target is found, returns `null` without resetting the cooldown.
  5. If a target is found, resets the cooldown to `fireIntervalMs` and returns that enemy.
- A fresh tower (cooldown starts at 0) can fire on the very first frame a target is in
  range.
- `Game.update()` turns each non-null value returned by `tryFire()` into a new
  `Projectile` spawned at the tower's position, aimed at the returned enemy, carrying the
  tower's `damage`.

## Projectile behavior

- A `Projectile` is created at the firing tower's `(x, y)` with a reference to its target
  `Enemy`, a `damage` amount (copied from the tower), and a `speed` (default
  `PROJECTILE_SPEED` = 240 px/s).
- Each frame, `Projectile.update(deltaTime, path)` re-reads the target's *current*
  position on the path (not a fixed point captured at spawn time) and steps toward it by
  `speed * (deltaTime / 1000)` pixels, clamped so it never overshoots past the target's
  current position in a single frame.
- Because it re-aims every frame, a projectile can miss/chase indefinitely if the target
  outruns it (target speed ≥ projectile speed).
- A projectile has hit its target once the distance between the projectile and the
  target's current position is ≤ `PROJECTILE_HIT_RADIUS` (6px).
- `Game.resolveHits()` runs once per frame: for every projectile whose `hasHitTarget()` is
  true, it applies `projectile.damage` to `projectile.target` via `takeDamage()` and
  removes the projectile from the live list. Projectiles that haven't hit yet are kept.
- A projectile does not know or care whether its target is already dead when it hits —
  `takeDamage()` is called unconditionally on impact (health can go further negative, but
  this has no additional effect since `isDead()` only checks `health <= 0`).

## Enemy movement and health

- Each `Enemy` is created with a `speed` (default `ENEMY_SPEED` = 60 px/s) and `health`
  (default `ENEMY_HEALTH` = 30).
- An enemy does not store x/y directly; it stores `distanceTraveled` along the fixed
  `Path`, incremented each frame by `speed * (deltaTime / 1000)`.
- `Enemy.positionOn(path)` converts `distanceTraveled` into a screen position via
  `Path.pointAtDistance()`, which walks the path's waypoint segments and linearly
  interpolates within the segment containing that distance; once `distanceTraveled`
  reaches or exceeds the path's `totalLength`, the position clamps to the final waypoint.
- `Enemy.progress` exposes `distanceTraveled` directly — this is what towers use to decide
  which enemy is the bigger threat (furthest along wins).
- `takeDamage(amount)` subtracts `amount` from `health` with no floor.
- `isDead()` is true once `health <= 0`.
- `hasReachedEnd(path)` is true once `distanceTraveled >= path.totalLength`.

## Wave structure and spawning

- `WaveSpawner` spawns enemies at a fixed cadence: one new `Enemy` every
  `ENEMY_SPAWN_INTERVAL_MS` (900ms), up to `ENEMIES_PER_WAVE` (8) enemies per wave, for a
  total of `WAVE_COUNT` (3) waves.
- Every enemy spawned uses the default `Enemy` constructor (`ENEMY_SPEED`,
  `ENEMY_HEALTH`) — waves do not currently scale enemy stats up over time.
- `WaveSpawner.update(deltaTime)` accumulates elapsed time; once it reaches or exceeds
  `ENEMY_SPAWN_INTERVAL_MS`, it resets the accumulator, spawns one `Enemy`, and returns it
  (returns `null` on every other frame). Only one enemy can be spawned per call to
  `update()`, regardless of how large `deltaTime` is.
- After a spawn, once `ENEMIES_PER_WAVE` enemies have been spawned in the current wave,
  the per-wave counter resets to 0 and the wave counter advances by 1 — the next wave's
  spawning begins immediately (no pause or gap between waves).
- Once `currentWave > WAVE_COUNT`, `allWavesComplete()` is true and `update()` stops
  spawning (always returns `null`).
- `waveNumber` (used for the HUD) reports the current wave number, clamped to never exceed
  `WAVE_COUNT`.

## Lives

- The player starts with `STARTING_LIVES` (10) lives, tracked by `GameState`.
- Whenever an enemy reaches the end of the path (`hasReachedEnd()` true) before dying,
  `Game.resolveEnemies()` calls `GameState.loseLife()` and removes that enemy from the
  live list — it does not grant gold.
- `loseLife()` decrements `lives` by 1. If `lives` reaches 0 or below, it is clamped to 0
  and the game's `status` transitions to `LOST`.
- `loseLife()` is a no-op once the game is no longer `PLAYING` (i.e., already won or lost)
  — lives cannot go negative and status cannot change after game-over.

## Win conditions

- The game transitions to `WON` when `GameState.checkWin(allWavesComplete,
  enemiesRemaining)` is called with `allWavesComplete` true (all `WAVE_COUNT` waves have
  finished spawning) **and** `enemiesRemaining === 0` (no enemies currently alive on the
  path).
- This check runs once per frame at the end of `Game.update()`, after enemies have been
  spawned, moved, damaged, and resolved (kills/leaks removed) for that frame.
- `checkWin()` is a no-op if the game has already left the `PLAYING` state (already won or
  lost) — status cannot change again once decided.

## Loss conditions

- The game transitions to `LOST` the moment `lives` is decremented to 0 or below (see
  "Lives" above) — this can happen mid-wave, as soon as the tenth life-losing leak occurs.
- Once `status` is `LOST` (or `WON`), `GameState.isGameOver()` returns `true`, and
  `Game.update()` short-circuits immediately on its next call — no further spawning,
  movement, firing, or resolution happens. The game state (towers, enemies, projectiles,
  gold) simply freezes at whatever it was on the frame the game ended.
- There is no separate "you lose if a wave times out" or similar condition — losing is
  driven entirely by lives reaching 0.
