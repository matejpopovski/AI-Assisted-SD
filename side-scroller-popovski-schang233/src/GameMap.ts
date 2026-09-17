import { cameraY, visibleRows } from "./Camera.js";
import { Haaaa } from "./sprites/Haaaa.js";
import { Player } from "./sprites/Player.js";
import { ResourceManager } from "./ResourceManager.js";
import { Sprite } from "./sprites/Sprite.js";
import { GRAVITY } from "./GameManager.js";
import { Creature, CreatureState } from "./sprites/Creature.js";
import {
    Heart,
    Music,
    PowerUp,
    Star,
    Arrival,
    WingedBoots,
    GoldenShield,
    Trophy,
} from "./sprites/PowerUp.js";
import { Settings } from "./Settings.js";
import { QiWave } from "./QiWave.js";

export function computeParallaxX(
    offsetX: number,
    myW: number,
    mapWidth: number,
    bgWidth: number
): number {
    return Math.trunc((offsetX * (myW - bgWidth)) / (myW - mapWidth));
}

export class GameMap {
    tiles: p5.Image[][];
    tile_size: number;
    sprites: Sprite[];
    player: Player;
    background: p5.Image[];
    width: number; //height and width in tiles
    height: number;
    level: number;
    resources: ResourceManager;
    settings: Settings;
    prize: p5.SoundFile;
    music: p5.SoundFile;
    boop: p5.SoundFile;
    qiWave: QiWave;
    score = 0;
    finished = false;
    transitionRemaining = 0;
    time = 0;
    boss: Haaaa;
    private trophySpawned = false;

    constructor(level: number, resources: ResourceManager, settings: Settings) {
        this.settings = settings;
        this.level = level;
        this.resources = resources;
        this.initialize();
    }

    initialize() {
        this.qiWave = new QiWave();
        this.transitionRemaining = 0;
        this.boss = null;
        this.trophySpawned = false;
        this.prize = this.resources.getLoad("prize");
        this.music = this.resources.getLoad(`map${this.level + 1}_music`);
        this.boop = this.resources.getLoad("boop2");
        this.sprites = [];
        this.background = []; //this.resources.get("background");
        this.tile_size = this.resources.get("TILE_SIZE");
        const mappings = this.resources.get("mappings");
        const map = this.resources.getLoad(this.resources.get("levels")[this.level]);
        if (!map) throw new Error(`Missing level ${this.level + 1}`);
        const lines = [];
        let width = 0;
        let height = 0;
        map.forEach((line) => {
            if (!line.startsWith("#")) {
                //ignore comment lines
                if (line.startsWith("@")) {
                    const parts = line.split(" ");
                    switch (parts[0]) {
                        case "@parallax-layer": {
                            this.background.push(this.resources.getLoad(parts[1]));
                            break;
                        }
                        case "@music": {
                            this.music = this.resources.getLoad(parts[1]);
                            break;
                        }
                        default: {
                            console.warn("don't know how to handle this tag:" + parts[0]);
                            break;
                        }
                    }
                } else {
                    lines.push(line);
                    width = Math.max(width, line.length);
                }
            }
        });
        if (this.background.length === 0 && (this.level === 0 || this.level === 2))
            this.background.push(this.resources.getLoad(this.level === 0 ? "bg1" : "bg3"));
        this.settings.setMusic(this.music);
        // loadStrings may include the empty line after the final newline.
        while (lines.length && lines[lines.length - 1] === "") lines.pop();
        height = lines.length;
        this.width = width;
        this.height = height;
        this.tiles = [...Array(width)].map(() => Array(height));
        for (let y = 0; y < height; y++) {
            const line = lines[y];
            for (let x = 0; x < line.length; x++) {
                const ch = line.charAt(x);
                if (ch === " ") continue;
                //tiles are A-Z, sprites are a-z, 0-9, and special characters
                if (ch.match(/[A-Z]/)) {
                    //no need to look at mappings for tiles.
                    this.tiles[x][y] = this.resources.get(ch);
                } else {
                    const s = this.resources.get(mappings[ch]).clone();
                    s.setPosition(
                        this.tilesToPixels(x) + this.tile_size - s.getImage().width / 2,
                        this.tilesToPixels(y) + this.tile_size - s.getImage().height
                    );
                    if (ch == "0") {
                        //I don't like hard-coding in the character for the player.
                        this.player = s;
                    } else {
                        if (s instanceof Haaaa) {
                            if (this.level !== 2) throw new Error("HAAAA belongs only in Map 3");
                            this.boss = s;
                            // The contiguous solid ledge below the marker defines the arena.
                            let left = x,
                                right = x;
                            while (left > 1 && /[A-Z]/.test(lines[y + 1].charAt(left - 1))) left--;
                            while (
                                right < width - 2 &&
                                /[A-Z]/.test(lines[y + 1].charAt(right + 1))
                            )
                                right++;
                            s.arenaLeft = left * this.tile_size;
                            s.arenaRight = (right + 1) * this.tile_size;
                        }
                        this.sprites.push(s);
                    }
                }
            }
        }
    }

