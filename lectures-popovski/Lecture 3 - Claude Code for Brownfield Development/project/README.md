# Lecture 3 Activity — Tower Defense Lite

## The Codebase

This is a small TypeScript + p5.js tower defense game — same stack and tooling as Project 1 and Lecture 2, but bigger and, unlike Lecture 2's Coin Catcher, **already complete and working**. Click anywhere to place a tower; towers auto-target and shoot the nearest enemy in range; enemies walk a fixed path from the left edge toward your base and cost you a life if they get there.

```
project/
├── index.html          loads p5.js, wires setup()/draw()/mousePressed() onto window
├── src/
│   ├── Main.ts          p5 hooks — setup(), draw(), mousePressed() for tower placement
│   ├── Constants.ts      every tunable balance number in one place
│   ├── Path.ts            the fixed route enemies walk; converts "distance traveled" to a position
│   ├── Enemy.ts           walks the Path, has health, can be killed
│   ├── Tower.ts           picks the nearest in-range enemy and fires on a cooldown
│   ├── Projectile.ts      chases the enemy that was targeted, deals damage on contact
│   ├── WaveSpawner.ts     schedules enemy spawns into waves over time
│   ├── Economy.ts         tracks gold — spend to place towers, earn by killing enemies
│   ├── GameState.ts       lives and the PLAYING / WON / LOST state machine
│   └── Game.ts            owns every subsystem above and is the only place they interact
└── tests/
    ├── *.test.ts         one test file per subsystem
    ├── setup.ts          mocks p5's createVector() and deltaTime globals for tests
    └── mocks/p5.ts       a minimal stand-in for the p5 module so tests don't need a browser
```

This is **you meeting an unfamiliar codebase**, the way it'll happen on Project 2 onward when you inherit part of a partner's work, and the way it happens on any real team. Nobody wrote this for you to extend line by line — the goal today is to *understand* it fast with Claude Code's help, document what you learned, and practice a git skill every team eventually needs.

**Before touching any code**, open Claude Code and ask it to walk you through the codebase. Some questions to get you started:

- *"Give me an overview of how this game is structured"*
- *"Walk me through what happens in a single frame, from Main.ts's draw() down through Game.update()"*
- *"How does a Tower decide which Enemy to shoot?"*
- *"Why does Enemy store distance traveled instead of an x/y position?"*
- *"What would break if two Towers targeted the same Enemy at the same time?"*

## Part 1 — Document the Codebase with Claude Code

Produce a structured **CLAUDE.md** at the project root capturing:
- A codebase overview (what the game is, how the subsystems relate)
- Conventions this codebase follows (e.g. `deltaTime`-based frame-independent movement, the `update()`/`draw()` split, where balance numbers live)

Use `/init` to generate a starting point, then refine it — `/init` is a good first draft, not a finished CLAUDE.md.

## Part 2 — Write a SPEC.md

Produce a **SPEC.md** outlining the game's key existing features (tower placement and cost, targeting behavior, wave structure, win/lose conditions). SPEC.md is a *reference-only* file — it does nothing on its own. Pull it into context on purpose by adding a line to CLAUDE.md:

```markdown
See @SPEC.md for the full feature specification.
```

That `@` import is what actually loads it — without that line, SPEC.md would just be a markdown file sitting in the repo that Claude never sees.

## Part 3 — Survive a Merge Conflict

You're working solo today, so this conflict is manufactured on purpose rather than left to chance — but it's exactly the kind of conflict you and a partner will hit for real starting Project 2, when you both touch the same file.

1. From `main`, create a branch and change one line in `src/Constants.ts`:
   ```bash
   git checkout -b tune/easier-start
   ```
   Edit `ENEMY_SPAWN_INTERVAL_MS` to a **longer** interval — justification: give new players more breathing room before the next enemy arrives. Commit.
2. Go back to `main` and create a second branch:
   ```bash
   git checkout main
   git checkout -b tune/harder-waves
   ```
   Edit the **same line** to a **shorter** interval — justification: waves felt too slow in playtesting. Commit.
3. Merge the first branch — this one is clean:
   ```bash
   git checkout main
   git merge tune/easier-start
   ```
