import { CreatureState } from "./sprites/Creature.js";
import { Player } from "./sprites/Player.js";

export const DASH_SPEED = 1.4;
export const DASH_DURATION = 200;
export const DASH_COOLDOWN = 1200;

export class Dash {
    cooldownRemaining = 0;
    private elapsed = -1;
    private direction = 1;

    get isActive(): boolean {
        return this.elapsed >= 0 && this.elapsed < DASH_DURATION;
    }

    activate(player: Player, direction: number): boolean {
        if (this.cooldownRemaining > 0 || player.getState() !== CreatureState.NORMAL) return false;
        this.cooldownRemaining = DASH_COOLDOWN;
        this.elapsed = 0;
        this.direction = Math.sign(direction) || 1;
        return true;
    }

    update(dt: number, player: Player) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        if (this.elapsed < 0) return;
        if (player.getState() !== CreatureState.NORMAL) {
            this.elapsed = -1;
            return;
        }
        this.elapsed += dt;
        if (this.elapsed >= DASH_DURATION) {
            this.elapsed = -1;
            return;
        }
        // Pin vertical velocity to 0 so gravity cannot accumulate during the burst.
        player.setVelocity(this.direction * DASH_SPEED, 0);
    }
}
