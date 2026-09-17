import { describe, it, expect, vi, afterEach } from "vitest";
import { cameraY, visibleRows } from "../src/Camera";
import { computeParallaxX } from "../src/GameMap";
import { Player } from "../src/sprites/Player";
import { CreatureState, Grub } from "../src/sprites/Creature";
import {
    Star,
    Silver,
    Gold,
    Heart,
    Trophy,
    WingedBoots,
    GoldenShield,
    Arrival,
} from "../src/sprites/PowerUp";
import { Haaaa, beamHits } from "../src/sprites/Haaaa";
import { QiWave } from "../src/QiWave";
import { GameManager, STATE } from "../src/GameManager";
import { InputManager } from "../src/InputManager";
import { Settings } from "../src/Settings";
import { animated, world } from "./World.fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("vertical camera", () => {
    it.each([
        [100, 4096, 0],
        [1500, 4096, -1200],
        [4096, 4096, -3496],
        [50, 320, 140],
        [352, 704, -52],
    ])("follows/clamps/centers (%s,%s)", (y, h, want) => expect(cameraY(y, h)).toBe(want));
    it("culls to visible rows", () => {
        expect(visibleRows(-1280, 64)).toEqual([20, 29]);
        expect(visibleRows(140, 5)).toEqual([0, 4]);
    });
    it("keeps vertically offscreen enemies asleep and visible ones active", () => {
        const { map } = world(0, true);
        const e = animated(new Grub());
        e.setPosition(map.player.getPosition().x, 3500);
        map.sprites = [e];
        map.update();
        expect(Math.abs(e.getVelocity().x)).toBe(0);
        e.setPosition(map.player.getPosition().x + 150, map.player.getPosition().y);
        map.update();
        expect(e.getVelocity().x).not.toBe(0);
    });
    it("resets the current map if the player falls far below it", () => {
        const { map } = world(1);
        map.score = 200;
        const old = map.player;
        old.collectShield();
        old.setPosition(100, 2000);
        map.update();
        expect(map.player).not.toBe(old);
        expect(map.level).toBe(1);
        expect(map.score).toBe(200);
        expect(map.player.shieldRemaining).toBe(0);
    });
    it("regression: smaller backgrounds travel more slowly and align at right edge", () => {
        expect(Math.abs(computeParallaxX(-1000, 800, 4288, 1600))).toBeLessThan(
            Math.abs(computeParallaxX(-1000, 800, 4288, 3200))
        );
        expect(computeParallaxX(-3488, 800, 4288, 3200)).toBe(-2400);
    });
});

describe("double jump and explicit power-ups", () => {
    it("permits exactly two press-triggered jumps and resets on landing", () => {
        const p = animated(new Player());
        p.onGround = true;
        expect(p.tryJump()).toBe("ground");
        expect(p.tryJump()).toBe("air");
        expect(p.tryJump()).toBe("none");
        p.setVelocity(0, 1);
        p.collideVertical();
        expect(p.tryJump()).toBe("ground");
        expect(p.tryJump()).toBe("air");
    });
    it("boots refresh without stacking, expire, and leave jump impulse/Qi Wave unchanged", () => {
        const p = animated(new Player());
        const wave = new QiWave();
        p.collectBoots();
        expect(p.getMaxSpeed()).toBe(0.75);
        p.update(5000);
        p.collectBoots();
        expect(p.bootsRemaining).toBe(10000);
        expect(p.getMaxSpeed()).toBe(0.75);
        p.onGround = true;
        p.tryJump();
        expect(p.getVelocity().y).toBe(-0.95);
        expect(wave.activate(p, 800)).toBe(true);
        expect(wave.cooldownRemaining).toBe(3000);
        p.update(10000);
        expect(p.getMaxSpeed()).toBe(0.5);
    });
    it("shield refreshes and expires without altering jump or movement", () => {
        const p = animated(new Player());
        p.collectShield();
        p.update(9999);
        p.collectShield();
        expect(p.shieldRemaining).toBe(10000);
        expect(p.getMaxSpeed()).toBe(0.5);
        p.onGround = true;
        expect(p.tryJump()).toBe("ground");
        p.update(10000);
        expect(p.shieldRemaining).toBe(0);
    });
    it("dead players cannot jump", () => {
        const p = animated(new Player());
        p.setState(CreatureState.DYING);
        expect(p.tryJump()).toBe("none");
    });
    it("new map players regain jumps and lose timed powers", () => {
        const { map } = world();
        map.player.tryJump();
        map.player.collectBoots();
        map.initialize();
        map.player.onGround = true;
        expect(map.player.tryJump()).toBe("ground");
        expect(map.player.tryJump()).toBe("air");
        expect(map.player.bootsRemaining).toBe(0);
    });
});