4. Merge the second branch — this one conflicts:
   ```bash
   git merge tune/harder-waves
   ```
5. Open `src/Constants.ts` and look at the `<<<<<<<` / `=======` / `>>>>>>>` markers Git inserted around the two competing values. Decide on a resolution — keep one value, average them, or pick whichever you can justify — and edit the file so it's valid TypeScript again with no markers left. You can ask Claude Code to explain the conflict or propose a resolution, but read and understand what it proposes before accepting.
6. Finish the merge and confirm the game still runs:
   ```bash
   git add src/Constants.ts
   git commit
   npm run start
   ```

## How to Run

```bash
# first time only, from this project/ directory
npm install

# start the dev server (compiles TypeScript on save + live-reloads the browser)
npm run start
```

This opens the game in your browser. **Click anywhere** to place a tower (if you can afford it).

## The Local Development Loop

Before you commit, run the same checks the CI/CD pipeline will run on your Project merge requests:

```bash
npm run test      # run the vitest suite — all tests must pass
npm run format     # auto-fix style with prettier
npm run lint       # check for eslint errors — fix any that appear
```

The habit: **test → format → lint → commit → push.**

## Git Workflow

Complete Parts 1–3 in order. Commit each part separately (one logical change per commit), matching the merge-conflict exercise's own commit structure above.

**1. Produce CLAUDE.md (Part 1), commit it:**

```bash
git add "Lecture 3 - Claude Code for Brownfield Development/project/CLAUDE.md"
git commit -m "Add CLAUDE.md documenting Tower Defense Lite"
```

**2. Produce SPEC.md and the @SPEC.md reference in CLAUDE.md (Part 2), commit it:**

```bash
git add "Lecture 3 - Claude Code for Brownfield Development/project/SPEC.md" "Lecture 3 - Claude Code for Brownfield Development/project/CLAUDE.md"
git commit -m "Add SPEC.md and reference it from CLAUDE.md"
```

**3. Complete the merge-conflict exercise (Part 3)** — its own commits are the two branch commits plus the merge commit described above.

**4. Push to your GitLab fork**

```bash
git push
```

**5. Verify** — open your fork on `git.doit.wisc.edu` and confirm all of today's commits appear on `main`.

## Before Next Lecture

- Add at least one `.claude/rules/` file with real guardrails for this codebase (a `.md` file under `.claude/rules/`, optionally scoped to matching files with `paths:` frontmatter — see the pre-class reading)
- Add at least one skill (`.claude/skills/<name>/SKILL.md`) for a recurring task in this codebase — for example, a skill that walks through adding a new tower type, or one that reviews a diff for accidentally-broken frame-independence (a raw pixel offset instead of a `deltaTime`-scaled one)
- Push to GitLab — CI/CD validates

## You Are Done When

- `npm run test` passes the full suite
- `npm run start` runs the game in the browser, towers can be placed, and enemies walk, get shot, and die or reach the base
- `npm run format` and `npm run lint` both pass with no errors
- CLAUDE.md exists, gives a real overview, and documents at least one real convention
- SPEC.md exists and is pulled into context via `@SPEC.md` from CLAUDE.md
- `main` shows the merge-conflict exercise's history: two branch commits and a merge commit that actually resolved a real conflict in `src/Constants.ts`
- At least one `.claude/rules/` file and one skill exist under `.claude/`

## Note: This Workflow vs. Project Workflows

The git workflow above — commit straight to `main`, push, done — is specific to **in-class lecture activities** like this one. Your out-of-class projects use a stricter workflow with extra steps:

- **Work on a branch, not `main`.** Create a feature branch for your changes instead of committing directly to `main`.
- **Open a merge request (MR)** on GitLab instead of just pushing to `main`.
- **Get your MR reviewed and approved by your teammate** who did not author the code — you may not approve your own MR.
- **Only merge after approval.** The CI/CD pipeline auto-grades your `main` branch, so your work isn't graded until it's actually merged in. The grader will only run on the latest commit to main that occurs before the due date.

The merge-conflict exercise above is the one exception where you *do* use real branches and a real merge today — that's the whole point of the exercise — but you're merging locally to your own fork's `main`, not opening a GitLab merge request.
