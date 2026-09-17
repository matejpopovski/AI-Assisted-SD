export interface Waypoint {
    x: number;
    y: number;
}

/**
 * The fixed route Enemies walk from spawn to the player's base. A Path is
 * just an ordered list of waypoints; Enemies don't store x/y directly —
 * they store how far along the Path they've traveled, and ask the Path to
 * convert that distance into a position each frame. That keeps "how far
 * has this enemy gotten" (a single number, easy to reason about and test)
 * separate from "where is that on screen" (geometry).
 */
export class Path {
    private readonly waypoints: Waypoint[];
    private readonly segmentLengths: number[];
    readonly totalLength: number;

    constructor(waypoints: Waypoint[]) {
        if (waypoints.length < 2) {
            throw new Error("Path needs at least two waypoints");
        }
        this.waypoints = waypoints;
        this.segmentLengths = [];
        let total = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            const length = distanceBetween(waypoints[i], waypoints[i + 1]);
            this.segmentLengths.push(length);
            total += length;
        }
        this.totalLength = total;
    }

    /**
     * The point `distance` pixels along the path from its start. Clamped
     * to the final waypoint once `distance` reaches or exceeds
     * `totalLength` — callers use that to detect "reached the end".
     */
    pointAtDistance(distance: number): Waypoint {
        if (distance <= 0) {
            return this.waypoints[0];
        }
        let remaining = distance;
        for (let i = 0; i < this.segmentLengths.length; i++) {
            const segmentLength = this.segmentLengths[i];
            if (remaining <= segmentLength) {
                const t = segmentLength === 0 ? 0 : remaining / segmentLength;
                return lerpPoint(this.waypoints[i], this.waypoints[i + 1], t);
            }
            remaining -= segmentLength;
        }
        return this.waypoints[this.waypoints.length - 1];
    }

    get allWaypoints(): readonly Waypoint[] {
        return this.waypoints;
    }
}

function distanceBetween(a: Waypoint, b: Waypoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function lerpPoint(a: Waypoint, b: Waypoint, t: number): Waypoint {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    };
}
