import { Player } from "./Player.js";
import { Coin } from "./Coin.js";
import { formatScore } from "./format.js";

const SPAWN_INTERVAL_MS = 900;

/**
 * Game owns the Player and the falling Coins, spawns new Coins over time,
 * and each frame moves everything, resolves catches/misses, and draws the
 * current state to the canvas.
 */
export class Game {
    width: number;
    height: number;
    player: Player;
    coins: Coin[];
    score: number;
    missed: number;
    private msSinceSpawn: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.player = new Player(width, height);
        this.coins = [];
        this.score = 0;
        this.missed = 0;
        this.msSinceSpawn = 0;
    }

    update(deltaTime: number) {
        this.msSinceSpawn += deltaTime;
        if (this.msSinceSpawn >= SPAWN_INTERVAL_MS) {
            this.spawnCoin();
            this.msSinceSpawn = 0;
        }

        for (const coin of this.coins) {
            coin.fall(deltaTime);
        }

        this.coins = this.coins.filter((coin) => {
            if (isCaught(this.player, coin)) {
                this.score += 1;
                return false;
            }
            if (coin.isOffscreen(this.height)) {
                this.missed += 1;
                return false;
            }
            return true;
        });
    }

    spawnCoin() {
        const x = Math.random() * this.width;
        const speed = 2 + Math.random() * 2;
        this.coins.push(new Coin(x, speed));
    }

    draw() {
        this.player.draw();
        for (const coin of this.coins) {
            coin.draw();
        }
        fill(255);
        textSize(16);
        text(`Score: ${formatScore(this.score)}`, 10, 20);
        text(`Missed: ${this.missed}`, 10, 40);
    }
}

/** AABB-vs-circle overlap test between the Player's rectangle and a Coin. */
export function isCaught(player: Player, coin: Coin): boolean {
    const closestX = Math.max(
        player.position.x,
        Math.min(coin.position.x, player.position.x + Player.WIDTH)
    );
    const closestY = Math.max(
        player.position.y,
        Math.min(coin.position.y, player.position.y + Player.HEIGHT)
    );
    const dx = coin.position.x - closestX;
    const dy = coin.position.y - closestY;
    return dx * dx + dy * dy <= Coin.RADIUS * Coin.RADIUS;
}
