# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See @SPEC.md for the full feature specification.

## Overview

A small TypeScript + p5.js tower defense game ("Tower Defense Lite"). Enemies spawn in
waves and walk a fixed path from the left edge toward the player's base; clicking on the
canvas places a tower (if affordable), which auto-targets and shoots the nearest-to-the-base
enemy in range. The player loses a life per enemy that reaches the base, loses at 0 lives,
and wins once all waves are cleared with no enemies left alive.

## Commands

```bash
npm install        # first-time setup

npm run start       # tsc --watch + browser-sync, live-reloads the browser at localhost
npm run test        # vitest run — full suite, once
npm run test:watch  # vitest in watch mode
npm run format       # prettier --write src/ and tests/
npm run format:check # prettier --check, no writes
npm run lint          # eslint on src/**/*.ts
npm run lint:fix      # eslint --fix
```

Run a single test file with `npx vitest run tests/Tower.test.ts`.

Before committing: **test → format → lint**, in that order — this matches the CI/CD checks
run on Project merge requests.

## Architecture

`Game` (src/Game.ts) owns every subsystem and is the **only** place they interact.
Each subsystem is otherwise ignorant of the others (Enemy doesn't know about Tower, Tower
doesn't know about Economy) — so understanding a single frame only requires reading
`Game.update()`, not tracing through every class:

1. `WaveSpawner.update()` may return a freshly spawned `Enemy`.
2. Every `Enemy.update()` advances it along the `Path`.
3. Every `Tower.tryFire()` checks its cooldown/target and may return an `Enemy` to shoot,
   which `Game` turns into a `Projectile`.
4. Every `Projectile.update()` chases its target's current position.
5. `Game.resolveHits()` applies projectile damage to targets that were hit and drops those
   projectiles.
6. `Game.resolveEnemies()` rewards gold for kills (via `Economy`) and deducts a life for
   leaks (via `GameState`), dropping both from the live list.
7. `GameState.checkWin()` checks whether all waves are done and no enemies remain.

Tower placement happens outside this per-frame loop, in `Game.placeTower(x, y)`: it checks
`Economy.canAfford(TOWER_COST)`, spends the gold, and pushes a new `Tower` — called from
`Main.ts`'s `mousePressed()` on every click.

`Main.ts` is the p5.js entry point: `setup()`, `draw()`, and `mousePressed()` are exported
and wired onto `window` by `index.html` for p5 to call directly (p5's global mode).
`draw()` calls `game.update(deltaTime)` then `game.draw()` every frame.

### Key conventions

- **Frame-independent movement via `deltaTime`.** Every per-frame update takes p5's
  `deltaTime` (milliseconds since the last frame) and scales movement by
  `speed * (deltaTime / 1000)` rather than a fixed per-frame pixel offset — see
  `Enemy.update()` and `Projectile.update()`. This keeps motion consistent regardless of
  frame rate. When adding new moving behavior, follow this pattern rather than incrementing
  position by a raw constant per call.
- **`update()` / `draw()` split.** Every entity (`Enemy`, `Tower`, `Projectile`, `Game`
  itself) separates simulation (`update()`) from rendering (`draw()`). Tests only exercise
  `update()` and other logic methods — `draw()` calls p5 drawing primitives (`fill`,
  `circle`, etc.) and is not tested.
- **All balance numbers live in `src/Constants.ts`**, grouped by subsystem (Economy,
  Player, Waves, Enemy, Tower, Projectile). Tuning the game should never require touching
  logic files — only this file.
- **`Enemy` stores distance traveled along the `Path`, not x/y.** `Path.pointAtDistance()`
  is the single source of truth for converting progress into a screen position
  (`Enemy.positionOn(path)`). This keeps "how far has this enemy gotten" — a plain number
  used for both movement and Tower's targeting priority — independent of path geometry.
- **Towers lock onto a target and hold it** until it dies or leaves range, rather than
  re-picking the "best" enemy every shot (see the comment in `Tower.ts` for why: naive
  re-picking causes fire to keep getting redirected to newer, closer enemies and nothing
  ever dies). When a new target is needed, `findTarget()` prefers the in-range enemy with
  the greatest `progress` (closest to the base), not the geometrically nearest one.
- **Projectiles chase a live position, not a snapshot.** `Projectile.update()` re-reads its
  target's current `positionOn(path)` every frame, so a fast enemy can outrun a slow
  projectile; `Game.resolveHits()` applies damage and removes the projectile once it's
  within `PROJECTILE_HIT_RADIUS` of that position.
- **Waves, economy, and lives only interact through `Game`.** `WaveSpawner` spawns
  `ENEMIES_PER_WAVE` enemies `ENEMY_SPAWN_INTERVAL_MS` apart, repeating for `WAVE_COUNT`
  waves; `Economy` changes only via kills (`ENEMY_REWARD`) and tower purchases
  (`TOWER_COST`); `GameState` changes only via leaked enemies (lose a life) and
  `checkWin()`, which fires once `WaveSpawner.allWavesComplete()` is true and no enemies
  remain alive. These subsystems never call each other directly — `Game.update()` reads
  from one and writes to another.
- **Mutating subsystems own their own invariants.** `Economy.spend()` throws if called
  without checking `canAfford()` first; `GameState.loseLife()`/`checkWin()` are no-ops once
  the game is already over. Callers (`Game`) are expected to check preconditions rather than
  subsystems silently clamping.
- Source imports use explicit `.js` extensions (e.g. `import { Path } from "./Path.js"`)
  even though the files are `.ts` — required by the `module: "es6"` TypeScript config so
  emitted imports resolve correctly in the browser.

## Testing

- Vitest runs in a Node environment (not a browser) with `tests/mocks/p5.ts` aliased in for
  the `p5` import and `tests/setup.ts` providing p5 globals (`createVector`, `deltaTime`,
  etc.) that source files call directly in global mode.
- One test file per subsystem in `tests/`, named `<Subsystem>.test.ts`.
