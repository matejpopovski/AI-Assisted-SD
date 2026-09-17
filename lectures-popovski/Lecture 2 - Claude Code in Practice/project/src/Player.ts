/**
 * The Player is the paddle the user moves left and right along the bottom
 * of the canvas to catch falling Coins.
 */
export class Player {
    static readonly WIDTH = 60;
    static readonly HEIGHT = 16;
    static readonly SPEED = 6;

    position: p5.Vector;
    private canvasWidth: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.position = createVector(
            canvasWidth / 2 - Player.WIDTH / 2,
            canvasHeight - Player.HEIGHT - 10
        );
    }

    moveLeft() {
        this.position.x = Math.max(0, this.position.x - Player.SPEED);
    }

    moveRight() {
        this.position.x = Math.min(this.canvasWidth - Player.WIDTH, this.position.x + Player.SPEED);
    }

    draw() {
        fill(100, 200, 255);
        noStroke();
        rect(this.position.x, this.position.y, Player.WIDTH, Player.HEIGHT);
    }
}
