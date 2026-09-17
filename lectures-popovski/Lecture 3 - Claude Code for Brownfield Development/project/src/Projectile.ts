import { Enemy } from "./Enemy.js";
import { Path } from "./Path.js";
import { PROJECTILE_HIT_RADIUS, PROJECTILE_SPEED } from "./Constants.js";

/**
 * A Projectile chases the Enemy that fired it, following its current
 * position each frame rather than a fixed point — so a fast enemy can
 * still dodge a slow projectile. Game is responsible for applying damage
 * and removing the projectile once hasHitTarget() is true; Projectile
 * itself never mutates the Enemy.
 */
export class Projectile {
    x: number;
    y: number;
    readonly target: Enemy;
    readonly damage: number;
    private readonly speed: number;

    constructor(
        x: number,
        y: number,
        target: Enemy,
        damage: number,
        speed: number = PROJECTILE_SPEED
    ) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
    }

    update(deltaTime: number, path: Path) {
        const targetPos = this.target.positionOn(path);
        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;

        const step = this.speed * (deltaTime / 1000);
        const travel = Math.min(step, distance);
        this.x += (dx / distance) * travel;
        this.y += (dy / distance) * travel;
    }

    hasHitTarget(path: Path): boolean {
        const targetPos = this.target.positionOn(path);
        const dx = targetPos.x - this.x;
        const dy = targetPos.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= PROJECTILE_HIT_RADIUS;
    }

    draw() {
        fill(255, 240, 150);
        noStroke();
        circle(this.x, this.y, 6);
    }
}
