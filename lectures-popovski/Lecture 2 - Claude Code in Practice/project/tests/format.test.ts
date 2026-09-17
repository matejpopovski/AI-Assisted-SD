import { describe, it, expect } from "vitest";
import { formatScore } from "../src/format";

describe("formatScore", () => {
    it("pads a single-digit score to 4 digits", () => {
        expect(formatScore(7)).toBe("0007");
    });

    it("pads a two-digit score to 4 digits", () => {
        expect(formatScore(42)).toBe("0042");
    });

    it("pads a three-digit score to 4 digits", () => {
        expect(formatScore(123)).toBe("0123");
    });

    it("formats zero as 0000", () => {
        expect(formatScore(0)).toBe("0000");
    });

    it("does not truncate a score with more than 4 digits", () => {
        expect(formatScore(12345)).toBe("12345");
    });
});
