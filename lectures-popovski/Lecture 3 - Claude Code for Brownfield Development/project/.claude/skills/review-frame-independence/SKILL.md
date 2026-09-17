---
name: review-frame-independence
description: Review a code diff in this Tower Defense Lite codebase for frame-rate-dependent movement bugs — raw per-frame position increments instead of deltaTime-scaled speed
---

# Review Frame Independence

Given a diff (staged changes, a branch vs. `main`, or a specific set of edited files), check
whether any changed movement/update code broke frame-independent motion. This is a review
skill — it reports findings, it does not fix them itself unless the user asks it to.

## Procedure

1. **Inspect only the changed movement/update code.** Look at the diff, not the whole file —
   scope the review to what actually changed. Focus on any `update(deltaTime: number, ...)`
   method (or new method with a similar shape) on a class that owns a position, distance, or
   progress field — `Enemy`, `Projectile`, `Tower`, or any new entity class.

2. **Detect raw per-frame position increments.** Flag any line that changes `x`, `y`,
   `distanceTraveled`, `progress`, or an equivalent field by:
   - a bare numeric literal (`this.x += 5;`)
   - a constant not multiplied by `deltaTime` (`this.x += SOME_SPEED;`)
   - `deltaTime` used but not converted to seconds where it's multiplied against a per-second
     speed constant (e.g. `this.speed * deltaTime` without `/ 1000`, which would move 1000x
     too far per frame)

3. **Verify the required shape.** The correct pattern in this codebase is:
   ```ts
   this.<field> += this.speed * (deltaTime / 1000);
   ```
   or, for a value that chases a live target rather than moving in a fixed direction (see
   `Projectile.update`), a step computed the same way and then clamped so it can't overshoot:
   ```ts
   const step = this.speed * (deltaTime / 1000);
   const travel = Math.min(step, distance);
   ```
   Confirm any new or changed movement code matches one of these two shapes rather than
   inventing a third.

4. **Check against the specific Enemy/Projectile conventions**, per `CLAUDE.md` and
   `.claude/rules/frame-independent-movement.md`:
   - `Enemy` must store `distanceTraveled` along the `Path`, not raw `x`/`y` — a diff that adds
     `x`/`y` fields directly to `Enemy` or bypasses `Path.pointAtDistance()` breaks the "single
     source of truth for geometry" convention, independent of the frame-rate issue.
     `Enemy.progress` (used by `Tower.findTarget()` to pick the biggest threat) must keep
     returning `distanceTraveled` directly.
   - `Projectile` must re-read `target.positionOn(path)` **every** call to `update()`, not
     cache the target's position at spawn time or at the start of the diff's new logic — a
     cached position silently breaks "a fast enemy can outrun a slow projectile" even if the
     `deltaTime` scaling is otherwise correct.
   - A plain **timing accumulator** (like `WaveSpawner.msSinceLastSpawn` counting toward
     `ENEMY_SPAWN_INTERVAL_MS`) is not a position update — don't flag `msSinceLastSpawn +=
     deltaTime;` as missing a `/ 1000`; it's correctly compared against a millisecond constant,
     not a per-second speed.

5. **Report findings clearly.** For each issue found, state:
   - the file and line
   - what the code currently does (quote it)
   - why it's frame-rate-dependent (what breaks at a different frame rate)
   - the minimal corrected version
   If nothing is wrong, say so plainly — don't manufacture a finding to seem thorough.

6. **Avoid making unrelated changes.** Do not reformat, refactor, rename, or "clean up" code
   outside the scope of the frame-independence question, and do not touch files the diff
   didn't change. If a fix is requested, apply only the deltaTime-scaling correction itself.