describe("pickups, portals and persistent score", () => {
    it.each([
        [Star, 100],
        [Silver, 200],
        [Gold, 300],
    ] as const)("awards the correct value exactly once", (Type, value) => {
        const { map } = world();
        const item = animated(new Type());
        map.sprites.push(item);
        map.acquirePowerUp(item);
        map.acquirePowerUp(item);
        expect(map.score).toBe(value);
        expect(map.sprites).not.toContain(item);
    });
    it.each([0, 1])("portal advances level %s once after its beam effect", (level) => {
        const { map } = world(level);
        map.score = 600;
        map.player.collectBoots();
        const exit = animated(new Heart());
        map.sprites.push(exit);
        map.acquirePowerUp(exit);
        map.acquirePowerUp(exit);
        expect(map.level).toBe(level);
        vi.stubGlobal("deltaTime", 600);
        map.update();
        expect(map.level).toBe(level + 1);
        expect(map.score).toBe(600);
        expect(map.player.bootsRemaining).toBe(0);
        expect(map.player.tryJump()).toBe("air");
    });
    it("decorative arrival portal has no collision/progression", () => {
        const { map } = world();
        const portal = animated(new Arrival());
        portal.setPosition(map.player.getPosition().x, map.player.getPosition().y);
        map.sprites = [portal];
        map.checkPlayerCollision(map.player, false);
        expect(map.level).toBe(0);
        expect(map.transitionRemaining).toBe(0);
        expect(map.sprites).toContain(portal);
    });
    it("boots and shield are pickups, not collectible score", () => {
        const { map } = world();
        const a = animated(new WingedBoots()),
            b = animated(new GoldenShield());
        map.sprites = [a, b];
        map.acquirePowerUp(a);
        map.acquirePowerUp(b);
        expect(map.player.bootsRemaining).toBe(10000);
        expect(map.player.shieldRemaining).toBe(10000);
        expect(map.score).toBe(0);
    });
    it("shield blocks lethal contact but not pickups or a stomp", () => {
        const { map } = world();
        map.player.collectShield();
        const enemy = animated(new Grub());
        enemy.setPosition(map.player.getPosition().x, map.player.getPosition().y);
        map.sprites = [enemy];
        map.checkPlayerCollision(map.player, false);
        expect(map.player.getState()).toBe(CreatureState.NORMAL);
        map.checkPlayerCollision(map.player, true);
        expect(enemy.getState()).toBe(CreatureState.DYING);
        const star = animated(new Star());
        map.sprites.push(star);
        map.acquirePowerUp(star);
        expect(map.score).toBe(100);
    });
    it("Trophy finishes without advancing or looping", () => {
        const { map } = world(2);
        const t = animated(new Trophy());
        map.sprites.push(t);
        map.acquirePowerUp(t);
        const old = map.player;
        map.update();
        expect(map.finished).toBe(true);
        expect(map.level).toBe(2);
        expect(map.player).toBe(old);
    });
});

