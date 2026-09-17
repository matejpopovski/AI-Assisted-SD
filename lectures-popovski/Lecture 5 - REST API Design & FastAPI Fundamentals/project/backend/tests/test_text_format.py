import pytest

from app.utils.text_format import truncate_review_text


def test_short_text_is_unchanged():
    assert truncate_review_text("Great book!", 50) == "Great book!"


def test_text_exactly_at_max_length_is_unchanged():
    text = "12345"
    assert truncate_review_text(text, 5) == text


def test_long_text_truncates_at_word_boundary_mid_word():
    text = "This book completely changed how I think about software design"
    result = truncate_review_text(text, 20)
    assert result == "This book..."


def test_cutoff_landing_exactly_on_a_boundary_keeps_the_full_word():
    text = "One two three four"
    result = truncate_review_text(text, 10)
    assert result == "One two..."


def test_truncation_does_not_split_a_word_with_no_earlier_space():
    text = "Supercalifragilisticexpialidocious is not a real review"
    result = truncate_review_text(text, 15)
    assert result == "Supercalifra..."


def test_trailing_whitespace_stripped_before_ellipsis():
    text = "Cats meow  loudly"  # two spaces after "meow"
    result = truncate_review_text(text, 13)
    assert result == "Cats meow..."


def test_max_length_too_small_raises():
    with pytest.raises(ValueError):
        truncate_review_text("Great book!", 3)


def test_max_length_of_four_is_allowed():
    result = truncate_review_text("Wonderful read", 4)
    assert result == "W..."
