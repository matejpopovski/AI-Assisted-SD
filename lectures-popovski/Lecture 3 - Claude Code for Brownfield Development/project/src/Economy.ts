import { STARTING_GOLD } from "./Constants.js";

/**
 * Tracks the player's gold. Deliberately the only thing in the codebase
 * that touches the gold count directly — Game asks Economy to spend or
 * earn rather than mutating a number itself, so "can I afford this" and
 * "how much gold do I have" only need to be gotten right in one place.
 */
export class Economy {
    private gold: number;

    constructor(startingGold: number = STARTING_GOLD) {
        this.gold = startingGold;
    }

    get balance(): number {
        return this.gold;
    }

    canAfford(cost: number): boolean {
        return this.gold >= cost;
    }

    /** Throws if the purchase can't be afforded — callers must check canAfford() first. */
    spend(cost: number) {
        if (!this.canAfford(cost)) {
            throw new Error(`Cannot spend ${cost} gold with only ${this.gold} available`);
        }
        this.gold -= cost;
    }

    earn(amount: number) {
        this.gold += amount;
    }
}
