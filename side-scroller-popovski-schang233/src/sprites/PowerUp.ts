import { Sprite } from "./Sprite.js";

export class PowerUp extends Sprite {}
export class Star extends PowerUp {
    value = 100;
}
export class Silver extends Star {
    value = 200;
}
export class Gold extends Star {
    value = 300;
}
export class Music extends PowerUp {}
export class Heart extends PowerUp {}
export class Arrival extends Sprite {}
export class WingedBoots extends PowerUp {}
export class GoldenShield extends PowerUp {}
export class Trophy extends PowerUp {}
