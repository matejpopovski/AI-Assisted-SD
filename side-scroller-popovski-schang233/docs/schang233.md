# Sheng Chang — CS 639 Project 1

NetID: `schang233` · Teammate: Matej Popovski (`popovski`)

This AI-assisted account describes my work from the repository and the development conversation referenced below.

My scope includes T4, Qi Wave, Maps 1/3, camera and movement additions, score, powers, supplied environment/pickup/boss assets and audio, and the ending. Matej owns Map 2, the player/Fly/Grub artwork, his feature and documentation. I do not claim his work or the starter caveman resource.

## Repo and Codebase Organization

### Files, resources and responsibilities

This is a TypeScript browser game using p5.js. [index.html](../index.html) connects p5's hooks to the compiled `build/Main.js`. Source lives in `src/`; `build/` is generated and Git-ignored. `npm run start` runs the compiler watcher and BrowserSync. Vitest tests use small p5/vector mocks.

[assets/assets.json](../assets/assets.json) lists files to load, while [resources.json](../assets/resources/resources.json) describes sprite prototypes, tile images and size, character mappings and map order. Cloning gives each pickup or creature its own position and animation state without loading the same artwork again. [ResourceManager.ts](../src/ResourceManager.ts) loads files asynchronously and builds prototypes that maps clone into independent instances. An image appears in gameplay only when its manifest entry, resource definition, map symbol and placement agree.

[Sprite.ts](../src/sprites/Sprite.ts) handles position, velocity and animation. [Creature.ts](../src/sprites/Creature.ts) adds NORMAL/DYING/DEAD states; [Player.ts](../src/sprites/Player.ts) specializes movement and jumping. [GameManager.ts](../src/GameManager.ts) manages Loading, Menu, Running and Finished, while [GameMap.ts](../src/GameMap.ts) owns the active world's physics, collisions, pickups and encounters. [QiWave.ts](../src/QiWave.ts) tracks the attack separately from player movement. [PowerUp.ts](../src/sprites/PowerUp.ts) defines pickup types, and [Haaaa.ts](../src/sprites/Haaaa.ts) keeps boss behavior separate from ordinary enemies. `Heart` remains a level exit, not healing; Trophy triggers Finished.

### One frame through the game

[Main.ts](../src/Main.ts) uses a logical 800×600 viewport. While focused, it calls `GameManager.update()` and then draws. Loading waits for resources, Menu pauses simulation, and Finished displays the ending without updating enemies.

During Running, the manager first calls `GameMap.update()`. Using elapsed milliseconds, the map advances timers, animation, Qi Wave and physics, resolves tile/sprite collisions, and updates enemies and the boss. Gravity changes vertical velocity; horizontal and vertical collisions are resolved separately. Landing restores the extra jump. Pickups update score or power timers, start a level transition, or finish the game. The manager checks those state changes before [InputManager.ts](../src/InputManager.ts) polls keys through [GameAction.ts](../src/GameAction.ts). `processActions()` then sets movement and handles new jump/Q presses. This preserves the existing update-before-input order.

Rendering samples parallax backgrounds and applies common camera offsets to visible tiles, entities and Qi Wave. Main scales and clips this drawing to the viewport. [Camera.ts](../src/Camera.ts) clamps vertical tracking and selects visible rows; backgrounds stay fixed vertically. [GameHud.ts](../src/GameHud.ts) draws score, cooldowns, powers and boss hearts in screen coordinates. [Settings.ts](../src/Settings.ts) controls the menu and audio preferences, stopping the previous track on map changes. Event sounds use loaded p5 sound objects directly, rather than the starter `SoundManager`.

### How my contributions fit together

**Parallax.** T4 (`49765bc`, `schang233/fix-parallax`) uses:

```text
trunc(cameraOffsetX × (viewportWidth − backgroundWidth)
                    / (viewportWidth − mapWidth))
```

