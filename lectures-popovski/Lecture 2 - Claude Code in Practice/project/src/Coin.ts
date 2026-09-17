/**
 * A Coin falls from the top of the canvas at a constant speed. The Game
 * is responsible for spawning Coins, moving them, and removing them once
 * they are caught or fall off the bottom of the canvas.
 */
export class Coin {
    static readonly RADIUS = 10;

    position: p5.Vector;
    speed: number;

    constructor(x: number, speed: number) {
        this.position = createVector(x, -Coin.RADIUS);
        this.speed = speed;
    }

    fall(deltaTime: number) {
        this.position.y += this.speed * (deltaTime / 16);
    }

    isOffscreen(canvasHeight: number): boolean {
        return this.position.y - Coin.RADIUS > canvasHeight;
    }

    draw() {
        fill(255, 215, 0);
        noStroke();
        circle(this.position.x, this.position.y, Coin.RADIUS * 2);
    }
}
