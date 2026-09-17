import { describe, it, expect } from "vitest";
import { Coin } from "../src/Coin";

describe("Coin", () => {
    it("starts just above the top of the canvas at the given x", () => {
        const coin = new Coin(100, 3);
        expect(coin.position.x).toBe(100);
        expect(coin.position.y).toBe(-Coin.RADIUS);
    });

    it("fall() moves the coin down proportional to speed and deltaTime", () => {
        const coin = new Coin(100, 3);
        coin.fall(16); // one frame at the mocked 16ms deltaTime
        expect(coin.position.y).toBeCloseTo(-Coin.RADIUS + 3);
    });

    it("fall() over a longer deltaTime moves proportionally further", () => {
        const coin = new Coin(100, 3);
        coin.fall(32); // two frames' worth of time in one update
        expect(coin.position.y).toBeCloseTo(-Coin.RADIUS + 6);
    });

    it("isOffscreen() is false while above the bottom edge", () => {
        const coin = new Coin(100, 3);
        expect(coin.isOffscreen(400)).toBe(false);
    });

    it("isOffscreen() is true once the coin passes the bottom edge", () => {
        const coin = new Coin(100, 3);
        coin.position.y = 500;
        expect(coin.isOffscreen(400)).toBe(true);
    });
});
