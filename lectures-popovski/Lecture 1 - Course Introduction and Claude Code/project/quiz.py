from __future__ import annotations

from typing import Optional

from flashcard import Deck, Flashcard
from stats import QuizResult, ScoreTracker


class QuizSession:
    def __init__(self, deck: Deck, tracker: ScoreTracker) -> None:
        self.deck = deck
        self.tracker = tracker

    def run(self, *, shuffle: bool = True) -> QuizResult:
        if shuffle:
            self.deck.shuffle()

        correct = 0
        total = 0

        print(f"\n{'─' * 50}")
        print(f"  {self.deck.name}  ({len(self.deck)} questions)")
        print(f"{'─' * 50}\n")

        for card in self.deck.cards:
            print(f"Q: {card.question}")
            try:
                response = input("A: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\nQuiz interrupted.")
                break

            if card.check_answer(response):
                print("  ✓ Correct\n")
                correct += 1
            else:
                print(f"  ✗ Incorrect — answer: {card.answer}\n")

            total += 1

        result = QuizResult(
            total=total,
            correct=correct,
            category_filter=_extract_category(self.deck.name),
        )
        self.tracker.record(result)
        return result

    def print_summary(self, result: QuizResult) -> None:
        print(f"\n{'═' * 50}")
        print(f"  Result:  {result}")
        print(f"  Average: {self.tracker.lifetime_average():.1f}%  "
              f"({self.tracker.session_count()} session(s))")

        try:
            grade = self.tracker.calculate_grade(result)
            print(f"  Grade:   {grade}")
        except NotImplementedError:
            print("  Grade:   (not yet implemented — see stats.py)")

        best = self.tracker.best_result()
        if best and self.tracker.session_count() > 1:
            print(f"  Best:    {best}")

        print(f"{'═' * 50}\n")


def _extract_category(deck_name: str) -> Optional[str]:
    if "[" in deck_name and deck_name.endswith("]"):
        return deck_name[deck_name.index("[") + 1:-1]
    return None