    tilesToPixels(x: number): number {
        return Math.floor(x * this.tile_size);
    }

    pixelsToTiles(x: number): number {
        return Math.floor(x / this.tile_size);
    }

    camera(): { x: number; y: number } {
        const p = this.player.getPosition();
        return {
            x: Math.trunc(
                Math.max(
                    Math.min(0, 800 - this.tilesToPixels(this.width)),
                    Math.min(0, 400 - Math.round(p.x) - this.tile_size)
                )
            ),
            y: cameraY(p.y + this.player.getImage().height / 2, this.tilesToPixels(this.height)),
        };
    }

    isVisible(s: Sprite): boolean {
        const c = this.camera(),
            p = s.getPosition(),
            img = s.getImage();
        return (
            p.x + img.width + c.x >= 0 &&
            p.x + c.x <= 800 &&
            p.y + img.height + c.y >= 0 &&
            p.y + c.y <= 600
        );
    }

    draw() {
        const { x: offsetX, y: offsetY } = this.camera();
        const mapWidth = this.tilesToPixels(this.width);
        this.background.forEach((bg) => {
            const x = mapWidth > 800 ? computeParallaxX(offsetX, 800, mapWidth, bg.width) : 0;
            // Preserve the existing fit for maps that do not scroll horizontally.
            const sourceWidth = mapWidth > 800 ? 800 : Math.max(800, bg.width);
            image(bg, 0, 0, 800, 600, -x, 0, sourceWidth, bg.height);
        });
        if (this.level === 0 || this.level === 2) {
            push();
            noStroke();
            fill(224, 239, 245, 28);
            for (let i = 0; i < 9; i++) {
                const x = ((i * 107 + this.time * 0.012) % 1000) - 100;
                ellipse(x, 80 + ((i * 71) % 470), 180, 18);
            }
            pop();
        }
        const firstTileX = Math.max(0, this.pixelsToTiles(-offsetX));
        const lastTileX = Math.min(this.width - 1, this.pixelsToTiles(800 - offsetX));
        const [firstRow, lastRow] = visibleRows(offsetY, this.height, this.tile_size);
        for (let y = firstRow; y <= lastRow; y++) {
            for (let x = firstTileX; x <= lastTileX; x++) {
                if (this.tiles[x][y])
                    image(
                        this.tiles[x][y],
                        x * this.tile_size + offsetX,
                        y * this.tile_size + offsetY
                    );
            }
        }
        const p = this.player.getPosition(),
            img = this.player.getImage();
        image(img, Math.trunc(p.x + offsetX), Math.trunc(p.y + offsetY));
        this.sprites.forEach((sprite) => {
            if (!this.isVisible(sprite)) return;
            const pos = sprite.getPosition();
            const bob =
                sprite instanceof Star || sprite instanceof Trophy
                    ? Math.sin(this.time / 220 + pos.x) * 4
                    : 0;
            push();
            if (
                sprite instanceof Haaaa &&
                (sprite.hitFlash > 0 || sprite.getState() === CreatureState.DYING)
            )
                tint(255, 110);
            image(
                sprite.getImage(),
                Math.trunc(pos.x + offsetX),
                Math.trunc(pos.y + offsetY + bob)
            );
            if (sprite instanceof Trophy) {
                noFill();
                stroke(255, 226, 100, 170);
                strokeWeight(3);
                ellipse(pos.x + 32 + offsetX, pos.y + 32 + offsetY + bob, 78, 78);
            }
            pop();
        });
        if (this.boss) this.boss.drawAttack(offsetX, offsetY);
        push();
        noFill();
        if (this.player.shieldRemaining > 0) {
            fill(255, 205, 50, this.player.blockFlash > 0 ? 130 : 38);
            stroke(255, 223, 95);
            strokeWeight(3);
            ellipse(
                p.x + img.width / 2 + offsetX,
                p.y + img.height / 2 + offsetY,
                img.width + 24,
                img.height + 24
            );
        }
        noFill();
        if (this.player.airBurst > 0) {
            stroke(180, 241, 255, this.player.airBurst);
            strokeWeight(3);
            ellipse(
                p.x + img.width / 2 + offsetX,
                p.y + img.height + offsetY,
                80 - this.player.airBurst / 5,
                16
            );
        }
        if (this.player.bootsRemaining > 0 && this.player.getVelocity().x !== 0) {
            stroke(225, 245, 255, 180);
            strokeWeight(2);
            const sign = Math.sign(this.player.getVelocity().x);
            for (let i = 0; i < 3; i++)
                line(
                    p.x + img.width / 2 + offsetX,
                    p.y + 20 + i * 12 + offsetY,
                    p.x + img.width / 2 - sign * 75 + offsetX,
                    p.y + 20 + i * 12 + offsetY
                );
        }
        if (this.transitionRemaining > 0) {
            stroke(135, 219, 255, 170);
            strokeWeight(5);
            for (let i = -2; i <= 2; i++)
                line(
                    p.x + img.width / 2 + i * 15 + offsetX,
                    p.y + img.height + offsetY,
                    p.x + img.width / 2 + i * 15 + offsetX,
                    p.y - 200 + offsetY
                );
        }
        pop();
        this.qiWave.draw(this.player, this.resources.getLoad("qiWaveAura"), offsetX, offsetY);
    }

