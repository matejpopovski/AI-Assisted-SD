import { Haaaa } from "./sprites/Haaaa.js";
import { Creature, CreatureState } from "./sprites/Creature.js";
import { Player } from "./sprites/Player.js";
import { Sprite } from "./sprites/Sprite.js";

export class QiWave {
    cooldownRemaining = 0;
    private elapsed = -1;
    private maxRadius = 0;
    private originX = 0;
    private originY = 0;
    private hitEnemies = new Set<Creature>();

    activate(player: Player, viewportWidth: number): boolean {
        if (this.cooldownRemaining > 0 || player.getState() !== CreatureState.NORMAL) return false;
        this.cooldownRemaining = 3000;
        this.elapsed = 0;
        this.maxRadius = viewportWidth / 2;
        this.hitEnemies.clear();
        return true;
    }

    private get radius(): number {
        return this.maxRadius * Math.min(1, Math.max(0, (this.elapsed - 500) / 1000));
    }

    update(dt: number, player: Player, sprites: Sprite[]) {
        this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
        if (this.elapsed < 0) return;
        if (player.getState() !== CreatureState.NORMAL) {
            this.elapsed = -1;
            return;
        }
        const previousElapsed = this.elapsed;
        const previousRadius = this.radius;
        this.elapsed += dt;
        if (this.elapsed < 500) return;
        if (previousElapsed < 500) {
            this.originX = player.getPosition().x + player.getImage().width / 2;
            this.originY = player.getPosition().y + player.getImage().height / 2;
        }
        const radius = this.radius;
        for (const enemy of sprites) {
            if (
                !(enemy instanceof Creature) ||
                enemy instanceof Player ||
                enemy.getState() !== CreatureState.NORMAL ||
                this.hitEnemies.has(enemy)
            )
                continue;
            const pos = enemy.getPosition();
            const img = enemy.getImage();
            const nearX = Math.max(pos.x - this.originX, 0, this.originX - pos.x - img.width);
            const nearY = Math.max(pos.y - this.originY, 0, this.originY - pos.y - img.height);
            const farX = Math.max(
                Math.abs(pos.x - this.originX),
                Math.abs(pos.x + img.width - this.originX)
            );
            const farY = Math.max(
                Math.abs(pos.y - this.originY),
                Math.abs(pos.y + img.height - this.originY)
            );
            // Sweep the front between frames so a slow frame cannot skip an enemy.
            if (Math.hypot(nearX, nearY) <= radius && Math.hypot(farX, farY) >= previousRadius) {
                this.hitEnemies.add(enemy);
                if (enemy instanceof Haaaa) enemy.damage();
                else enemy.setState(CreatureState.DYING);
            }
        }
        if (this.elapsed >= 1500) this.elapsed = -1;
    }

    draw(player: Player, aura: p5.Image, offsetX: number, offsetY: number) {
        if (this.elapsed < 0) return;
        push();
        if (this.elapsed < 500) {
            const progress = this.elapsed / 500;
            const size =
                Math.max(player.getImage().width, player.getImage().height) * (2 + progress * 0.3);
            const x = player.getPosition().x + player.getImage().width / 2 + offsetX;
            const y = player.getPosition().y + player.getImage().height / 2 + offsetY;
            tint(255, 90 + 60 * Math.sin(progress * Math.PI));
            image(aura, x - size / 2, y - size / 2, size, size);
        } else {
            const opacity = 255 * (1 - (this.elapsed - 500) / 1000);
            noFill();
            stroke(255, 215, 75, opacity);
            strokeWeight(6);
            ellipse(
                this.originX + offsetX,
                this.originY + offsetY,
                this.radius * 2,
                this.radius * 2
            );
        }
        pop();
    }

    drawHud(icon: p5.Image) {
        push();
        noStroke();
        fill(20, 24, 32, 220);
        rect(16, 16, 68, 80, 8);
        if (this.cooldownRemaining > 0) tint(105, 150);
        image(icon, 22, 22, 56, 56);
        noTint();
        fill(20, 24, 32);
        rect(58, 63, 26, 26, 5);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        text(
            this.cooldownRemaining > 0 ? String(Math.ceil(this.cooldownRemaining / 1000)) : "Q",
            71,
            76
        );
        pop();
    }
}
