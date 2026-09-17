# Lecture 2 Activity — Coin Catcher

## The Codebase

This is a small TypeScript + p5.js game — the same stack (and the same tooling: `tsc`, ESLint, Prettier, vitest) as your Project 1 side-scroller, just much smaller. A paddle at the bottom of the canvas moves left/right to catch coins falling from the top.

```
project/
├── index.html      loads p5.js and the compiled game, wires p5 hooks onto window
├── src/
│   ├── Main.ts      p5 hooks — setup(), draw(), reading arrow-key input
│   ├── Game.ts      Game — spawns coins, updates state each frame, draws everything, isCaught()
│   ├── Player.ts    Player — the paddle: position, moveLeft()/moveRight(), draw()
│   ├── Coin.ts      Coin — a single falling coin: position, fall(), isOffscreen(), draw()
│   └── format.ts    formatScore() — NOT YET IMPLEMENTED, see Part 1 below
└── tests/
    ├── format.test.ts   tests for formatScore() — currently failing, see Part 1
    ├── Coin.test.ts     starter tests for Coin
    ├── Game.test.ts     starter tests for Player and the isCaught() collision check
    ├── setup.ts         mocks p5's createVector() and deltaTime globals for tests
    └── mocks/p5.ts      a minimal stand-in for the p5 module so tests don't need a browser
```

**Before touching any code**, open Claude Code and ask it to walk you through the codebase. Some questions to get you started:

- *"Give me an overview of how this game is structured"*
- *"Walk me through what happens in a single frame, from Main.ts's draw() down to Game.update()"*
- *"How does isCaught() decide whether a coin was caught?"*
- *"Why do the tests mock p5 instead of importing the real library?"*

## Part 1 — Make the Failing Test Pass

`src/format.ts` exports `formatScore(score: number): string`, which is supposed to zero-pad the score for the arcade-style scoreboard (`7` → `"0007"`, `123` → `"0123"`, never truncating scores of 4+ digits). Right now it just throws — run `npm run test` and you'll see all 5 tests in `tests/format.test.ts` fail.

Implement `formatScore()` so those tests pass. `Game.draw()` already calls it to render the `Score:` line, so — until you fix it — the game throws as soon as it starts. That's expected: it's your signal this step isn't done yet.

You may write the implementation yourself or ask Claude Code to write it — either way, read the test cases first so you understand the exact spec before touching the code.

## Part 2 — Add Your Own Feature

Pick **one** small, self-contained feature to add. A few ideas (pick one — don't try to do all of them):

- **A hazard.** Add a new falling object (e.g. a bomb) that costs the player a life instead of a point when caught, and end the game when lives reach zero.
- **A power-up.** Add a rare coin type worth extra points, or one that temporarily widens the paddle.
- **Difficulty scaling.** Make coins fall faster the longer the game runs, or spawn more frequently as the score increases.
- **Visual feedback.** Flash the canvas or briefly grow the paddle when a coin is caught.
- Your own idea — anything that's a genuine small addition, not just tweaking a constant.

Use Claude Code as a collaborator: describe the feature you want, review what it proposes before accepting, and iterate. Then **write at least one vitest test** covering the behavior you added — follow the pattern in `tests/Coin.test.ts` and `tests/Game.test.ts`.

## How to Run

```bash
# first time only, from this project/ directory
npm install

# start the dev server (compiles TypeScript on save + live-reloads the browser)
npm run start
```

This opens the game in your browser. Use the **left/right arrow keys** to move the paddle.

## The Local Development Loop

Before you commit, run the same checks the CI/CD pipeline will run on your Project 1 merge requests:

```bash
npm run test      # run the vitest suite — all tests must pass
npm run format     # auto-fix style with prettier
npm run lint       # check for eslint errors — fix any that appear
```

The habit: **test → format → lint → commit → push.**

## Git Workflow

Complete each step — this is the workflow you will use on every project this semester. Commit each part separately (one logical change per commit, same as you'll be graded on in Project 1).

**1. Implement `formatScore()` in `src/format.ts` (Part 1)**

Verify it works by running `npm run test` and confirming all 5 tests in `tests/format.test.ts` pass, then run `npm run start` and confirm the scoreboard renders instead of throwing.

**2. Run the local pipeline loop** (`npm run test`, `npm run format`, `npm run lint`) and fix anything it flags.

**3. Commit Part 1**

```bash
git add "Lecture 2 - Claude Code in Practice/project/src/format.ts"
git commit -m "Implement formatScore() for the arcade-style scoreboard"
```

**4. Implement your feature in `src/`, and add a test in `tests/` (Part 2)**

Verify it works by running `npm run start` and trying the feature in the browser, and by running `npm run test` and confirming your new test passes.

**5. Run the local pipeline loop again** and fix anything it flags.

**6. Commit Part 2**

```bash
git add "Lecture 2 - Claude Code in Practice/project/src" "Lecture 2 - Claude Code in Practice/project/tests"
git commit -m "Add <your feature> to Coin Catcher"
```

**7. Push to your GitLab fork**

```bash
git push
```

**8. Verify** — open your fork on `git.doit.wisc.edu` and confirm both commits appear on `main`.

## You Are Done When

- `npm run test` passes all tests, including the 5 in `tests/format.test.ts`
- `npm run start` runs the game in the browser with a working scoreboard and your new feature working as intended
- `npm run format` and `npm run lint` both pass with no errors
- At least one new vitest test covers the feature you added in Part 2
- Both commits are visible on your fork's `main` branch on GitLab

## Note: This Workflow vs. Project Workflows

The git workflow above — commit straight to `main`, push, done — is specific to **in-class lecture activities** like this one. Your out-of-class projects (starting with Project 1) use a stricter workflow with extra steps:

- **Work on a branch, not `main`.** Create a feature branch for your changes instead of committing directly to `main`.
- **Open a merge request (MR)** on GitLab instead of just pushing to `main`.
- **Get your MR reviewed and approved by your teammate** who did not author the code — you may not approve your own MR.
- **Only merge after approval.** The CI/CD pipeline auto-grades your `main` branch, so your work isn't graded until it's actually merged in.  The grader will only run on the latest commit to main that occurs before the due date.

You had hands-on practice with branches and merge requests in Lecture 1's activity — the lecture's simpler direct-to-`main` workflow is just for quick in-class exercises.
