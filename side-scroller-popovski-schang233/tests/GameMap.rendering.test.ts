import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { world } from "./World.fixtures";

describe("background rendering", () => {
    beforeEach(() => {
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
    });
    afterEach(() => vi.unstubAllGlobals());

    it.each([18, 96])(
        "keeps differently sized layers at distinct speeds on a %s-tile map",
        (width) => {
            const { map } = world(1);
            map.width = width;
            map.tiles = Array.from({ length: width }, () => []);
            const far = { width: 1600, height: 600 } as p5.Image;
            const near = { width: 3200, height: 600 } as p5.Image;
            map.background = [far, near];
            const rightEdge = width * 64 - 800;
            const camera = vi.spyOn(map, "camera").mockReturnValue({ x: 0, y: -300 });
            const draw = (offset: number) => {
                camera.mockReturnValue({ x: offset, y: -300 });
                vi.mocked(image).mockClear();
                map.draw();
                return vi
                    .mocked(image)
                    .mock.calls.filter((args) => args[0] === far || args[0] === near);
            };

            // Both layers begin at their left edge and stay screen-fixed vertically.
            expect(draw(0)).toEqual([
                [far, 0, 0, 800, 600, expect.closeTo(0), 0, 800, 600],
                [near, 0, 0, 800, 600, expect.closeTo(0), 0, 800, 600],
            ]);
            // At half the camera travel the farther layer has moved 400px, the nearer 1200px.
            // These are actual source windows passed to p5, not calls to the formula alone.
            expect(draw(-rightEdge / 2)).toEqual([
                [far, 0, 0, 800, 600, 400, 0, 800, 600],
                [near, 0, 0, 800, 600, 1200, 0, 800, 600],
            ]);
            expect(draw(-rightEdge)).toEqual([
                [far, 0, 0, 800, 600, 800, 0, 800, 600],
                [near, 0, 0, 800, 600, 2400, 0, 800, 600],
            ]);
        }
    );

    it.each([8, 12])(
        "keeps the fitted background stationary on a %s-tile map narrower than the viewport",
        (width) => {
            const { map } = world(1);
            map.width = width;
            vi.spyOn(map, "camera").mockReturnValue({ x: 0, y: 100 });
            const bg = { width: 1600, height: 600 } as p5.Image;
            map.background = [bg];
            map.draw();
            expect(image).toHaveBeenCalledWith(bg, 0, 0, 800, 600, expect.closeTo(0), 0, 1600, 600);
        }
    );
});