describe("HAAAA", () => {
    function fight() {
        const boss = animated(new Haaaa(), 160, 128),
            p = animated(new Player(), 80);
        boss.active = true;
        boss.setPosition(300, 100);
        boss.arenaRight = 1000;
        p.setPosition(100, 160);
        return { boss, p };
    }
    it("three distinct valid hits cause death", () => {
        const { boss, p } = fight();
        expect(boss.hp).toBe(3);
        expect(boss.damage()).toBe(true);
        boss.updateCombat(300, p);
        boss.damage();
        boss.updateCombat(300, p);
        boss.damage();
        expect(boss.hp).toBe(0);
        expect(boss.getState()).toBe(CreatureState.DYING);
        boss.update(1001);
        expect(boss.getState()).toBe(CreatureState.DEAD);
    });
    it("one wave activation damages the boss once", () => {
        const { boss, p } = fight();
        p.setPosition(250, 100);
        const wave = new QiWave();
        wave.activate(p, 800);
        wave.update(700, p, [boss]);
        expect(boss.hp).toBe(2);
        boss.updateCombat(300, p);
        wave.update(100, p, [boss]);
        expect(boss.hp).toBe(2);
    });
    it("a valid stomp deals one damage and bounces the player", () => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        boss.setPosition(map.player.getPosition().x, map.player.getPosition().y);
        map.sprites = [boss];
        map.checkPlayerCollision(map.player, true);
        expect(boss.hp).toBe(2);
        expect(map.player.getVelocity().y).toBe(-0.95);
    });
    it("telegraphs without damage, locks aim, fires for 0.5s and waits five seconds between starts", () => {
        const { boss, p } = fight();
        boss.updateCombat(5000, p);
        expect(boss.laserPhase).toBe("warning");
        const aim = [boss.beamEndX, boss.beamEndY];
        p.setPosition(850, 20);
        expect(boss.updateCombat(999, p).laser).toBe(false);
        expect([boss.beamEndX, boss.beamEndY]).toEqual(aim);
        p.setPosition(100, 160);
        expect(boss.updateCombat(1, p).laser).toBe(true);
        expect(boss.laserPhase).toBe("firing");
        boss.updateCombat(500, p);
        expect(boss.laserPhase).toBe("idle");
        boss.updateCombat(3499, p);
        expect(boss.laserPhase).toBe("idle");
        boss.updateCombat(1, p);
        expect(boss.laserPhase).toBe("warning");
    });
    it("melee uses range and a 1.5 second cooldown", () => {
        const { boss, p } = fight();
        p.setPosition(220, 150);
        expect(boss.updateCombat(1, p).melee).toBe(true);
        expect(boss.updateCombat(100, p).melee).toBe(false);
        expect(boss.updateCombat(1400, p).melee).toBe(true);
        p.setPosition(900, 600);
        expect(boss.updateCombat(1500, p).melee).toBe(false);
    });
    it("movement stays inside its arena and freezes while telegraphing", () => {
        const { boss, p } = fight();
        boss.arenaLeft = 300;
        boss.arenaRight = 500;
        boss.updateCombat(1000, p);
        expect(boss.getPosition().x).toBeGreaterThanOrEqual(300);
        boss.updateCombat(4000, p);
        const x = boss.getPosition().x;
        boss.updateCombat(500, p);
        expect(boss.getPosition().x).toBe(x);
    });
    it("beam misses a player outside its locked path", () => {
        const { p } = fight();
        p.setPosition(0, 300);
        expect(beamHits(0, 0, 1000, 0, p)).toBe(false);
    });
    it.each([false, true])("boss body contact respects shield=%s", (shield) => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        boss.setPosition(map.player.getPosition().x, map.player.getPosition().y);
        map.sprites = [boss];
        if (shield) map.player.collectShield();
        map.checkPlayerCollision(map.player, false);
        expect(map.player.getState()).toBe(shield ? CreatureState.NORMAL : CreatureState.DYING);
    });
    it("spawns exactly one trophy at the boss location after death", () => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        boss.setPosition(500, 100);
        boss.setState(CreatureState.DEAD);
        map.sprites = [boss];
        map.boss = boss;
        map.update();
        map.update();
        const trophies = map.sprites.filter((s) => s instanceof Trophy);
        expect(trophies).toHaveLength(1);
        expect(trophies[0].getPosition().x).toBe(548);
        expect(map.sprites).not.toContain(boss);
    });
});

describe("Finished, Replay, menu and music", () => {
    function manager() {
        const { map, resources, settings } = world(2);
        const g = Object.create(GameManager.prototype) as GameManager;
        Object.assign(g, {
            map,
            resources,
            settings,
            inputManager: new InputManager(),
            gameState: STATE.Running,
            oldState: STATE.Running,
        });
        return g;
    }
    it("enters Finished and stops normal input and updates", () => {
        const g = manager();
        g.map.finished = true;
        g.update();
        expect(g.gameState).toBe(STATE.Finished);
        const update = vi.spyOn(g.map, "update");
        g.update();
        expect(update).not.toHaveBeenCalled();
    });
    it("Y resets all progression and score", () => {
        const g = manager();
        g.map.score = 900;
        g.map.finished = true;
        g.gameState = STATE.Finished;
        g.handleKey("Y");
        expect(g.map.level).toBe(0);
        expect(g.map.score).toBe(0);
        expect(g.map.finished).toBe(false);
        expect(g.map.player.shieldRemaining).toBe(0);
        expect(g.gameState).toBe(STATE.Running);
    });
    it("U returns to menu without silently replaying", () => {
        const g = manager();
        g.gameState = STATE.Finished;
        g.map.finished = true;
        g.handleKey("u");
        expect(g.gameState).toBe(STATE.Menu);
        expect(g.map.level).toBe(2);
        g.handleKey("m");
        expect(g.gameState).toBe(STATE.Finished);
    });
    it("I toggles instructions and Up Arrow does nothing", () => {
        const g = manager();
        g.instructionsVisible = false;
        g.handleKey("i");
        expect(g.instructionsVisible).toBe(true);
        g.handleKey("i");
        expect(g.instructionsVisible).toBe(false);
        expect(() => g.handleKey("ArrowUp")).not.toThrow();
    });
    it("switches enabled music and retains mute preference", () => {
        const s = Object.create(Settings.prototype) as Settings;
        const old = { stop: vi.fn() },
            next = { stop: vi.fn(), play: vi.fn(), setLoop: vi.fn(), playMode: vi.fn() };
        s.music = old as unknown as p5.SoundFile;
        s.playMusic = true;
        s.setMusic(next as unknown as p5.SoundFile);
        expect(old.stop).toHaveBeenCalledOnce();
        expect(next.play).toHaveBeenCalledOnce();
        s.setMusic(next as unknown as p5.SoundFile);
        expect(next.play).toHaveBeenCalledOnce();
        s.playMusic = false;
        const third = { ...next, play: vi.fn() };
        s.setMusic(third as unknown as p5.SoundFile);
        expect(third.play).not.toHaveBeenCalled();
    });
});

