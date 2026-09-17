import { Enemy } from "./Enemy.js";
import { Path } from "./Path.js";
import { TOWER_DAMAGE, TOWER_FIRE_INTERVAL_MS, TOWER_RANGE } from "./Constants.js";

/**
 * A Tower sits at a fixed position and locks onto one Enemy at a time,
 * keeping fire on it until it dies or leaves range before acquiring a
 * new target. Re-picking a fresh "best" target on every single shot
 * sounds reasonable but isn't: as newer enemies keep entering range and
 * out-progressing whichever one the tower is currently engaged with,
 * fire keeps getting redirected and nothing ever takes enough hits to
 * die. Locking on avoids that, and matches how tower defense games
 * actually behave. When a new target is needed, the enemy that has made
 * the most progress toward the base is preferred — the greatest threat,
 * not simply the nearest to the tower. Tower hands the target off to
 * whoever owns the Enemy list (Game) to spawn a Projectile — Tower
 * itself doesn't know about Projectiles, keeping targeting logic and
 * projectile motion independently testable.
 */
export class Tower {
    x: number;
    y: number;
    range: number;
    damage: number;
    fireIntervalMs: number;
    private cooldownMs: number;
    private currentTarget: Enemy | null;

    constructor(
        x: number,
        y: number,
        range: number = TOWER_RANGE,
        damage: number = TOWER_DAMAGE,
        fireIntervalMs: number = TOWER_FIRE_INTERVAL_MS
    ) {
        this.x = x;
        this.y = y;
        this.range = range;
        this.damage = damage;
        this.fireIntervalMs = fireIntervalMs;
        this.cooldownMs = 0;
        this.currentTarget = null;
    }

    /** The in-range living enemy that has traveled furthest along the path, or null if none qualify. */
    findTarget(enemies: Enemy[], path: Path): Enemy | null {
        let best: Enemy | null = null;
        for (const enemy of enemies) {
            if (enemy.isDead()) continue;
            const pos = enemy.positionOn(path);
            const dx = pos.x - this.x;
            const dy = pos.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= this.range && (!best || enemy.progress > best.progress)) {
                best = enemy;
            }
        }
        return best;
    }

    private isInRange(enemy: Enemy, path: Path): boolean {
        const pos = enemy.positionOn(path);
        const dx = pos.x - this.x;
        const dy = pos.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.range;
    }

    /**
     * Ticks the cooldown down; returns a target to fire at once it's ready
     * and an in-range enemy exists, resetting the cooldown. Returns null
     * on every frame it doesn't fire. Keeps the current lock-on target as
     * long as it's still alive and in range; only re-acquires (via
     * findTarget) once that stops being true.
     */
    tryFire(enemies: Enemy[], path: Path, deltaTime: number): Enemy | null {
        this.cooldownMs -= deltaTime;
        if (this.cooldownMs > 0) {
            return null;
        }

        const lockValid =
            this.currentTarget !== null &&
            !this.currentTarget.isDead() &&
            this.isInRange(this.currentTarget, path);
        if (!lockValid) {
            this.currentTarget = this.findTarget(enemies, path);
        }
        if (!this.currentTarget) {
            return null;
        }

        this.cooldownMs = this.fireIntervalMs;
        return this.currentTarget;
    }

    draw() {
        fill(80, 160, 230);
        noStroke();
        rectMode(CENTER);
        rect(this.x, this.y, 20, 20);
        rectMode(CORNER);
    }
}
