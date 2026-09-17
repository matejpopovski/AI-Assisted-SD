# CLAUDE.md

FastAPI backend for the Book Review app — the codebase this lecture's activity builds on top
of, and the one the whole Book Review arc (Lectures 4-9) keeps growing.

This folder is set up to practice the **Elephant-Goldfish Model (EGM)**: a fresh Claude Code
session has no memory between lectures, so this repo's own documentation — not chat history —
is what has to carry context forward.

## Standing context

- **Context hierarchy** — `backend/CLAUDE.md` and the `CLAUDE.md` files below it are the
  primary source of truth for how this codebase is organized. This implements the pre-class
  reading's "README hierarchy" technique, but as nested `CLAUDE.md` files rather than
  `README.md` files — Claude Code loads them automatically as it reads into each directory, and
  keeping the artifact separate from `README.md` means it never competes with the human-facing
  "how do I get started" README.md every project in this course already has (including this
  one, at `project/README.md` — the assignment instructions, a different document one level
  above the codebase). See the `context-hierarchy` skill and the `context-sync` rule.
- **Design docs** — `docs/plans/<feature-slug>.md`, one file per feature, kept permanently.
  See the `write-spec` skill for the template and naming convention.

## Skills for each phase of EGM

| Phase | Skill | What it does |
|---|---|---|
| Prerequisite | `context-hierarchy` | Build or refresh the context hierarchy, leaves to root |
| 1 — Growing the Elephant | `design-discussion` | Scope a feature, load only the relevant `CLAUDE.md` files, discuss design (no code) |
| 2 — Teaching the Elephant | `write-spec` | Turn an agreed design into `docs/plans/<feature-slug>.md` |
| 3 — Goldfish Protocol | `goldfish-test` | In a genuinely fresh session: comprehension, critic, and readiness checks against the spec |
| 4 — Implementation | *(no skill — just build it)* | Write the code against the goldfish-tested spec |
| 4 — closing | `mean-review` | Adversarial review of the finished implementation |

Invoke any of these explicitly with `/<name>`, or let Claude pick them up automatically when
the conversation matches.

## Standing rules

`.claude/rules/` enforces two EGM habits that need to hold for a whole conversation, not just
at the moment a skill is invoked: the No Code Rule during design/spec phases, and the
sycophant challenge after any technical proposal. See those files for detail.
