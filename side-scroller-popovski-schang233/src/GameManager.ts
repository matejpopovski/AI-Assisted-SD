import { drawHud, drawInstructions, drawFinished } from "./GameHud.js";
import { Settings } from "./Settings.js";
import { GameAction } from "./GameAction.js";
import { GameMap } from "./GameMap.js";
import { InputManager } from "./InputManager.js";
import { ResourceManager } from "./ResourceManager.js";
import { SoundManager } from "./SoundManager.js";
import { CreatureState } from "./sprites/Creature.js";

export const GRAVITY: number = 0.002;

export enum STATE {
    Loading,
    Menu,
    Running,
    Finished,
}

export class GameManager {
    resources: ResourceManager; //the resovoir of all loaded resources
    map: GameMap; //the current state of the game
    inputManager: InputManager; //mappings between user events (keyboard, mouse, etc.) and game actions (run-left, jump, etc.)
    settings: Settings;
    soundManager: SoundManager; //a player for background music and event sounds
    oldState: STATE;
    gameState: STATE; //the different possible states the game could be in (loading, menu, running, finished, etc.)
    level: number;
    instructionsVisible = false;
    moveRight: GameAction;
    moveLeft: GameAction;
    jump: GameAction;
    stop: GameAction;
    qiWave: GameAction;
    dash: GameAction;

    constructor() {
        this.level = 0;
        this.oldState = STATE.Loading;
        this.gameState = STATE.Loading;
        this.resources = new ResourceManager("assets/assets.json");
        this.inputManager = new InputManager();
        this.settings = new Settings();
        this.soundManager = new SoundManager();
        this.moveRight = new GameAction();
        this.moveLeft = new GameAction();
        this.jump = new GameAction();

        this.qiWave = new GameAction();
        this.dash = new GameAction();
    }

    draw() {
        switch (this.gameState) {
            case STATE.Running: {
                this.map.draw();
                drawHud(this.map);
                if (this.instructionsVisible) drawInstructions();
                break;
            }
            case STATE.Menu: {
                this.map.draw();
                //this.settings.draw();
                this.settings.showMenu();
                break;
            }
            case STATE.Loading: {
                break;
            }
            case STATE.Finished: {
                this.map.draw();
                drawFinished(this.map);
                break;
            }
            default: {
                //should never happen
                console.error("IMPOSSIBLE STATE IN GAME");
                break;
            }
        }
    }

    update() {
        switch (this.gameState) {
            case STATE.Running: {
                this.map.update();
                if (this.map.finished) {
                    this.gameState = STATE.Finished;
                    this.inputManager.reset();
                    break;
                }
                if (this.map.transitionRemaining > 0) {
                    this.inputManager.reset();
                    break;
                }
                this.inputManager.checkInput();
                this.processActions();
                break;
            }
            case STATE.Menu: {
                break;
            }
            case STATE.Loading: {
                if (this.resources.isLoaded()) {
                    //now setup the first map
                    this.map = new GameMap(this.level, this.resources, this.settings);

                    //this.map.player.setVelocity(1,1);
                    this.inputManager.setGameAction(this.moveRight, RIGHT_ARROW);
                    this.inputManager.setGameAction(this.moveLeft, LEFT_ARROW);
                    this.inputManager.setGameAction(this.jump, 32);

                    this.inputManager.setGameAction(this.qiWave, 81);
                    this.inputManager.setGameAction(this.dash, SHIFT);
                    this.oldState = STATE.Running;
                    this.gameState = STATE.Menu;
                }
                break;
            }
            case STATE.Finished: {
                break;
            }
            default: {
                //should never happen
                console.error("IMPOSSIBLE STATE IN GAME");
                break;
            }
        }
    }

    processActions() {
        if (this.map.finished || this.map.transitionRemaining > 0) return;
        const player = this.map.player;
        const vel = player.getVelocity();
        // While dashing, Dash.update() already drives velocity each tick — leave it alone.
        if (!player.dash.isActive) {
            vel.x = 0;
            if (this.moveRight.isPressed() && player.getState() == CreatureState.NORMAL) {
                vel.x = player.getMaxSpeed();
            }
            if (this.moveLeft.isPressed() && player.getState() == CreatureState.NORMAL) {
                vel.x = -player.getMaxSpeed();
            }
        }
        player.setVelocity(vel.x, vel.y);
        if (this.jump.isBeginPress() && player.getState() == CreatureState.NORMAL) {
            if (player.tryJump() === "air") this.map.playEvent("double_jump");
        }
        if (this.qiWave.isBeginPress()) {
            this.map.activateQiWave();
        }
        if (this.dash?.isBeginPress()) {
            const direction = this.moveLeft.isPressed()
                ? -1
                : this.moveRight.isPressed()
                  ? 1
                  : player.getFacing();
            player.tryDash(direction);
        }
    }

    replay() {
        this.map = new GameMap(0, this.resources, this.settings);
        this.level = 0;
        this.inputManager.reset();
        this.instructionsVisible = false;
        this.gameState = STATE.Running;
        this.oldState = STATE.Running;
        this.settings.hideMenu();
    }

    handleKey(keyName: string) {
        const key = keyName.toLowerCase();
        if (key === "escape") this.toggleFullScreen();
        else if (this.gameState === STATE.Finished && key === "y") this.replay();
        else if (this.gameState === STATE.Finished && key === "u") this.toggleMenu();
        else if (key === "m" && this.map) this.toggleMenu();
        else if (key === "i") this.instructionsVisible = !this.instructionsVisible;
    }

    toggleFullScreen() {
        this.settings.toggleFullScreen();
    }

    toggleMenu() {
        if (this.gameState == STATE.Menu) {
            this.gameState = this.oldState;
            if (this.gameState != STATE.Menu) {
                this.settings.hideMenu();
            } else {
                this.settings.showMenu();
            }
        } else {
            this.oldState = this.gameState;
            this.gameState = STATE.Menu;
            this.settings.showMenu();
        }
    }
}
