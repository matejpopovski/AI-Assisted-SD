/**
 * This is a p5.js script (written in TypeScript). You can read more about
 * p5.js at https://p5js.org.
 *
 * setup() runs once and draw() is called many times per second while the
 * sketch is running. Both must be mapped onto the global namespace for p5
 * to call them — see index.html.
 */

import { Game } from "./Game.js";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

let game: Game;

export function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    frameRate(60);
    game = new Game(CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function draw() {
    background(20);

    if (keyIsDown(LEFT_ARROW)) {
        game.player.moveLeft();
    }
    if (keyIsDown(RIGHT_ARROW)) {
        game.player.moveRight();
    }

    game.update(deltaTime);
    game.draw();
}
