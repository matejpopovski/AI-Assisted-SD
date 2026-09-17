import { describe, it, expect, vi, afterEach } from "vitest";
import { world } from "./World.fixtures";
import { GameMap } from "../src/GameMap";

afterEach(() => vi.unstubAllGlobals());
type Platform = { left: number; right: number; row: number };
function platforms(map: GameMap): Platform[] {
    const result: Platform[] = [];
    for (let y = 0; y < map.height; y++) {
        for (let x = 1; x < map.width - 1; x++) {
            if (!map.tiles[x][y]) continue;
            const left = x;
            while (x + 1 < map.width - 1 && map.tiles[x + 1][y]) x++;
            result.push({ left, right: x, row: y });
        }
    }
    return result;
}
// Exercise the actual tile collision and Player physics, with normal speed and no powers.
// Several broad launch/double-jump timings must work, rather than one exact frame.
function canReach(map: GameMap, from: Platform, to: Platform, secondAt: number): boolean {
    const width = map.player.getImage().width;
    const points = (p: Platform) =>
        Array.from(
            { length: Math.floor(((p.right - p.left + 1) * 64 - width) / 32) + 1 },
            (_, i) => p.left * 64 + i * 32
        );
    for (const start of points(from))
        for (const target of points(to)) {
            const p = map.player;
            p.setPosition(start, from.row * 64 - p.getImage().height);
            p.setVelocity(0, 1);
            p.collideVertical();
            p.tryJump();
            for (let t = 0; t < 2400; t += 16) {
                if (t >= secondAt && t < secondAt + 16) p.tryJump();
                const below = p.getPosition().y + p.getImage().height > to.row * 64;
                const approach =
                    start + width / 2 < (to.left + to.right + 1) * 32
                        ? to.left * 64 - width - 8
                        : (to.right + 1) * 64 + 8;
                const aim = to.row < from.row && below ? approach : target;
                const dx = aim - p.getPosition().x;
                p.setVelocity(
                    Math.abs(dx) < 8 ? dx / 16 : Math.sign(dx) * p.getMaxSpeed(),
                    p.getVelocity().y
                );
                map.updateSprite(p);
                if (
                    p.onGround &&
                    Math.abs(p.getPosition().y + p.getImage().height - to.row * 64) < 1 &&
                    p.getPosition().x + width > to.left * 64 &&
                    p.getPosition().x < (to.right + 1) * 64
                )
                    return true;
                if (p.getPosition().y > from.row * 64 + 500) break;
            }
        }
    return false;
}
describe("map reachability with actual physics", () => {
    it("measures conservative single and double jump height", () => {
        const { map } = world();
        map.sprites = [];
        vi.stubGlobal("deltaTime", 16);
        const heights = [Infinity, 320].map((second) => {
            const p = map.player;
            p.setPosition(100, 1000);
            p.setVelocity(0, 1);
            p.collideVertical();
            p.tryJump();
            let min = 1000;
            for (let t = 0; t < 1300; t += 16) {
                if (t === second) p.tryJump();
                map.updateSprite(p);
                min = Math.min(min, p.getPosition().y);
            }
            return 1000 - min;
        });
        expect(heights[0]).toBeGreaterThan(210);
        expect(heights[0]).toBeLessThan(230);
        expect(heights[1]).toBeGreaterThan(400);
        expect(heights[1]).toBeLessThan(450);
    });
    it("Map 3 has a continuous, forgiving route from floor to summit", () => {
        const { map } = world(2, true);
        map.sprites = [];
        vi.stubGlobal("deltaTime", 16);
        const route = platforms(map).sort((a, b) => b.row - a.row);
        expect(route[0].row).toBe(63);
        expect(route[route.length - 1].row).toBe(9);
        for (let i = 1; i < route.length; i++) {
            for (const second of [240, 320, 400])
                expect(
                    canReach(map, route[i - 1], route[i], second),
                    `row ${route[i - 1].row} -> ${route[i].row}, second jump ${second}ms`
                ).toBe(true);
        }
    });
    it("rejects an upward transition beyond the reliable double-jump envelope", () => {
        const { map } = world(2, true);
        map.sprites = [];
        vi.stubGlobal("deltaTime", 16);
        expect(
            canReach(map, { left: 2, right: 5, row: 60 }, { left: 2, right: 5, row: 50 }, 320)
        ).toBe(false);
    });
    it("Map 1 catches falls within two staggered ledges and offers a route down", () => {
        const { map } = world(0, true);
        map.sprites = [];
        vi.stubGlobal("deltaTime", 16);
        const route = platforms(map).sort((a, b) => a.row - b.row);
        for (let i = 1; i < route.length; i++) {
            expect(route[i].row - route[i - 1].row).toBeLessThanOrEqual(5);
            for (let x = 1; x < map.width - 1; x++)
                expect(map.tiles[x][route[i].row] || map.tiles[x][route[i - 1].row]).toBeTruthy();
            expect(
                canReach(map, route[i - 1], route[i], Infinity),
                `descent ${route[i - 1].row} -> ${route[i].row}`
            ).toBe(true);
        }
    });
});
