"""CS Fundamentals Flashcard Quiz — entry point."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from flashcard import Deck, Flashcard
from quiz import QuizSession
from stats import ScoreTracker


def load_deck(path: Path) -> Deck:
    with path.open(encoding="utf-8") as f:
        data = json.load(f)

    deck = Deck(name=data["name"])
    for item in data["cards"]:
        deck.add_card(Flashcard(
            question=item["question"],
            answer=item["answer"],
            category=item["category"],
        ))
    return deck


def list_categories(deck: Deck) -> None:
    print(f"\nCategories in '{deck.name}':")
    for cat in deck.categories():
        count = len(deck.filter_by_category(cat))
        print(f"  {cat}  ({count} card{'s' if count != 1 else ''})")
    print()


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python app.py",
        description="CS Fundamentals Flashcard Quiz",
    )
    parser.add_argument(
        "--deck",
        type=Path,
        default=Path("data/cs_fundamentals.json"),
        metavar="FILE",
        help="path to a deck JSON file (default: data/cs_fundamentals.json)",
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        metavar="NAME",
        help="restrict quiz to one category (use --list to see available categories)",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="list available categories in the deck and exit",
    )
    parser.add_argument(
        "--no-shuffle",
        action="store_true",
        help="present cards in deck order rather than randomly",
    )
    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    if not args.deck.exists():
        print(f"error: deck file not found: {args.deck}", file=sys.stderr)
        sys.exit(1)

    deck = load_deck(args.deck)

    if args.list:
        list_categories(deck)
        return

    if args.category:
        deck = deck.filter_by_category(args.category)
        if len(deck) == 0:
            print(
                f"error: no cards found for category '{args.category}'\n"
                f"       run with --list to see available categories",
                file=sys.stderr,
            )
            sys.exit(1)

    tracker = ScoreTracker()
    session = QuizSession(deck=deck, tracker=tracker)
    result = session.run(shuffle=not args.no_shuffle)
    session.print_summary(result)


if __name__ == "__main__":
    main()
