# Lecture 1 Activity — Ship Day Zero

## The Codebase

This is a command-line flashcard quiz app for CS fundamentals. It spans several files:

```
project/
├── app.py          entry point — CLI argument parsing and startup
├── flashcard.py    Flashcard and Deck data types
├── quiz.py         QuizSession — runs a quiz and prints the summary
├── stats.py        ScoreTracker and QuizResult — scoring and history
└── data/
    └── cs_fundamentals.json   the question bank
```

**Before touching any code**, open Claude Code and ask it to walk you through the codebase. Some questions to get you started:

- *"Give me an overview of how this application is structured"*
- *"How does data flow from the JSON file through to the printed summary?"*
- *"What is the relationship between QuizResult and ScoreTracker?"*
- *"Trace what happens when a user answers a question correctly"*

## Your Task

`stats.py` contains a method called `calculate_grade()` that is not yet implemented — it raises `NotImplementedError`. The summary output skips the grade line until this is fixed.

Implement `calculate_grade(result: QuizResult) -> str` using this scale:

| Score | Grade |
|---|---|
| 90 – 100% | A |
| 80 – 89%  | B |
| 70 – 79%  | C |
| 60 – 69%  | D |
| below 60% | F |

Use `result.score_percent` to get the numeric score. Read the surrounding code before writing anything — understand `QuizResult` and how it is created before implementing the method.

## How to Run

```bash
# activate the course virtual environment first
source ../../.venv/bin/activate

# run the full deck
python app.py

# run a specific category only
python app.py --category complexity
python app.py --category data-structures
python app.py --category python
python app.py --category concepts

# list available categories
python app.py --list
```

## Git Workflow

Complete each step — this is the workflow you will use on every project this semester.

**1. Implement `calculate_grade()` in `stats.py`**

Verify it works by running `python app.py`, completing a quiz, and confirming your letter grade appears in the summary output.

**2. Commit your change**

```bash
git add "Lecture 1 - Course Introduction and Claude Code/project/stats.py"
git commit -m "Implement calculate_grade() in ScoreTracker"
```

**3. Push to your GitLab fork**

```bash
git push
```

**4. Verify** — open your fork on `git.doit.wisc.edu` and confirm your commit appears on `main`.

## You Are Done When

- `python app.py` completes a quiz and prints a letter grade in the summary
- Your commit is visible on your fork's `main` branch on GitLab