    playEvent(name: string) {
        if (this.settings.playEvents) this.resources.getLoad(name).play();
    }

    hurtPlayer(): boolean {
        if (this.player.getState() !== CreatureState.NORMAL) return false;
        if (this.player.shieldRemaining > 0) {
            if (this.player.blockFlash === 0) {
                this.player.blockFlash = 250;
                this.playEvent("shield_block");
            }
            return false;
        }
        this.player.setState(CreatureState.DYING);
        return true;
    }

    activateQiWave() {
        if (this.qiWave.activate(this.player, 800) && this.settings.playEvents) {
            this.resources.getLoad("qiWaveSound").play();
        }
    }

    isCollision(s1: Sprite, s2: Sprite): boolean {
        if (s1 == s2) return false;
        if (s1 instanceof Creature && (s1 as Creature).getState() != CreatureState.NORMAL)
            return false;
        if (s2 instanceof Creature && (s2 as Creature).getState() != CreatureState.NORMAL)
            return false;
        const pos1 = s1.getPosition().copy();
        const pos2 = s2.getPosition().copy();
        pos1.x = Math.round(pos1.x);
        pos1.y = Math.round(pos1.y);
        pos2.x = Math.round(pos2.x);
        pos2.y = Math.round(pos2.y);
        const i1 = s1.getImage();
        const i2 = s2.getImage();
        const val =
            pos1.x < pos2.x + i2.width &&
            pos2.x < pos1.x + i1.width &&
            pos1.y < pos2.y + i2.height &&
            pos2.y < pos1.y + i1.height;
        return val;
    }

    getSpriteCollision(s: Sprite): Sprite {
        for (const other of this.sprites) {
            if (!(other instanceof Arrival) && this.isCollision(s, other)) {
                return other;
            }
        }
        return null;
    }

    checkPlayerCollision(p: Player, canKill: boolean) {
        if (p.getState() != CreatureState.NORMAL || this.transitionRemaining > 0 || this.finished)
            return;
        const s = this.getSpriteCollision(p);
        if (s) {
            if (s instanceof Arrival) return;
            if (s instanceof Creature) {
                if (canKill) {
                    if (s instanceof Haaaa) s.damage();
                    else s.setState(CreatureState.DYING);
                    if (this.settings.playEvents) {
                        this.boop.play();
                    }
                    const pos = s.getPosition();
                    p.setPosition(p.getPosition().x, pos.y - p.getImage().height);
                    p.jump(true);
                } else {
                    this.hurtPlayer();
                }
            } else if (s instanceof PowerUp) {
                this.acquirePowerUp(s);
            }
        }
    }

    removeSprite(s: Sprite) {
        const i = this.sprites.indexOf(s);
        if (i > -1) this.sprites.splice(i, 1);
    }

    acquirePowerUp(p: PowerUp) {
        if (this.finished || this.transitionRemaining > 0 || !this.sprites.includes(p)) return;
        this.removeSprite(p);
        if (p instanceof Star) {
            this.score += p.value;
            this.playEvent("collectible");
        } else if (p instanceof WingedBoots) {
            this.player.collectBoots();
            this.playEvent("speed_boots");
        } else if (p instanceof GoldenShield || p instanceof Music) {
            this.player.collectShield();
            this.playEvent("shield_activate");
        } else if (p instanceof Heart) {
            if (this.level + 1 < this.resources.get("levels").length) {
                this.transitionRemaining = 600;
                this.player.setVelocity(0, 0);
                this.playEvent("portal");
            }
        } else if (p instanceof Trophy) {
            this.finished = true;
            this.playEvent("final_reward_chime");
            this.playEvent("final_reward_sting");
        }
    }

