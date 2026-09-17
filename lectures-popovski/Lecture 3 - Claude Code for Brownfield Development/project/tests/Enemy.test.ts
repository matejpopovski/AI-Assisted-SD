import { describe, it, expect } from "vitest";
import { Enemy } from "../src/Enemy";
import { Path } from "../src/Path";

const straightPath = new Path([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
]);

describe("Enemy", () => {
    it("starts at the beginning of the path", () => {
        const enemy = new Enemy(100, 40);
        expect(enemy.positionOn(straightPath)).toEqual({ x: 0, y: 0 });
    });

    it("update() advances distance traveled proportional to speed and deltaTime", () => {
        const enemy = new Enemy(100, 40); // 100 px/sec
        enemy.update(1000); // one full second
        expect(enemy.positionOn(straightPath)).toEqual({ x: 100, y: 0 });
    });

    it("hasReachedEnd() is false before the path's total length", () => {
        const enemy = new Enemy(100, 40);
        enemy.update(500);
        expect(enemy.hasReachedEnd(straightPath)).toBe(false);
    });

    it("hasReachedEnd() is true once distance traveled reaches the path's total length", () => {
        const enemy = new Enemy(100, 40);
        enemy.update(2000); // 200px, exactly the path length
        expect(enemy.hasReachedEnd(straightPath)).toBe(true);
    });

    it("takeDamage() reduces health, and isDead() reflects it", () => {
        const enemy = new Enemy(100, 40);
        expect(enemy.isDead()).toBe(false);
        enemy.takeDamage(30);
        expect(enemy.health).toBe(10);
        expect(enemy.isDead()).toBe(false);
        enemy.takeDamage(10);
        expect(enemy.isDead()).toBe(true);
    });
});
