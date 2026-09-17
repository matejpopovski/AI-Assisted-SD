from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Flashcard:
    question: str
    answer: str
    category: str

    def check_answer(self, response: str) -> bool:
        return response.strip().lower() == self.answer.strip().lower()

    def __repr__(self) -> str:
        return f"Flashcard(category={self.category!r}, question={self.question[:40]!r})"


class Deck:
    def __init__(self, name: str) -> None:
        self.name = name
        self._cards: list[Flashcard] = []

    def add_card(self, card: Flashcard) -> None:
        self._cards.append(card)

    @property
    def cards(self) -> list[Flashcard]:
        return list(self._cards)

    def shuffle(self) -> None:
        random.shuffle(self._cards)

    def categories(self) -> list[str]:
        seen: set[str] = set()
        result = []
        for card in self._cards:
            if card.category not in seen:
                seen.add(card.category)
                result.append(card.category)
        return result

    def filter_by_category(self, category: str) -> Deck:
        filtered = Deck(name=f"{self.name} [{category}]")
        for card in self._cards:
            if card.category == category:
                filtered.add_card(card)
        return filtered

    def __len__(self) -> int:
        return len(self._cards)

    def __repr__(self) -> str:
        return f"Deck(name={self.name!r}, size={len(self)})"
