import { describe, it, expect } from "vitest";
import { Player } from "../src/Player";
import { Coin } from "../src/Coin";
import { isCaught } from "../src/Game";

describe("Player", () => {
    it("starts centered horizontally near the bottom of the canvas", () => {
        const player = new Player(600, 400);
        expect(player.position.x).toBe(300 - Player.WIDTH / 2);
        expect(player.position.y).toBe(400 - Player.HEIGHT - 10);
    });

    it("moveLeft() stops at the left edge of the canvas", () => {
        const player = new Player(600, 400);
        for (let i = 0; i < 100; i++) player.moveLeft();
        expect(player.position.x).toBe(0);
    });

    it("moveRight() stops at the right edge of the canvas", () => {
        const player = new Player(600, 400);
        for (let i = 0; i < 100; i++) player.moveRight();
        expect(player.position.x).toBe(600 - Player.WIDTH);
    });
});

describe("isCaught", () => {
    it("returns true when a coin's center overlaps the player rectangle", () => {
        const player = new Player(600, 400);
        const coin = new Coin(player.position.x + 10, 0);
        coin.position.y = player.position.y;

        expect(isCaught(player, coin)).toBe(true);
    });

    it("returns false when a coin is far from the player", () => {
        const player = new Player(600, 400);
        const coin = new Coin(0, 0);
        coin.position.y = 0;

        expect(isCaught(player, coin)).toBe(false);
    });

    it("returns false when a coin is directly above the player but not low enough yet", () => {
        const player = new Player(600, 400);
        const coin = new Coin(player.position.x + 10, 0);
        coin.position.y = player.position.y - 50;

        expect(isCaught(player, coin)).toBe(false);
    });
});
