import { Path, Waypoint } from "./Path.js";
import { Enemy } from "./Enemy.js";
import { Tower } from "./Tower.js";
import { Projectile } from "./Projectile.js";
import { WaveSpawner } from "./WaveSpawner.js";
import { Economy } from "./Economy.js";
import { GameState, Status } from "./GameState.js";
import { ENEMY_REWARD, TOWER_COST } from "./Constants.js";

/** The fixed route enemies walk, left edge to right edge, scaled to the canvas. */
function buildPath(width: number, height: number): Path {
    return new Path([
        { x: 0, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.7 },
        { x: width * 0.2, y: height * 0.7 },
        { x: width * 0.2, y: height - 20 },
        { x: width, y: height - 20 },
    ]);
}

/**
 * Owns every subsystem (Path, Economy, GameState, WaveSpawner, and the
 * live Tower/Enemy/Projectile lists) and is the only place they interact.
 * Each subsystem stays ignorant of the others — Enemy doesn't know about
 * Tower, Tower doesn't know about Economy — so Game.update() is the one
 * place that has to be read to understand how a frame plays out.
 */
export class Game {
    readonly path: Path;
    readonly economy: Economy;
    readonly state: GameState;
    private readonly spawner: WaveSpawner;
    towers: Tower[];
    enemies: Enemy[];
    projectiles: Projectile[];

    constructor(width: number, height: number) {
        this.path = buildPath(width, height);
        this.economy = new Economy();
        this.state = new GameState();
        this.spawner = new WaveSpawner();
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
    }

    update(deltaTime: number) {
        if (this.state.isGameOver()) return;

        const spawned = this.spawner.update(deltaTime);
        if (spawned) {
            this.enemies.push(spawned);
        }

        for (const enemy of this.enemies) {
            enemy.update(deltaTime);
        }

        for (const tower of this.towers) {
            const target = tower.tryFire(this.enemies, this.path, deltaTime);
            if (target) {
                this.projectiles.push(new Projectile(tower.x, tower.y, target, tower.damage));
            }
        }

        for (const projectile of this.projectiles) {
            projectile.update(deltaTime, this.path);
        }

        this.resolveHits();
        this.resolveEnemies();

        this.state.checkWin(this.spawner.allWavesComplete(), this.enemies.length);
    }

    /** Apply projectile damage on impact, then drop projectiles that connected. */
    private resolveHits() {
        this.projectiles = this.projectiles.filter((projectile) => {
            if (projectile.hasHitTarget(this.path)) {
                projectile.target.takeDamage(projectile.damage);
                return false;
            }
            return true;
        });
    }

    /** Reward gold for kills, deduct a life for leaks, then drop both from the live list. */
    private resolveEnemies() {
        this.enemies = this.enemies.filter((enemy) => {
            if (enemy.isDead()) {
                this.economy.earn(ENEMY_REWARD);
                return false;
            }
            if (enemy.hasReachedEnd(this.path)) {
                this.state.loseLife();
                return false;
            }
            return true;
        });
    }

    /** Attempts to place a tower at (x, y); returns whether the purchase succeeded. */
    placeTower(x: number, y: number): boolean {
        if (!this.economy.canAfford(TOWER_COST)) {
            return false;
        }
        this.economy.spend(TOWER_COST);
        this.towers.push(new Tower(x, y));
        return true;
    }

    draw() {
        this.drawPath();
        for (const tower of this.towers) tower.draw();
        for (const enemy of this.enemies) enemy.draw(this.path);
        for (const projectile of this.projectiles) projectile.draw();
        this.drawHud();
    }

    private drawPath() {
        stroke(90);
        strokeWeight(24);
        noFill();
        beginShape();
        for (const point of this.path.allWaypoints as Waypoint[]) {
            vertex(point.x, point.y);
        }
        endShape();
        noStroke();
    }

    private drawHud() {
        fill(255);
        textSize(16);
        text(`Gold: ${this.economy.balance}`, 10, 20);
        text(`Lives: ${this.state.lives}`, 10, 40);
        text(`Wave: ${this.spawner.waveNumber}`, 10, 60);
        if (this.state.status === Status.WON) {
            text("You win! All waves cleared.", 10, 80);
        } else if (this.state.status === Status.LOST) {
            text("Game over — the base fell.", 10, 80);
        }
    }
}
