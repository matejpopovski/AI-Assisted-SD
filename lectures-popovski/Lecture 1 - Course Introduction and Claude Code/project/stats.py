from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class QuizResult:
    total: int
    correct: int
    category_filter: Optional[str] = None

    @property
    def score_percent(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.correct / self.total) * 100.0

    def __str__(self) -> str:
        label = f" [{self.category_filter}]" if self.category_filter else ""
        return f"{self.correct}/{self.total} ({self.score_percent:.1f}%){label}"


class ScoreTracker:
    def __init__(self) -> None:
        self._history: list[QuizResult] = []

    def record(self, result: QuizResult) -> None:
        self._history.append(result)

    def history(self) -> list[QuizResult]:
        return list(self._history)

    def session_count(self) -> int:
        return len(self._history)

    def lifetime_average(self) -> float:
        if not self._history:
            return 0.0
        return sum(r.score_percent for r in self._history) / len(self._history)

    def best_result(self) -> Optional[QuizResult]:
        if not self._history:
            return None
        return max(self._history, key=lambda r: r.score_percent)

    def calculate_grade(self, result: QuizResult) -> str:
        """
        Convert a QuizResult into a letter grade using the standard scale:

            90 – 100  →  'A'
            80 – 89   →  'B'
            70 – 79   →  'C'
            60 – 69   →  'D'
            below 60  →  'F'

        TODO: implement this method.
              It currently raises NotImplementedError so the grade line is
              skipped in the summary output.  Use result.score_percent to
              compute the grade.  Explore the rest of the codebase with
              Claude Code to understand how QuizResult flows through the app
              before writing anything.
        """
        raise NotImplementedError("calculate_grade() is not yet implemented — see README.md")
