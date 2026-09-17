import { describe, it, expect } from "vitest";
import { WaveSpawner } from "../src/WaveSpawner";
import { ENEMIES_PER_WAVE, ENEMY_SPAWN_INTERVAL_MS, WAVE_COUNT } from "../src/Constants";
import { Enemy } from "../src/Enemy";

describe("WaveSpawner", () => {
    it("does not spawn before ENEMY_SPAWN_INTERVAL_MS has elapsed", () => {
        const spawner = new WaveSpawner();
        expect(spawner.update(ENEMY_SPAWN_INTERVAL_MS - 1)).toBeNull();
    });

    it("spawns an Enemy once ENEMY_SPAWN_INTERVAL_MS has elapsed", () => {
        const spawner = new WaveSpawner();
        expect(spawner.update(ENEMY_SPAWN_INTERVAL_MS)).toBeInstanceOf(Enemy);
    });

    it("starts on wave 1", () => {
        const spawner = new WaveSpawner();
        expect(spawner.waveNumber).toBe(1);
    });

    it("advances to wave 2 after ENEMIES_PER_WAVE spawns", () => {
        const spawner = new WaveSpawner();
        for (let i = 0; i < ENEMIES_PER_WAVE; i++) {
            spawner.update(ENEMY_SPAWN_INTERVAL_MS);
        }
        expect(spawner.waveNumber).toBe(2);
    });

    it("allWavesComplete() is true only after every wave has finished spawning", () => {
        const spawner = new WaveSpawner();
        const totalSpawns = ENEMIES_PER_WAVE * WAVE_COUNT;
        for (let i = 0; i < totalSpawns - 1; i++) {
            spawner.update(ENEMY_SPAWN_INTERVAL_MS);
        }
        expect(spawner.allWavesComplete()).toBe(false);

        spawner.update(ENEMY_SPAWN_INTERVAL_MS); // final spawn of the final wave
        expect(spawner.allWavesComplete()).toBe(true);
    });

    it("stops spawning once all waves are complete", () => {
        const spawner = new WaveSpawner();
        const totalSpawns = ENEMIES_PER_WAVE * WAVE_COUNT;
        for (let i = 0; i < totalSpawns; i++) {
            spawner.update(ENEMY_SPAWN_INTERVAL_MS);
        }
        expect(spawner.update(ENEMY_SPAWN_INTERVAL_MS)).toBeNull();
    });
});
