# AI-Assisted Software Development and Intelligent Applications
## Lecture Material

This repository contains the content used for lectures.  It is your responsibility to [update your fork](https://docs.gitlab.com/user/project/repository/forking_workflow/#update-your-fork) with any new material before the start of lecture.  It is also your responsibility to perform any of the tasks that are asked of you for that lecture, commit them to your main branch, and push them to your online repo within 48 hours after the start of a lecture [(Git Basics)](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository).

## Setup

Complete these steps once, right after you clone your fork, so the in-lecture coding activities are ready to run.

1. **Prerequisites.** Make sure Git, VS Code, Claude Code, and Python 3.12 are installed and working. If you haven't done this yet, follow [`Lecture 0 - Before Your First Class/README.md`](Lecture%200%20-%20Before%20Your%20First%20Class/README.md) before continuing.

2. **Run the setup script** from the repo root:

   ```bash
   bash setup.sh
   ```

   This creates a Python virtual environment at `.venv/` and installs the packages every lecture activity depends on, listed in `requirements.txt`.

3. **Activate the environment.** Do this in every new terminal session before running a lecture's project code:

   ```bash
   source .venv/bin/activate
   ```

4. **Open the folder in VS Code** (`code .` from the repo root) so Claude Code has the right workspace context.

5. **Verify.** With the environment activated, `python3 --version` should print `3.12.x` and `python3 -c "import anthropic"` should run without an error. Then ask Claude Code "What files are in this project?" and confirm it describes this repo.

## Workflow

Some lectures include a `project/` folder (`Lecture N - <Title>/project/`) with an in-lecture coding activity. That project's own `README.md` describes exactly what you need to accomplish and how to run it — read it first. The steps below are the general workflow you'll repeat for every lecture activity, working directly on `main`:

1. **Update your fork** with the latest material before lecture starts, per the note above.

2. **Read the activity's `README.md`** and get oriented with Claude Code before touching any code — ask it for an overview of the project's structure and how data flows through it.

3. **Implement the task** described in the project's README, using Claude Code as a collaborator.

4. **Verify your change works** by running the project as instructed in its README and checking the output matches what's expected there.

5. **Commit your change**:

   ```bash
   git add "Lecture N - Title/project/<changed-file>"
   git commit -m "<describe what you implemented>"
   ```

6. **Push to your GitLab fork**:

   ```bash
   git push
   ```

7. **Verify** — open your fork on `git.doit.wisc.edu` and confirm your commit appears on `main`, within 48 hours of the start of the lecture.