    getTileCollision(s: Sprite, newPos: p5.Vector) {
        const oldPos = s.getPosition();
        const fromX = Math.min(oldPos.x, newPos.x);
        const fromY = Math.min(oldPos.y, newPos.y);
        const toX = Math.max(oldPos.x, newPos.x);
        const toY = Math.max(oldPos.y, newPos.y);
        const fromTileX = this.pixelsToTiles(fromX);
        const fromTileY = this.pixelsToTiles(fromY);
        const toTileX = this.pixelsToTiles(toX + s.getImage().width - 1);
        const toTileY = this.pixelsToTiles(toY + s.getImage().height - 1);
        for (let x = fromTileX; x <= toTileX; x++) {
            for (let y = fromTileY; y <= toTileY; y++) {
                if (x < 0 || x >= this.tiles.length || this.tiles[x][y]) {
                    return createVector(x, y);
                }
            }
        }
        return null;
    }

    updateSprite(s: Sprite) {
        //update velocity due to gravity
        const oldVel = s.getVelocity();
        const newPos = s.getPosition().copy();
        const oldPosFeet = newPos.y + s.getImage().height;

        if (!s.isFlying()) {
            oldVel.y = oldVel.y + GRAVITY * deltaTime;
            s.setVelocity(oldVel.x, oldVel.y);
        }

        //update the x part of position first
        newPos.x = newPos.x + oldVel.x * deltaTime;
        //see if there was a collision with a tile at the new location
        let point = this.getTileCollision(s, newPos);
        if (point) {
            if (oldVel.x > 0) {
                //moving to the right
                newPos.x = this.tilesToPixels(point.x) - s.getImage().width;
            } else if (oldVel.x < 0) {
                //moving to the left
                newPos.x = this.tilesToPixels(point.x + 1);
            }
            s.collideHorizontal();
        }
        s.setPosition(newPos.x, newPos.y);
        if (s instanceof Player) {
            // Defer contact from above to the vertical stomp check.
            const touching = this.getSpriteCollision(s);
            const descendingOnto =
                touching instanceof Creature &&
                oldVel.y > 0 &&
                oldPosFeet <= touching.getPosition().y + 1;
            if (!descendingOnto) this.checkPlayerCollision(s as Player, false);
            if (this.transitionRemaining > 0 || this.finished) return;
        }

        //now update the y part of the position
        const oldY = newPos.y;
        newPos.y = newPos.y + oldVel.y * deltaTime;
        point = this.getTileCollision(s, newPos);
        if (point) {
            if (oldVel.y > 0) {
                newPos.y = this.tilesToPixels(point.y) - s.getImage().height;
            } else if (oldVel.y < 0) {
                newPos.y = this.tilesToPixels(point.y + 1);
            }
            s.collideVertical();
        }
        s.setPosition(newPos.x, newPos.y);
        if (s instanceof Player) {
            const touching = this.getSpriteCollision(s);
            this.checkPlayerCollision(
                s,
                oldY < newPos.y && touching != null && oldPosFeet <= touching.getPosition().y + 1
            );
        }
    }

    update() {
        if (this.finished) return;
        this.time += deltaTime;
        if (this.transitionRemaining > 0) {
            this.transitionRemaining = Math.max(0, this.transitionRemaining - deltaTime);
            if (this.transitionRemaining === 0) {
                this.level++;
                this.initialize();
            }
            return;
        }
        if (this.player.getPosition().y > this.tilesToPixels(this.height) + 600)
            this.player.setState(CreatureState.DEAD);
        if (this.player.getState() === CreatureState.DEAD) {
            this.initialize();
            return;
        }
        this.player.update(deltaTime);
        this.qiWave.update(deltaTime, this.player, this.sprites);
        this.updateSprite(this.player);
        if (this.transitionRemaining > 0 || this.finished) return;
        for (const sprite of [...this.sprites]) {
            if (sprite instanceof Haaaa) {
                if (this.isVisible(sprite)) sprite.active = true;
                const attack = sprite.updateCombat(deltaTime, this.player);
                if (attack.melee) this.playEvent("boss_melee");
                if (attack.melee || attack.laser) this.hurtPlayer();
                sprite.update(deltaTime);
                if (sprite.getState() === CreatureState.DEAD && !this.trophySpawned) {
                    this.trophySpawned = true;
                    const trophy = this.resources.get("trophy").clone();
                    trophy.setPosition(
                        sprite.getPosition().x +
                            sprite.getImage().width / 2 -
                            trophy.getImage().width / 2,
                        sprite.getPosition().y + sprite.getImage().height - trophy.getImage().height
                    );
                    this.sprites.push(trophy);
                    this.removeSprite(sprite);
                    this.playEvent("boss_death");
                }
            } else if (sprite instanceof Creature) {
                if (sprite.getState() === CreatureState.DEAD) this.removeSprite(sprite);
                else {
                    if (this.isVisible(sprite)) sprite.wakeUp();
                    this.updateSprite(sprite);
                    sprite.update(deltaTime);
                }
            } else sprite.update(deltaTime);
        }
    }
}
