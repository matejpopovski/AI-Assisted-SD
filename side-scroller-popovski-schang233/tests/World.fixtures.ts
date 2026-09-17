import { vi } from "vitest";
import { readFileSync } from "node:fs";
import { GameMap } from "../src/GameMap";
import { ResourceManager } from "../src/ResourceManager";
import { Settings } from "../src/Settings";
import { Player } from "../src/sprites/Player";
import { Sprite } from "../src/sprites/Sprite";
import { Grub, Fly } from "../src/sprites/Creature";
import { Haaaa } from "../src/sprites/Haaaa";
import {
    Star,
    Silver,
    Gold,
    Heart,
    WingedBoots,
    GoldenShield,
    Arrival,
    Trophy,
} from "../src/sprites/PowerUp";

export function animated<T extends Sprite>(sprite: T, width = 64, height = 64): T {
    for (const name of ["default", "left", "right", "deadLeft", "deadRight"]) {
        if (name !== "default") sprite.addAnimation(name);
        sprite.addFrame(name, { width, height } as p5.Image, 150);
    }
    return sprite;
}

export function world(level = 0, actual = false) {
    const registry = JSON.parse(readFileSync("assets/resources/resources.json", "utf8"));
    const sprites: Record<string, Sprite> = {
        player: animated(new Player(), 80),
        grub: animated(new Grub()),
        fly: animated(new Fly()),
        caveman: animated(new Grub(), 32, 32),
        star: animated(new Star()),
        silver: animated(new Silver()),
        gold: animated(new Gold()),
        heart: animated(new Heart()),
        powerup: animated(new WingedBoots(), 48, 48),
        music: animated(new GoldenShield(), 48, 48),
        shield: animated(new GoldenShield(), 48, 48),
        arrival: animated(new Arrival()),
        boss: animated(new Haaaa(), 160, 128),
        trophy: animated(new Trophy()),
    };
    const sound = { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn(), playMode: vi.fn() };
    const maps = registry.maps.levels.map((name: string) =>
        actual
            ? readFileSync(`assets/maps/${name}.txt`, "utf8").split(/\r?\n/)
            : [
                  "                  ",
                  "                  ",
                  "                  ",
                  "                  ",
                  "   0              ",
                  "BBBBBBBBBBBBBBBBBB",
              ]
    );
    const resources = {
        get: (key: string) =>
            sprites[key] || registry.maps[key] || ({ width: 64, height: 64 } as p5.Image),
        getLoad: (key: string) =>
            key === "map1"
                ? maps[0]
                : key === "map2"
                  ? maps[1]
                  : key === "map3"
                    ? maps[2]
                    : key.startsWith("bg")
                      ? { width: 1600, height: 600 }
                      : sound,
    } as unknown as ResourceManager;
    const settings = {
        playEvents: true,
        setMusic: vi.fn(),
        hideMenu: vi.fn(),
        showMenu: vi.fn(),
        toggleFullScreen: vi.fn(),
    } as unknown as Settings;
    return { map: new GameMap(level, resources, settings), resources, settings, sound };
}
