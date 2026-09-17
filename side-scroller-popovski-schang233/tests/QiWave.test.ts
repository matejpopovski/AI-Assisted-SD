import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QiWave } from "../src/QiWave";
import { Player } from "../src/sprites/Player";
import { CreatureState, Grub } from "../src/sprites/Creature";
import { GameMap } from "../src/GameMap";
import { GameManager } from "../src/GameManager";
import { GameAction } from "../src/GameAction";
import { InputManager } from "../src/InputManager";
import { ResourceManager } from "../src/ResourceManager";
import { Settings } from "../src/Settings";

function spriteAt<T extends Player | Grub>(sprite: T, x: number, y: number): T {
    sprite.setPosition(x - 10, y - 10);
    vi.spyOn(sprite, "getImage").mockReturnValue({ width: 20, height: 20 } as p5.Image);
    return sprite;
}

describe("Qi Wave", () => {
    let wave: QiWave;
    let player: Player;

    beforeEach(() => {
        wave = new QiWave();
        player = spriteAt(new Player(), 0, 0);
    });

    afterEach(() => vi.unstubAllGlobals());

    it("charges for 0.5 seconds, then hits when the front reaches an enemy", () => {
        const enemy = spriteAt(new Grub(), 210, 0);
        wave.activate(player, 800);
        wave.update(499, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.NORMAL);
        wave.update(500, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.NORMAL);
        wave.update(1, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.DYING);
    });

    it("kills multiple enemies in all directions but not beyond the circular reach", () => {
        const inside = [
            [350, 0],
            [-350, 0],
            [0, 350],
            [0, -350],
        ].map(([x, y]) => spriteAt(new Grub(), x, y));
        const outside = [spriteAt(new Grub(), 411, 0), spriteAt(new Grub(), 310, 310)];
        wave.activate(player, 800);
        wave.update(1500, player, [...inside, ...outside]);
        inside.forEach((enemy) => expect(enemy.getState()).toBe(CreatureState.DYING));
        outside.forEach((enemy) => expect(enemy.getState()).toBe(CreatureState.NORMAL));
    });

    it("hits an enemy whose bounds touch the final front without skipping a long frame", () => {
        const enemy = spriteAt(new Grub(), 410, 0);
        wave.activate(player, 800);
        wave.update(2000, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.DYING);
    });

    it("hits each enemy at most once per activation", () => {
        const enemy = spriteAt(new Grub(), 110, 0);
        const setState = vi.spyOn(enemy, "setState");
        wave.activate(player, 800);
        wave.update(750, player, [enemy]);
        // Even if another system restores it, this activation must not hit it again.
        enemy.state = CreatureState.NORMAL;
        wave.update(10, player, [enemy]);
        expect(setState).toHaveBeenCalledTimes(1);
    });

    it("does not hit enemies entering the already-swept interior", () => {
        wave.activate(player, 800);
        wave.update(1000, player, []);
        const enemy = spriteAt(new Grub(), 50, 0);
        wave.update(100, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.NORMAL);
    });

    it("anchors the wave at the player's center after charging", () => {
        wave.activate(player, 800);
        player.setPosition(990, -10);
        wave.update(500, player, []);
        player.setPosition(1990, -10);
        const enemy = spriteAt(new Grub(), 1200, 0);
        wave.update(500, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.DYING);
    });

    it("uses half the supplied viewport width as its maximum radius", () => {
        const enemy = spriteAt(new Grub(), 250, 0);
        wave.activate(player, 400);
        wave.update(1500, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.NORMAL);
    });

    it("ends the attack after one second of expansion", () => {
        wave.activate(player, 800);
        wave.update(1500, player, []);
        const enemy = spriteAt(new Grub(), 400, 0);
        wave.update(100, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.NORMAL);
    });

    it("blocks activation until exactly three seconds and permits a new attack", () => {
        expect(wave.activate(player, 800)).toBe(true);
        wave.update(2999, player, []);
        expect(wave.activate(player, 800)).toBe(false);
        expect(wave.cooldownRemaining).toBe(1);
        wave.update(1, player, []);
        expect(wave.activate(player, 800)).toBe(true);
        expect(wave.cooldownRemaining).toBe(3000);
    });

    it("ignores players and already dying enemies", () => {
        const enemy = spriteAt(new Grub(), 0, 0);
        enemy.setState(CreatureState.DYING);
        const setState = vi.spyOn(enemy, "setState");
        wave.activate(player, 800);
        wave.update(1000, player, [player, enemy]);
        expect(player.getState()).toBe(CreatureState.NORMAL);
        expect(setState).not.toHaveBeenCalled();
    });

    it("cancels the effect on player death and cannot activate while dying", () => {
        const enemy = spriteAt(new Grub(), 50, 0);
        wave.activate(player, 800);
        player.setState(CreatureState.DYING);
        wave.update(3000, player, [enemy]);
        expect(enemy.getState()).toBe(CreatureState.NORMAL);
        expect(wave.activate(player, 800)).toBe(false);
    });

    it("draws the aura translucently, then an expanding fading ring", () => {
        for (const name of [
            "push",
            "pop",
            "tint",
            "image",
            "noFill",
            "stroke",
            "strokeWeight",
            "ellipse",
        ]) {
            vi.stubGlobal(name, vi.fn());
        }
        const aura = { width: 100, height: 100 } as p5.Image;
        wave.activate(player, 800);
        wave.draw(player, aura, 10, 20);
        expect(tint).toHaveBeenCalledWith(255, 90);
        expect(image).toHaveBeenCalledWith(aura, -10, 0, 40, 40);
        wave.update(1000, player, []);
        wave.draw(player, aura, 10, 20);
        expect(ellipse).toHaveBeenCalledWith(10, 20, 400, 400);
        expect(stroke).toHaveBeenCalledWith(255, 215, 75, 127.5);
    });

    it("shows Q when ready and a dim icon with a corner 3, 2, 1 countdown", () => {
        for (const name of [
            "push",
            "pop",
            "noStroke",
            "fill",
            "rect",
            "tint",
            "image",
            "noTint",
            "textAlign",
            "textSize",
            "text",
        ]) {
            vi.stubGlobal(name, vi.fn());
        }
        vi.stubGlobal("CENTER", "center");
        const icon = {} as p5.Image;
        wave.drawHud(icon);
        expect(text).toHaveBeenLastCalledWith("Q", 71, 76);
        expect(tint).not.toHaveBeenCalled();
        wave.activate(player, 800);
        for (const label of ["3", "2", "1"]) {
            wave.drawHud(icon);
            expect(text).toHaveBeenLastCalledWith(label, 71, 76);
            wave.update(1000, player, []);
        }
        expect(tint).toHaveBeenCalledWith(105, 150);
        wave.drawHud(icon);
        expect(text).toHaveBeenLastCalledWith("Q", 71, 76);
    });
});

