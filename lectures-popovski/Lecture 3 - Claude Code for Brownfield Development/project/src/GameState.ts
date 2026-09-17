import { STARTING_LIVES } from "./Constants.js";

export enum Status {
    PLAYING = "PLAYING",
    WON = "WON",
    LOST = "LOST",
}

/**
 * Tracks lives and the win/lose state machine. Game calls loseLife() when
 * an enemy reaches the base and checkWin() once a wave finishes; both are
 * plain state transitions kept separate from Game's per-frame update loop
 * so the rules ("lose at 0 lives", "win once all waves are cleared") are
 * each one small, testable method instead of buried in a big update().
 */
export class GameState {
    lives: number;
    status: Status;

    constructor(startingLives: number = STARTING_LIVES) {
        this.lives = startingLives;
        this.status = Status.PLAYING;
    }

    loseLife() {
        if (this.status !== Status.PLAYING) return;
        this.lives -= 1;
        if (this.lives <= 0) {
            this.lives = 0;
            this.status = Status.LOST;
        }
    }

    /** Call once all waves have finished spawning and no enemies remain alive. */
    checkWin(allWavesComplete: boolean, enemiesRemaining: number) {
        if (this.status !== Status.PLAYING) return;
        if (allWavesComplete && enemiesRemaining === 0) {
            this.status = Status.WON;
        }
    }

    isGameOver(): boolean {
        return this.status !== Status.PLAYING;
    }
}
