/**
 * This is a p5.js script (written in TypeScript). You can read more about
 * p5.js at https://p5js.org.
 *
 * setup() runs once, draw() runs many times per second, and mousePressed()
 * fires on every click — all three must be mapped onto the global
 * namespace for p5 to call them, see index.html.
 */

import { Game } from "./Game.js";
import { TOWER_COST } from "./Constants.js";

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 450;

let game: Game;

export function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    frameRate(60);
    game = new Game(CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function draw() {
    background(20);

    game.update(deltaTime);
    game.draw();
}

/** Click anywhere to place a tower there, if you can afford TOWER_COST gold. */
export function mousePressed() {
    const placed = game.placeTower(mouseX, mouseY);
    if (!placed) {
        console.log(`Not enough gold — towers cost ${TOWER_COST}`);
    }
}
