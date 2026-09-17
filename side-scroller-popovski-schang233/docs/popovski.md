# Matej Popovski — P1 Individual Documentation

## 1. Codebase Organization

The project is organized around a TypeScript side-scroller architecture with separate systems for game management, player/enemy behavior, map data, assets, and automated tests.

The main game flow is coordinated through `src/GameManager.ts`. It owns the main input actions and determines how player actions such as movement, jumping, Qi Wave, and Dash are triggered. Player-specific behavior is implemented in `src/sprites/Player.ts`, while shared creature and sprite behavior is handled by the other classes under `src/sprites/`.

Each frame is driven by p5's `draw()` callback in `src/Main.ts`, targeting 60 FPS. While the window is focused, it calls `GameManager.update()`, which — during the `Running` state — first calls `GameMap.update()` to advance physics using whatever velocity was set on the *previous* frame (gravity, tile collision, enemy/boss updates, and the Qi Wave/Dash timers), and only afterward polls the keyboard through `InputManager`/`GameAction` and calls `processActions()` to compute the velocity and ability activations that take effect on the *next* frame. `GameManager.draw()` then runs unconditionally, delegating to `GameMap.draw()` (parallax backgrounds, tiles, sprites, the player) and `GameHud.ts` (score, cooldowns, boss HUD). This one-frame-delayed input model is a real property of the engine, not a bug, and I had to account for it when wiring up Dash, since a key press only changes velocity starting the frame after it's read.

For my individual gameplay feature, I added `src/Dash.ts`. The Dash class owns the dash duration, speed, cooldown, active state, and direction. `Player` owns an instance of `Dash`, while `GameManager` handles the Shift keybinding and activates the ability. Keeping the dash logic in its own class made the feature easier to understand, test, and integrate without putting all of the logic directly into `GameManager`.

The maps are stored as text files under `assets/maps/`. I substantially redesigned `map2.txt` into a valley-style level with separated terrain sections, pits, raised platforms, enemies, collectibles, and power-ups. The level was designed around the existing player physics so that each required jump remained reachable.

Images and other resources are stored under `assets/`. I replaced the remaining starter player, Fly, Grub, and caveman artwork while preserving the filenames and dimensions expected by the existing resource system. Because the resource JSON already mapped these filenames into the correct animations, replacing the images in place allowed the existing animation and mirroring logic to continue working without changing resource definitions.

Automated tests are located under `tests/`. I added `tests/Dash.test.ts` for my Dash feature. The tests verify cooldown behavior, dash duration and velocity, direction, cancellation when the player leaves the normal state, cooldown timing, and invalid activation states.

## 2. AI Tools Used

I used Claude Code as the primary AI-assisted development tool for this project. The initial logging-verification session was logged automatically as intended:

- `ai_log/2026-09-14_21-34-56_0e09ee78.md`

However, while reviewing this document I discovered that the Map 2, Dash, and sprite-replacement work below never produced `ai_log/` commits at all. The cause was environmental, not a settings mistake: those sessions ran through the VS Code extension's Claude Code integration (the `claude-vscode` Agent SDK entrypoint), and `.claude/hooks/log_ai.py`'s `UserPromptSubmit`/`Stop` hooks never fire in that entrypoint — confirmed by an empty `/tmp/claude_ai_prompts.json` across the entire session despite 13 real turns. The session that produced the log above, by contrast, was a plain terminal `claude` session, where the hooks worked correctly.

Because the underlying work was still fully preserved in Claude Code's own local transcript for that session (`~/.claude/projects/.../ec69832d-fd9b-4b8c-b308-c3ef6fce264e.jsonl`), I reconstructed the missing logs from it after the fact, running the project's own `log_ai.py` parsing/formatting logic against the real transcript slices rather than writing them by hand. Each reconstructed file says so explicitly in its header, states the real transcript line range it covers, and distinguishes the original activity timestamps from the (later) reconstruction timestamp:

- `ai_log/RECONSTRUCTED_2026-09-14_23-39-46_map2-planning-implementation_ec69832d.md`
- `ai_log/RECONSTRUCTED_2026-09-14_23-39-46_dash-planning-implementation_ec69832d.md`
- `ai_log/RECONSTRUCTED_2026-09-14_23-39-46_sprite-replacement_ec69832d.md`

