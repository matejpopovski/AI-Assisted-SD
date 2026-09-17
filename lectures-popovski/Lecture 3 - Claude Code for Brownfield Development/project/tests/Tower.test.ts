import { describe, it, expect } from "vitest";
import { Tower } from "../src/Tower";
import { Enemy } from "../src/Enemy";
import { Path } from "../src/Path";

const straightPath = new Path([
    { x: 0, y: 0 },
    { x: 200, y: 0 },
]);

describe("Tower.findTarget", () => {
    it("returns null when no enemies are in range", () => {
        const tower = new Tower(0, 0, 50, 10, 500);
        const farEnemy = new Enemy(100, 40);
        farEnemy.update(2000); // now at x=200, well outside range 50
        expect(tower.findTarget([farEnemy], straightPath)).toBeNull();
    });

    it("returns the enemy within range", () => {
        const tower = new Tower(0, 0, 50, 10, 500);
        const nearEnemy = new Enemy(100, 40);
        nearEnemy.update(300); // x=30, within range 50
        expect(tower.findTarget([nearEnemy], straightPath)).toBe(nearEnemy);
    });

    it("returns the enemy that has traveled furthest, not the one nearest the tower", () => {
        const tower = new Tower(0, 0, 100, 10, 500);
        const nearerToTower = new Enemy(100, 40);
        nearerToTower.update(300); // x=30 — closest to the tower at (0,0), but least progress
        const furthestAlong = new Enemy(100, 40);
        furthestAlong.update(600); // x=60 — farther from the tower, but has traveled more

        expect(tower.findTarget([nearerToTower, furthestAlong], straightPath)).toBe(furthestAlong);
    });

    it("ignores dead enemies", () => {
        const tower = new Tower(0, 0, 100, 10, 500);
        const dead = new Enemy(100, 40);
        dead.takeDamage(999);
        expect(tower.findTarget([dead], straightPath)).toBeNull();
    });
});

describe("Tower.tryFire", () => {
    it("fires immediately on a fresh tower when a target is in range", () => {
        const tower = new Tower(0, 0, 100, 10, 500);
        const enemy = new Enemy(100, 40);
        expect(tower.tryFire([enemy], straightPath, 16)).toBe(enemy);
    });

    it("does not fire again until the cooldown expires", () => {
        const tower = new Tower(0, 0, 100, 10, 500);
        const enemy = new Enemy(100, 40);
        tower.tryFire([enemy], straightPath, 16); // consumes the first shot
        expect(tower.tryFire([enemy], straightPath, 16)).toBeNull();
    });

    it("fires again once enough time has passed", () => {
        const tower = new Tower(0, 0, 100, 10, 500);
        const enemy = new Enemy(100, 40);
        tower.tryFire([enemy], straightPath, 16);
        expect(tower.tryFire([enemy], straightPath, 500)).toBe(enemy);
    });
});
