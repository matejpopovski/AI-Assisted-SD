import { Creature, CreatureState } from "./Creature.js";
import { Dash } from "../Dash.js";

export class Player extends Creature {
    MAX_SPEED: number;
    JUMP_SPEED: number;
    onGround: boolean;
    bootsRemaining = 0;
    shieldRemaining = 0;
    blockFlash = 0;
    airBurst = 0;
    dash: Dash = new Dash();
    private airJumpAvailable = true;

    constructor() {
        super();
        this.MAX_SPEED = 0.5;
        this.JUMP_SPEED = 0.95;
        this.onGround = false;
    }

    getMaxSpeed() {
        return this.MAX_SPEED * (this.bootsRemaining > 0 ? 1.5 : 1);
    }

    collideVertical() {
        if (this.velocity.y > 0) {
            this.onGround = true;
            this.airJumpAvailable = true;
        }
        this.velocity.y = 0;
    }

    tryJump(): "ground" | "air" | "none" {
        if (this.getState() !== CreatureState.NORMAL) return "none";
        if (this.onGround) {
            this.jump(false);
            this.airJumpAvailable = true;
            return "ground";
        }
        if (!this.airJumpAvailable) return "none";
        this.airJumpAvailable = false;
        this.setVelocity(this.velocity.x, -this.JUMP_SPEED);
        this.airBurst = 250;
        return "air";
    }

    update(dt: number) {
        this.bootsRemaining = Math.max(0, this.bootsRemaining - dt);
        this.shieldRemaining = Math.max(0, this.shieldRemaining - dt);
        this.blockFlash = Math.max(0, this.blockFlash - dt);
        this.airBurst = Math.max(0, this.airBurst - dt);
        this.dash.update(dt, this);
        super.update(dt);
    }

    getFacing(): number {
        return this.currAnimName === "left" ? -1 : 1;
    }

    tryDash(direction: number): boolean {
        return this.dash.activate(this, direction);
    }

    collectBoots() {
        this.bootsRemaining = 10000;
    }
    collectShield() {
        this.shieldRemaining = 10000;
    }

    collideHorizontal() {
        this.velocity.x = 0;
    }

    jump(forceJump: boolean) {
        if (this.onGround || forceJump) {
            this.onGround = false;
            this.setVelocity(0, -this.JUMP_SPEED);
        }
    }

    setPosition(x: number, y: number) {
        //check if falling
        if (Math.round(y) > Math.round(this.position.y)) {
            this.onGround = false;
        }
        super.setPosition(x, y);
    }

    addVelocity(x: number, y: number) {
        this.velocity.add(x, y);
        if (this.velocity.x > this.MAX_SPEED) {
            this.velocity.x = this.MAX_SPEED;
        } else if (this.velocity.x <= -this.MAX_SPEED) {
            this.velocity.x = -this.MAX_SPEED;
        }
        if (this.velocity.y > this.MAX_SPEED) {
            this.velocity.y = this.MAX_SPEED;
        } else if (this.velocity.y < -this.MAX_SPEED) {
            this.velocity.y = -this.MAX_SPEED;
        }
        if (this.velocity.x > 0 && this.currAnimName != "right") {
            this.setAnimation("right");
        }
        if (this.velocity.x < 0 && this.currAnimName != "left") {
            this.setAnimation("left");
        }
    }

    clone() {
        const p = new Player();
        p.position = this.position.copy();
        p.velocity = this.velocity.copy();
        p.animations = {}; //throw away the animations from the new constructor call
        //and copy over the animations from this
        for (const key in this.animations) {
            if (Object.prototype.hasOwnProperty.call(this.animations, key)) {
                const element = this.animations[key];
                p.animations[key] = element.clone();
            }
        }
        p.currAnimName = this.currAnimName;
        p.currAnimation = p.animations[p.currAnimName];
        p.MAX_SPEED = this.MAX_SPEED;
        return p;
    }
}
