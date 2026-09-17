import { describe, it, expect, beforeEach } from "vitest";
import { Dash, DASH_SPEED, DASH_DURATION, DASH_COOLDOWN } from "../src/Dash";
import { Player } from "../src/sprites/Player";
import { CreatureState } from "../src/sprites/Creature";

describe("Dash", () => {
    let dash: Dash;
    let player: Player;

    beforeEach(() => {
        dash = new Dash();
        player = new Player();
    });

    it("prevents reactivation while on cooldown", () => {
        expect(dash.activate(player, 1)).toBe(true);
        expect(dash.activate(player, 1)).toBe(false);
        expect(dash.activate(player, -1)).toBe(false);
    });

    it("drives velocity at DASH_SPEED with vertical velocity pinned to 0 for DASH_DURATION", () => {
        dash.activate(player, 1);
        player.setVelocity(0, 0.4); // simulate falling
        dash.update(DASH_DURATION - 1, player);
        expect(dash.isActive).toBe(true);
        expect(player.getVelocity().x).toBe(DASH_SPEED);
        expect(player.getVelocity().y).toBe(0);
        // One more millisecond crosses the duration boundary and ends the dash.
        dash.update(1, player);
        expect(dash.isActive).toBe(false);
    });

    it("locks in the requested direction: right is positive, left is negative", () => {
        dash.activate(player, 1);
        dash.update(16, player);
        expect(player.getVelocity().x).toBe(DASH_SPEED);

        const other = new Player();
        const leftDash = new Dash();
        leftDash.activate(other, -1);
        leftDash.update(16, other);
        expect(other.getVelocity().x).toBe(-DASH_SPEED);
    });

    it("cancels immediately if the player leaves CreatureState.NORMAL mid-dash", () => {
        dash.activate(player, 1);
        dash.update(50, player);
        expect(dash.isActive).toBe(true);
        player.setState(CreatureState.DYING);
        dash.update(16, player);
        expect(dash.isActive).toBe(false);
    });

    it("counts the cooldown down independently of whether the dash is still active", () => {
        dash.activate(player, 1);
        expect(dash.cooldownRemaining).toBe(DASH_COOLDOWN);
        dash.update(DASH_DURATION + 200, player); // dash ends partway through this tick
        expect(dash.isActive).toBe(false);
        expect(dash.cooldownRemaining).toBe(DASH_COOLDOWN - (DASH_DURATION + 200));
        dash.update(DASH_COOLDOWN, player);
        expect(dash.cooldownRemaining).toBe(0);
    });

    it("refuses to activate while the player is not NORMAL, even with cooldown at 0", () => {
        player.setState(CreatureState.DYING);
        expect(dash.activate(player, 1)).toBe(false);
        expect(dash.isActive).toBe(false);
    });
});
