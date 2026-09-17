---
paths:
  - "src/**/*.ts"
description: Require deltaTime-scaled movement instead of raw per-frame pixel offsets
---

# Frame-Independent Movement

Every per-frame position or progress update in this codebase must scale by p5's `deltaTime`
(milliseconds since the last frame), not advance by a fixed raw number every call. A raw
per-frame increment ties speed to frame rate — the same code runs faster on a 144Hz display
than a 30Hz one, silently changing gameplay (enemies reaching the base faster, projectiles
missing that would otherwise hit) for reasons that have nothing to do with balance.

## The required pattern

```ts
this.distanceTraveled += this.speed * (deltaTime / 1000);
```

`speed` is expressed in units per **second** (see `ENEMY_SPEED`, `PROJECTILE_SPEED` in
`Constants.ts`); dividing `deltaTime` by 1000 converts milliseconds to seconds so the constant
means what its name says regardless of how often `update()` gets called.

## Where this already applies

- `Enemy.update(deltaTime)` — advances `distanceTraveled` along the `Path`.
- `Projectile.update(deltaTime, path)` — steps `x`/`y` toward the target's current position,
  clamped by `Math.min(step, distance)` so it can't overshoot in a single large-`deltaTime`
  frame.

Follow this same shape for any new moving entity. A per-frame **timing** accumulator that
counts elapsed milliseconds toward a fixed threshold (e.g. `WaveSpawner.msSinceLastSpawn`
counting up to `ENEMY_SPAWN_INTERVAL_MS`) is a different, also-correct use of `deltaTime` —
it isn't a position update and doesn't need the `/ 1000` conversion, since it's being compared
against a millisecond constant, not a per-second speed.

## Reject on sight

```ts
// WRONG — moves the same number of pixels every call, regardless of frame rate
this.x += 5;
this.distanceTraveled += 2;
```

If you see a moving entity's position, distance, or progress incremented by a bare literal or
a constant that isn't multiplied by `deltaTime` (scaled to seconds when compared against a
per-second speed), flag it — don't silently "fix" it by guessing the right speed; ask what
per-second rate was intended, since a raw offset carries no such information on its own.

This codebase's own convention is documented in `CLAUDE.md` under "Frame-independent movement
via `deltaTime`" — this rule enforces that convention while editing `src/**/*.ts`.