The offset runs from zero to `viewportWidth − backgroundWidth`, so larger backgrounds travel farther. The integrated renderer had capped widths before calling this helper, making differently sized large layers move identically. It now passes actual image widths and uses an 800-pixel source window on scrolling maps; non-scrolling maps retain fitted backgrounds. [GameMap.parallax.test.ts](../tests/GameMap.parallax.test.ts) remains unmodified. [GameMap.rendering.test.ts](../tests/GameMap.rendering.test.ts) checks actual p5 source windows at map edges and midpoints, including stationary backgrounds on small maps.

**Qi Wave and movement.** My individual feature (`0658cbe`, `schang233/qi-wave`) starts with Q: a 0.5-second charge, one-second expanding front and three-second cooldown from activation. The circular front anchors at the player's center when charging ends and reaches 400 pixels, half the viewport width. Sweeping between frame radii avoids skipped enemies; tracking hits prevents repeat damage. It can hit multiple ordinary enemies, but removes only one boss HP per activation. The HUD shows cooldown and sound respects the event setting. [QiWave.test.ts](../tests/QiWave.test.ts) covers timing, geometry, cancellation, repeated input, HUD and sound.

Double jump allows a grounded Space press and one extra airborne press, restored on landing or player reinitialization. The second jump has an air ring and sound. Map 1 is an 18×64 descending cliff; Map 3 is an 18×64 ascent to the summit. Both use 64-pixel solid tiles, side boundaries and bottom floors. The camera follows tall maps, centers short maps, and the game has a below-world reset. [MapRoutes.test.ts](../tests/MapRoutes.test.ts) exercises real collision physics without boots, varying jump timing and checking catch ledges and unreachable transitions. These enemy-free simulations complement my normal manual playthrough: **Map 1 → Map 2 → Map 3 → Boss → Trophy → Finished**. Codex's browser smoke checks used controlled placement for some transitions.

**Ownership and shared systems.** [map2.txt](../assets/maps/map2.txt) is untouched. A shared background fallback had still changed its appearance, so it was removed and mist restricted to Maps 1/3. Matej can select his own registered background with `@parallax-layer` without changing the camera. Optional `valley.png` is registered but not automatically assigned. Shared tiles, pickups, music, movement and UI remain compatible with Map 2; his sprite frames were not replaced.

**Score, powers and ending.** Copper/silver/gold give 100/200/300 points with animation and sound. Collected items disappear. Score survives level transitions and map resets; replay resets it. Keeping score on death is intentional, without an anti-farming persistence system. Winged Boots gives 1.5× horizontal speed for ten seconds. Golden Shield blocks ordinary enemy contact and boss attacks for ten seconds while allowing normal actions. The HUD shows remaining time, boots add speed lines, and blocked attacks give feedback. Repeated pickups refresh duration rather than stack effects; neither power changes jump impulse or Qi Wave radius/cooldown. [IntegratedWorld.test.ts](../tests/IntegratedWorld.test.ts) checks powers and their interactions.

HAAAA appears only on Map 3 with three HP. It floats over the summit ledge, telegraphs a locked laser for one second, fires for half a second on a five-second cycle, and has a 1.5-second melee cooldown. Stomps bounce the player and remove one HP; side contact is not a stomp. After its death lifecycle, one Trophy appears at its final position. Collecting it enters Finished without advancing or looping maps. Y starts a fresh Map 1 with score, timers and encounter state reset; U returns to the menu.

**Assets and controls.** The authoritative packs were `CS639_P1_visual_assets.zip` and `CS639_P1_audio_assets_final.zip`. Integration cropped/resized art, split currency/portal sheets, and kept 64×64 tiles with solid underlays to match collision. They supply environments, portals, currencies, powers, HAAAA and Trophy. Existing Qi Wave art and `dustywind__magic-whoosh.wav` remain. Per-map music and event audio replace starter audio, including unused legacy files. Events cover pickups, portals, powers, double jump, boss attacks/death and reward. I do not claim to have drawn or composed the supplied assets.

The M menu and I overlay explain movement arrows, Space/double jump, Q, M, Escape, I and final Y/U commands. The old Up Arrow crash binding was removed. This team instructions work is separate from Qi Wave; Matej's eventual feature bindings must also be documented.

