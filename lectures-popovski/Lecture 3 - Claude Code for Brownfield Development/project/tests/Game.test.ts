import { describe, it, expect } from "vitest";
import { Game } from "../src/Game";
import { STARTING_GOLD, TOWER_COST } from "../src/Constants";
import { Status } from "../src/GameState";

describe("Game", () => {
    it("starts PLAYING with no towers, enemies, or projectiles", () => {
        const game = new Game(700, 450);
        expect(game.state.status).toBe(Status.PLAYING);
        expect(game.towers).toHaveLength(0);
        expect(game.enemies).toHaveLength(0);
        expect(game.projectiles).toHaveLength(0);
        expect(game.economy.balance).toBe(STARTING_GOLD);
    });

    it("placeTower() succeeds and spends gold when affordable", () => {
        const game = new Game(700, 450);
        const placed = game.placeTower(50, 50);
        expect(placed).toBe(true);
        expect(game.towers).toHaveLength(1);
        expect(game.economy.balance).toBe(STARTING_GOLD - TOWER_COST);
    });

    it("placeTower() fails without spending gold when unaffordable", () => {
        const game = new Game(700, 450);
        // Spend down to less than one tower's cost.
        while (game.economy.canAfford(TOWER_COST)) {
            game.placeTower(0, 0);
        }
        const balanceBefore = game.economy.balance;
        const placed = game.placeTower(0, 0);
        expect(placed).toBe(false);
        expect(game.economy.balance).toBe(balanceBefore);
    });

    it("update() spawns enemies over time without throwing", () => {
        const game = new Game(700, 450);
        for (let i = 0; i < 120; i++) {
            game.update(16); // ~2 seconds at 60fps
        }
        expect(game.enemies.length).toBeGreaterThan(0);
    });

    it("a tower placed directly on the path eventually earns gold by killing enemies", () => {
        const game = new Game(700, 450);
        // The path's first segment runs along y = height * 0.2; place a
        // tower right on it so every enemy walks straight through its range.
        game.placeTower(50, 450 * 0.2);
        const balanceAfterTower = game.economy.balance;

        for (let i = 0; i < 600; i++) {
            game.update(16); // ~10 seconds — long enough for a kill
        }

        expect(game.economy.balance).toBeGreaterThan(balanceAfterTower);
    });

    it("update() does nothing once the game is over", () => {
        const game = new Game(700, 450);
        for (let i = 0; i < 10; i++) game.state.loseLife();
        expect(game.state.isGameOver()).toBe(true);

        const enemiesBefore = game.enemies.length;
        game.update(10000);
        expect(game.enemies.length).toBe(enemiesBefore);
    });
});
