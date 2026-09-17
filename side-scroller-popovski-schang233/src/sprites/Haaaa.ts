import { Creature, CreatureState } from "./Creature.js";
import { Player } from "./Player.js";

// Intersect a thick beam with the player's rectangle, including its end caps.
export function beamHits(
    x: number,
    y: number,
    endX: number,
    endY: number,
    player: Player
): boolean {
    const p = player.getPosition(),
        img = player.getImage();
    let enter = 0,
        exit = 1;
    for (const [origin, delta, low, high] of [
        [x, endX - x, p.x - 14, p.x + img.width + 14],
        [y, endY - y, p.y - 14, p.y + img.height + 14],
    ]) {
        if (delta === 0) {
            if (origin < low || origin > high) return false;
        } else {
            const a = (low - origin) / delta,
                b = (high - origin) / delta;
            enter = Math.max(enter, Math.min(a, b));
            exit = Math.min(exit, Math.max(a, b));
            if (enter > exit) return false;
        }
    }
    return true;
}

export class Haaaa extends Creature {
    hp = 3;
    active = false;
    arenaLeft = 64;
    arenaRight = 960;
    hitFlash = 0;
    meleeFlash = 0;
    laserPhase: "idle" | "warning" | "firing" = "idle";
    laserRemaining = 5000;
    meleeRemaining = 0;
    beamX = 0;
    beamY = 0;
    beamEndX = 0;
    beamEndY = 0;
    private phaseTime = 0;
    private direction = -1;

    damage(): boolean {
        if (this.getState() !== CreatureState.NORMAL || this.hitFlash > 0) return false;
        this.hp--;
        this.hitFlash = 250;
        if (this.hp === 0) this.setState(CreatureState.DYING);
        return true;
    }

    updateCombat(dt: number, player: Player): { melee: boolean; laser: boolean } {
        const result = { melee: false, laser: false };
        this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.meleeFlash = Math.max(0, this.meleeFlash - dt);
        if (!this.active || this.getState() !== CreatureState.NORMAL) return result;
        this.meleeRemaining = Math.max(0, this.meleeRemaining - dt);
        this.laserRemaining = Math.max(0, this.laserRemaining - dt);
        const p = player.getPosition(),
            img = player.getImage(),
            own = this.getImage();
        if (this.laserPhase === "idle" && this.laserRemaining === 0) {
            this.beamX = this.position.x + own.width / 2;
            this.beamY = this.position.y + own.height / 2;
            const dx = p.x + img.width / 2 - this.beamX,
                dy = p.y + img.height / 2 - this.beamY;
            const length = Math.hypot(dx, dy) || 1;
            this.beamEndX = this.beamX + (dx / length) * 1600;
            this.beamEndY = this.beamY + (dy / length) * 1600;
            this.laserPhase = "warning";
            this.phaseTime = 1000;
            this.laserRemaining = 5000;
        } else if (this.laserPhase !== "idle") {
            this.phaseTime -= dt;
            if (this.phaseTime <= 0) {
                if (this.laserPhase === "warning") {
                    this.laserPhase = "firing";
                    this.phaseTime = 500;
                } else this.laserPhase = "idle";
            }
        }
        if (this.laserPhase === "firing")
            result.laser = beamHits(this.beamX, this.beamY, this.beamEndX, this.beamEndY, player);
        if (this.laserPhase === "idle") {
            const gapX = Math.max(
                p.x - this.position.x - own.width,
                this.position.x - p.x - img.width,
                0
            );
            const besideBody =
                p.y < this.position.y + own.height && p.y + img.height > this.position.y;
            if (gapX <= img.width && besideBody && this.meleeRemaining === 0) {
                result.melee = true;
                this.meleeRemaining = 1500;
                this.meleeFlash = 250;
            }
            if (this.meleeFlash === 0) {
                this.position.x += this.direction * 0.07 * dt;
                if (this.position.x <= this.arenaLeft) {
                    this.position.x = this.arenaLeft;
                    this.direction = 1;
                }
                if (this.position.x + own.width >= this.arenaRight) {
                    this.position.x = this.arenaRight - own.width;
                    this.direction = -1;
                }
            }
        }
        return result;
    }

    drawAttack(offsetX: number, offsetY: number) {
        if (this.getState() !== CreatureState.NORMAL) return;
        push();
        noFill();
        if (this.laserPhase !== "idle") {
            stroke(this.laserPhase === "warning" ? "#ffb44c" : "#fff4ba");
            strokeWeight(this.laserPhase === "warning" ? 4 : 28);
            line(
                this.beamX + offsetX,
                this.beamY + offsetY,
                this.beamEndX + offsetX,
                this.beamEndY + offsetY
            );
        }
        if (this.meleeFlash > 0) {
            stroke(255, 205, 90, 220);
            strokeWeight(8);
            ellipse(
                this.position.x + this.getImage().width / 2 + offsetX,
                this.position.y + this.getImage().height / 2 + offsetY,
                270,
                160
            );
        }
        pop();
    }
}