At cleanup, graphics/audio preparation was recorded in `3ddfcde` and integrated code, maps, resources, tests and renderer repair in `d75ee68`. Validation passed: `npm run format:check`, `npm run lint` (zero errors, six existing warnings), `npm run test` (132 tests, nine files), and `node node_modules/typescript/bin/tsc --noEmit`. Existing tests were preserved; resource checks confirmed file/reference resolution and protected teammate definitions. These are local results, not claims of remote CI or MR approval.

## AI Tools Used

### Codex — main implementation and debugging agent

I used Codex for repository inspection, T4, Qi Wave, integrated-world coding, asset processing, tests, logging diagnosis and cleanup. I asked it to connect the systems while preserving Matej's ownership, use supplied assets and verify the actual rubric. Its output helped trace resources and state transitions; route simulations exposed overhead-clearance problems and improved platforms.

It also needed correction: the integrated renderer defeated T4's width differences, and the Map 2 fallback crossed an ownership boundary. I supplied design constraints and manual playtest feedback, then requested targeted fixes. Codex wrote substantial code and tests; my role included reviewing and understanding the result.

Evidence: [Codex conversation export](schang233-codex-session.md), session `01a08cb4-3f7a-7f82-b089-fa9e951faa75`. It preserves the recorded user/assistant messages in chronological order, including implementation, audits, corrections and cleanup, through my export request. Internal metadata and tool protocol records are omitted; the export is not a reconstructed summary.

### Claude Code — logging verification and architecture review

The genuine live CLI session is commit `d5a04a6`, file `ai_log/2026-09-11_12-26-22_2a0f86f2.md`, session `2a0f86f2-9f76-4797-a2e9-08164a4de496`, on `chore/schang233-verify-ai-logging`. I asked Claude to read `.claude/settings.json`, `.claude/hooks/log_ai.py` and `ai_log/README.md` and explain logging without editing. Its recorded reads and explanation helped verify the logging flow. The summary is truncated, so it is not a complete development transcript.

Earlier evidence, `de52487` and `ai_log/2026-09-10_14-14-49_logger-v.md`, replays an existing Claude transcript explaining `src/GameManager.ts`. It verifies replay/commit behavior, not a new live conversation. Neither log proves continuous logging throughout development. The separate branch also contains UTF-8 fix `5de8ec7`; Windows required `python` rather than `python3`. The logger commits but does not push. That branch remains independent for its own MR after T4 and is not imported here.

The live log is already inspectable with `git show d5a04a6:ai_log/2026-09-11_12-26-22_2a0f86f2.md`. After its MR merges, I can replace this cross-branch reference with a relative link without recreating evidence.

## Best Practices Learned

**Plan around the architecture.** I learned to trace a feature through resources, map instances, updates, rendering and state transitions before editing. Camera offsets must agree across sprites and effects, and Trophy completion must differ from a portal transition. Explicit per-map choices also protect teammate ownership better than shared visual defaults. Small dedicated classes and explicit power timers were enough; a general framework was unnecessary.

**Test observable behavior.** A correct helper does not guarantee correct rendering. Checking p5's actual source windows caught the parallax integration bug. Attack timing, one-hit behavior, power expiry and real tile-collision routes are useful assertions; merely checking that methods run is not. Automated tests and manual combat playthroughs cover different risks.

**Use branches, review and CI together.** Descriptive branches and focused commits make changes reviewable. T4 must reach main first, with logging kept in its own MR. Local format, lint, tests and TypeScript checks catch problems early, but every MR still needs the full pipeline and non-author approval. I must not bypass CI or treat a commit on another branch as integrated work.

**Debug from evidence and review AI output.** I learned to compare the actual symptom with source, logs and tests before choosing a small root-cause fix. The interpreter and encoding failures were separate problems, just as file ownership and shared rendering defaults were separate concerns. AI accelerated implementation, but I remain responsible for checking its claims, keeping honest session evidence, and explaining the submitted systems at the TA review.
