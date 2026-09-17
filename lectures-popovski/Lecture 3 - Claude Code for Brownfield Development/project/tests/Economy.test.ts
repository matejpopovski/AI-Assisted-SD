import { describe, it, expect } from "vitest";
import { Economy } from "../src/Economy";

describe("Economy", () => {
    it("starts with the given balance", () => {
        const economy = new Economy(50);
        expect(economy.balance).toBe(50);
    });

    it("canAfford() is true when balance covers the cost", () => {
        const economy = new Economy(50);
        expect(economy.canAfford(50)).toBe(true);
        expect(economy.canAfford(20)).toBe(true);
    });

    it("canAfford() is false when balance is short", () => {
        const economy = new Economy(50);
        expect(economy.canAfford(51)).toBe(false);
    });

    it("spend() deducts from the balance", () => {
        const economy = new Economy(50);
        economy.spend(20);
        expect(economy.balance).toBe(30);
    });

    it("spend() throws rather than going negative", () => {
        const economy = new Economy(10);
        expect(() => economy.spend(20)).toThrow();
        expect(economy.balance).toBe(10); // unchanged
    });

    it("earn() adds to the balance", () => {
        const economy = new Economy(50);
        economy.earn(5);
        expect(economy.balance).toBe(55);
    });
});
