/**
 * Formats a score for the arcade-style scoreboard: zero-padded to 4 digits.
 *
 * formatScore(7)     -> "0007"
 * formatScore(42)    -> "0042"
 * formatScore(123)   -> "0123"
 * formatScore(12345) -> "12345"  (never truncates — pads a minimum of 4 digits)
 */
export function formatScore(score: number): string {
    throw new Error(`formatScore is not implemented yet (called with score=${score})`);
}