describe("Qi Wave input and sound integration", () => {
    afterEach(() => vi.unstubAllGlobals());

    function game() {
        const manager = Object.create(GameManager.prototype) as GameManager;
        const map = Object.create(GameMap.prototype) as GameMap;
        manager.map = map;
        map.player = spriteAt(new Player(), 0, 0);
        map.qiWave = new QiWave();
        const play = vi.fn();
        map.resources = { getLoad: vi.fn(() => ({ play })) } as unknown as ResourceManager;
        map.settings = { playEvents: true } as Settings;
        manager.moveLeft = new GameAction();
        manager.moveRight = new GameAction();
        manager.jump = new GameAction();
        manager.stop = new GameAction();
        manager.qiWave = new GameAction();
        manager.inputManager = new InputManager();
        manager.inputManager.setGameAction(manager.qiWave, 81);
        const input = (down: boolean) => {
            vi.stubGlobal("keyIsDown", (code: number) => down && code === 81);
            manager.inputManager.checkInput();
            manager.processActions();
        };
        return { manager, map, play, input };
    }

    it("Q activates once, ignores held/repeated Q during cooldown, and works after expiry", () => {
        const { map, play, input } = game();
        input(true);
        expect(map.qiWave.cooldownRemaining).toBe(3000);
        expect(play).toHaveBeenCalledTimes(1);
        input(true);
        input(false);
        input(true);
        expect(play).toHaveBeenCalledTimes(1);
        map.qiWave.update(3000, map.player, []);
        input(true);
        expect(play).toHaveBeenCalledTimes(1);
        input(false);
        input(true);
        expect(play).toHaveBeenCalledTimes(2);
    });

    it("respects the existing event sound toggle without disabling the ability", () => {
        const { map, play, input } = game();
        map.settings.playEvents = false;
        input(true);
        expect(map.qiWave.cooldownRemaining).toBe(3000);
        expect(play).not.toHaveBeenCalled();
    });
});
