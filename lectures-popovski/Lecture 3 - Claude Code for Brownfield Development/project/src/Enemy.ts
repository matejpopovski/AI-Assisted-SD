import { Path, Waypoint } from "./Path.js";
import { ENEMY_HEALTH, ENEMY_SPEED } from "./Constants.js";

/**
 * An Enemy walks a fixed Path from spawn to the player's base. It tracks
 * distance traveled (not raw x/y) so Path is the single source of truth
 * for geometry — see Path.ts for why.
 */
export class Enemy {
    speed: number;
    health: number;
    private distanceTraveled: number;

    constructor(speed: number = ENEMY_SPEED, health: number = ENEMY_HEALTH) {
        this.speed = speed;
        this.health = health;
        this.distanceTraveled = 0;
    }

    /** Advance along the path. `deltaTime` is p5's per-frame ms, same convention as Coin Catcher's Coin.fall(). */
    update(deltaTime: number) {
        this.distanceTraveled += this.speed * (deltaTime / 1000);
    }

    positionOn(path: Path): Waypoint {
        return path.pointAtDistance(this.distanceTraveled);
    }

    /** How far along the path this enemy has gotten — used by Tower to prioritize the biggest threat. */
    get progress(): number {
        return this.distanceTraveled;
    }

    hasReachedEnd(path: Path): boolean {
        return this.distanceTraveled >= path.totalLength;
    }

    takeDamage(amount: number) {
        this.health -= amount;
    }

    isDead(): boolean {
        return this.health <= 0;
    }

    draw(path: Path) {
        const pos = this.positionOn(path);
        fill(200, 60, 60);
        noStroke();
        circle(pos.x, pos.y, 16);
    }
}
