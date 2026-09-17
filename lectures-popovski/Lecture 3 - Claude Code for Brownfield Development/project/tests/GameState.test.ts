import { describe, it, expect } from "vitest";
import { GameState, Status } from "../src/GameState";

describe("GameState", () => {
    it("starts PLAYING with the given lives", () => {
        const state = new GameState(3);
        expect(state.lives).toBe(3);
        expect(state.status).toBe(Status.PLAYING);
        expect(state.isGameOver()).toBe(false);
    });

    it("loseLife() decrements lives", () => {
        const state = new GameState(3);
        state.loseLife();
        expect(state.lives).toBe(2);
        expect(state.status).toBe(Status.PLAYING);
    });

    it("loseLife() transitions to LOST at 0 lives", () => {
        const state = new GameState(1);
        state.loseLife();
        expect(state.lives).toBe(0);
        expect(state.status).toBe(Status.LOST);
        expect(state.isGameOver()).toBe(true);
    });

    it("loseLife() after game over does nothing further", () => {
        const state = new GameState(1);
        state.loseLife(); // now LOST
        state.loseLife(); // should be a no-op
        expect(state.lives).toBe(0);
    });

    it("checkWin() transitions to WON only when all waves are complete and no enemies remain", () => {
        const state = new GameState(3);
        state.checkWin(false, 0);
        expect(state.status).toBe(Status.PLAYING);

        state.checkWin(true, 2);
        expect(state.status).toBe(Status.PLAYING);

        state.checkWin(true, 0);
        expect(state.status).toBe(Status.WON);
    });

    it("checkWin() does nothing once the game is already over", () => {
        const state = new GameState(1);
        state.loseLife(); // LOST
        state.checkWin(true, 0);
        expect(state.status).toBe(Status.LOST);
    });
});
