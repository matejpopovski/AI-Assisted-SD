import { describe, it, expect } from "vitest";
import { Path } from "../src/Path";

describe("Path", () => {
    it("throws if constructed with fewer than two waypoints", () => {
        expect(() => new Path([{ x: 0, y: 0 }])).toThrow();
    });

    it("computes totalLength as the sum of segment lengths", () => {
        const path = new Path([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
        ]);
        expect(path.totalLength).toBe(150);
    });

    it("pointAtDistance(0) returns the first waypoint", () => {
        const path = new Path([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]);
        expect(path.pointAtDistance(0)).toEqual({ x: 0, y: 0 });
    });

    it("pointAtDistance() interpolates partway along a segment", () => {
        const path = new Path([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]);
        expect(path.pointAtDistance(25)).toEqual({ x: 25, y: 0 });
    });

    it("pointAtDistance() crosses into the next segment correctly", () => {
        const path = new Path([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 40 },
        ]);
        expect(path.pointAtDistance(110)).toEqual({ x: 100, y: 10 });
    });

    it("pointAtDistance() clamps to the final waypoint past the end", () => {
        const path = new Path([
            { x: 0, y: 0 },
            { x: 100, y: 0 },
        ]);
        expect(path.pointAtDistance(500)).toEqual({ x: 100, y: 0 });
    });
});
