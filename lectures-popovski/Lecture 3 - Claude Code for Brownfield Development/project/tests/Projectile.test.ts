import { describe, it, expect } from "vitest";
import { Projectile } from "../src/Projectile";
import { Enemy } from "../src/Enemy";
import { Path } from "../src/Path";

const straightPath = new Path([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
]);

function enemyAt(distance: number): Enemy {
    const enemy = new Enemy(100, 40);
    enemy.update(distance * 10); // speed=100px/sec, so distance*10 ms travels `distance` px
    return enemy;
}

describe("Projectile", () => {
    it("moves toward its target's current position", () => {
        const target = enemyAt(100); // sitting at x=100
        const projectile = new Projectile(0, 0, target, 10, 50); // 50 px/sec
        projectile.update(1000, straightPath); // one second, 50px of travel
        expect(projectile.x).toBeCloseTo(50);
        expect(projectile.y).toBeCloseTo(0);
    });

    it("does not overshoot the target in one update", () => {
        const target = enemyAt(100);
        const projectile = new Projectile(0, 0, target, 10, 5000); // absurdly fast
        projectile.update(1000, straightPath);
        expect(projectile.x).toBeCloseTo(100); // clamped at the target, not past it
    });

    it("hasHitTarget() is false while still approaching", () => {
        const target = enemyAt(100);
        const projectile = new Projectile(0, 0, target, 10, 50);
        expect(projectile.hasHitTarget(straightPath)).toBe(false);
    });

    it("hasHitTarget() is true once within the hit radius", () => {
        const target = enemyAt(100);
        const projectile = new Projectile(0, 0, target, 10, 50);
        projectile.update(2000, straightPath); // enough travel to arrive
        expect(projectile.hasHitTarget(straightPath)).toBe(true);
    });
});