I used Claude Code as an assistant rather than blindly accepting generated changes. My workflow was generally to first ask Claude to inspect the existing implementation and explain how the relevant subsystem worked. I then asked it to propose a plan before allowing it to modify files.

For the Map 2 redesign, Claude first inspected the existing map format, resource mappings, player physics, and available map symbols. I used that information to create a new valley layout. We also temporarily created validation tests to check whether the pits and raised platforms were reachable using the real player physics. That first validation pass actually caught a mistake of Claude's own making: a sprite-count assertion used `instanceof Star`, which also matches the `Silver`/`Gold` subclasses, so it had to be corrected to check the exact constructor before the test meant anything. The temporary tests were removed after validation, and the normal test suite was run again before committing the map. (Session log: `ai_log/RECONSTRUCTED_2026-09-14_23-39-46_map2-planning-implementation_ec69832d.md`.)

For the Dash feature, I first asked Claude to inspect the movement and input architecture and propose a self-contained feature design. The implementation placed the main mechanic into a new `Dash` class rather than embedding it directly into `GameManager`. Claude also created a dedicated test file for the feature. During testing, adding the new `dash` field initially exposed an assumption in an existing Qi Wave test fixture. Instead of modifying the existing test, I had Claude revert that test change and make the production code safely tolerate the synthetic fixture. This kept the pre-existing tests unchanged. (Session log: `ai_log/RECONSTRUCTED_2026-09-14_23-39-46_dash-planning-implementation_ec69832d.md`.)

For the sprite replacement work, Claude inspected the resource definitions and confirmed the exact image dimensions and animation assumptions before changing any files. The new sprites were generated with the same filenames, dimensions, transparency, and animation structure as the originals, then checked programmatically (pixel dimensions, alpha channel, and that every path in `assets.json` still resolves to a valid image). This is also where Claude fell short on the first attempt: the initial draft outlined each sprite with one bounding rectangle instead of following its actual silhouette, so the player and bandit read as boxed placeholders rather than characters, and the fly's body color was nearly indistinguishable from its own outline. I had to point this out and ask for a second pass with per-shape outlines and a brighter palette before the art was actually usable. Claude's own environment didn't have browser tooling available to verify that automatically, so I manually ran the game afterward and confirmed the sprites looked correct in motion myself. (Session log: `ai_log/RECONSTRUCTED_2026-09-14_23-39-46_sprite-replacement_ec69832d.md`.)

Before committing my work, I repeatedly used the project validation commands:

- `npm run format:check`
- `npm run lint`
- `npm run test`
- `tsc --noEmit`

I also manually playtested my Map 2 redesign, Dash feature, and replacement sprites.

## 3. Best Practices Learned

One of the most important practices I learned from this project was to understand the existing architecture before changing it. Asking the AI to first explain the relevant classes, data flow, and dependencies made it much easier to add features without unnecessarily modifying unrelated files.

I also learned the value of keeping features self-contained. For example, the Dash feature has its own class that owns its timing and state. `Player` owns the ability, while `GameManager` only handles input and activation. This separation makes the feature easier to test and reduces the chance that changes to the ability will affect unrelated systems.

Another important practice was preserving existing behavior and tests. When my Dash implementation caused an existing Qi Wave test fixture to fail, the easiest solution would have been to modify that old test. Instead, I kept the original test unchanged and adjusted the implementation so it remained compatible. This helped ensure that my new work did not weaken existing coverage.

I also learned to make small, task-specific Git branches and commits. My work was separated into branches for AI logging verification, the Map 2 redesign, the Dash feature, and sprite replacement. This made merge requests easier to review and avoided bundling unrelated changes into one large commit.

Testing both automatically and manually was also important. Automated tests were useful for checking logic such as Dash timing and cooldown behavior, while manual testing was necessary for gameplay feel, level design, animations, and visual assets. Passing tests alone did not guarantee that a level was fun to play or that an animation looked correct.

Finally, I learned that AI-generated code still requires human review. Claude Code was very useful for exploring the codebase, proposing designs, generating tests, and implementing changes, but I reviewed the changes, questioned unnecessary modifications, ran the project myself, and corrected the approach when needed. The most effective workflow was to use AI for acceleration while keeping the final technical decisions and verification under my control.