describe("cross-system interactions", () => {
    it.each([false, true])("boss melee respects shield=%s", (shield) => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        map.sprites = [boss];
        boss.active = true;
        boss.setPosition(400, 192);
        map.player.setPosition(240, 256);
        if (shield) map.player.collectShield();
        map.update();
        expect(map.player.getState()).toBe(shield ? CreatureState.NORMAL : CreatureState.DYING);
        expect(map.player.blockFlash > 0).toBe(shield);
    });
    it.each([false, true])("boss locked laser respects shield=%s", (shield) => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        boss.setPosition(700, 192);
        boss.active = true;
        map.sprites = [boss];
        map.player.setPosition(100, 256);
        if (shield) map.player.collectShield();
        boss.updateCombat(5000, map.player);
        boss.updateCombat(1000, map.player);
        map.update();
        expect(map.player.getState()).toBe(shield ? CreatureState.NORMAL : CreatureState.DYING);
    });
    it("shield permits airborne Qi Wave without changing its cooldown", () => {
        const { map } = world();
        map.player.collectShield();
        map.player.tryJump();
        map.activateQiWave();
        expect(map.qiWave.cooldownRemaining).toBe(3000);
        expect(map.player.getVelocity().y).toBe(-map.player.JUMP_SPEED);
    });
    it("draws entities and Qi Wave using the same actual vertical camera", () => {
        const { map } = world(2, true);
        map.sprites = [];
        for (const name of [
            "image",
            "push",
            "pop",
            "noStroke",
            "noFill",
            "fill",
            "ellipse",
            "line",
            "stroke",
            "strokeWeight",
        ])
            vi.stubGlobal(name, vi.fn());
        const waveDraw = vi.spyOn(map.qiWave, "draw").mockImplementation(() => {});
        map.draw();
        const p = map.player.getPosition(),
            c = map.camera();
        expect(image).toHaveBeenCalledWith(
            map.player.getImage(),
            Math.trunc(p.x + c.x),
            Math.trunc(p.y + c.y)
        );
        expect(c.y).toBeLessThan(-3000);
        expect(waveDraw).toHaveBeenCalledWith(map.player, expect.anything(), c.x, c.y);
    });
    it("keeps the boss and eventual trophy above the actual summit platform", () => {
        const { map } = world(2, true);
        const boss = map.boss;
        expect(map.sprites.some((s) => s instanceof Trophy)).toBe(false);
        boss.active = true;
        map.player.setPosition(100, 3500);
        for (let i = 0; i < 400; i++) boss.updateCombat(16, map.player);
        const footRow = Math.round((boss.getPosition().y + boss.getImage().height) / 64);
        for (let x = Math.floor(boss.arenaLeft / 64); x < boss.arenaRight / 64; x++)
            expect(map.tiles[x][footRow]).toBeTruthy();
    });
});

describe("physical world boundaries", () => {
    it("does not count a text file's terminal newline as an extra world row", () => {
        expect(world(0, true).map.height).toBe(64);
        expect(world(2, true).map.height).toBe(64);
    });
    it("descending side contact with the boss is not a stomp", () => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        boss.setPosition(300, 128);
        map.sprites = [boss];
        map.player.setPosition(230, 180);
        map.player.setVelocity(0.5, 0.1);
        map.updateSprite(map.player);
        expect(boss.hp).toBe(3);
        expect(map.player.getState()).toBe(CreatureState.DYING);
    });
    it("crossing the boss's top while falling is a stomp", () => {
        const { map } = world(2);
        const boss = animated(new Haaaa(), 160, 128);
        boss.setPosition(300, 128);
        map.sprites = [boss];
        map.player.setPosition(320, 60);
        map.player.setVelocity(0, 0.5);
        boss.active = true;
        map.update();
        expect(boss.hp).toBe(2);
        expect(map.player.getState()).toBe(CreatureState.NORMAL);
        expect(map.player.getVelocity().y).toBeLessThan(0);
    });
});
