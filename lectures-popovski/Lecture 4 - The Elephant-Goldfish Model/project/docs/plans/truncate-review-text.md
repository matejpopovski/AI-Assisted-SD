# truncate-review-text

## Problem

Review lists need to show a short preview of a review's text instead of the full body. A
preview must never split a word in half, and must make clear when text was actually cut
(versus text that already fit).

## Technical Plan

Implement `truncate_review_text(text: str, max_length: int) -> str` in
`app/utils/text_format.py`:

1. Validate `max_length >= 4` first (3 characters for `"..."` plus at least 1 character of
   real content). Raise `ValueError("max_length must be at least 4")` if it's smaller — the
   message isn't asserted on by tests, but should still say why, for anyone reading it.
2. If `len(text) <= max_length`, return `text` unchanged — no ellipsis, nothing was cut.
3. Otherwise compute `cutoff = max_length - len("...")` (i.e. `max_length - 3`). Because step 2
   already guarantees `len(text) > max_length`, `cutoff` is always strictly less than
   `len(text)` here — `text[cutoff]` is always a valid index; a `cutoff >= len(text)` guard is
   unreachable and should not be implemented as a real branch (harmless if present as leftover
   defensiveness, but don't treat it as a case that can actually occur).
4. **Boundary character is the literal space `" "` only** — not `str.isspace()` (tabs/newlines
   are out of scope; this codebase's review text is plain single-line strings). If
   `text[cutoff] == " "`, the cut point is already a valid word boundary: take `text[:cutoff]`,
   `.rstrip()` (generic whitespace, for cosmetic cleanup only — not boundary detection) to
   absorb any run of trailing spaces, append `"..."`.
5. Otherwise the cutoff falls mid-word: take `text[:cutoff]`, `.rstrip()`, then find the last
   literal space in that stripped slice via `.rfind(" ")`.
   - If found (`!= -1`), cut there (drop everything from that space onward) and append `"..."`.
   - If not found (one long unbroken word, or the entire stripped slice is whitespace-only —
     see Edge Cases), fall back to the hard cut: the already-stripped slice from step 5, plus
     `"..."`.

## Alternatives

- **Always hard-cut at `max_length - 3`, ignoring word boundaries.** Simpler, but explicitly
  fails the requirement that a preview never splits a word in half. Rejected.
- **Use `max_length - 3` as a bare literal instead of `max_length - len("...")`.** Numerically
  identical today, but ties the arithmetic to a magic number instead of the ellipsis string
  itself — a future change to the ellipsis (e.g. to a unicode `…`) would silently break the
  bare-literal version. Rejected in favor of deriving the offset from the ellipsis string.
- **Truncate by word count instead of character count.** Doesn't bound the preview's display
  width, which is the actual goal (fitting a review list row) — a single very long word would
  still blow past `max_length`. Rejected.

## Detailed Implementation

```
def truncate_review_text(text, max_length):
    if max_length < 4:
        raise ValueError
    if len(text) <= max_length:
        return text
    cutoff = max_length - len("...")
    if cutoff >= len(text) or text[cutoff] == " ":
        candidate = text[:cutoff].rstrip()
    else:
        stripped = text[:cutoff].rstrip()
        last_space = stripped.rfind(" ")
        candidate = stripped[:last_space] if last_space != -1 else stripped
    return candidate + "..."
```

Notes for the implementer:
- `rfind(" ")` returns `-1` when no space exists — that's the "one long unbroken word"
  fallback case, and must use the *stripped* slice (not the raw `text[:cutoff]`) so trailing
  whitespace doesn't get counted as a false word boundary.
- Multi-byte/unicode-width characters (e.g. emoji, combining characters) are out of scope —
  `max_length` is a plain Python string-length (code point) count, not a display-width count.

## Edge cases this spec covers

- Text exactly at `max_length` (no truncation, no ellipsis).
- Cutoff landing exactly on a space (clean boundary, no backing up needed).
- Cutoff landing mid-word with an earlier space available (back up to it).
- Cutoff landing mid-word with *no* earlier space (single long word — hard cut).
- Multiple consecutive spaces at/before the cutoff (handled by `rstrip()` before appending the
  ellipsis, so `"cat  dog"`-style double spaces never leak into the result).
- `max_length` below the 4-character minimum (raises `ValueError`).
- `max_length` exactly 4 (must return exactly one real character plus `"..."`).
- The stripped slice before the cutoff is entirely whitespace (no real content and no space
  to back up to, since stripping removed it all) — falls back to the hard-cut branch, which
  degenerates to just `"..."`. Accepted, uncommon-input behavior; not separately handled.
- Tabs/newlines are not treated as word-boundary characters (only literal `" "` is) — see
  Detailed Implementation step 4. Out of scope for this feature; review text is plain
  single-line input.
