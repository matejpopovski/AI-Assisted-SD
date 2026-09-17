import { Enemy } from "./Enemy.js";
import { ENEMIES_PER_WAVE, ENEMY_SPAWN_INTERVAL_MS, WAVE_COUNT } from "./Constants.js";

/**
 * Schedules Enemy spawns over time: ENEMIES_PER_WAVE enemies, one every
 * ENEMY_SPAWN_INTERVAL_MS, for WAVE_COUNT waves back to back. Game asks
 * update() every frame and gets a freshly-spawned Enemy back exactly on
 * the frames a spawn should happen, or null otherwise.
 */
export class WaveSpawner {
    private msSinceLastSpawn: number;
    private spawnedThisWave: number;
    private currentWave: number;

    constructor() {
        this.msSinceLastSpawn = 0;
        this.spawnedThisWave = 0;
        this.currentWave = 1;
    }

    update(deltaTime: number): Enemy | null {
        if (this.allWavesComplete()) {
            return null;
        }

        this.msSinceLastSpawn += deltaTime;
        if (this.msSinceLastSpawn < ENEMY_SPAWN_INTERVAL_MS) {
            return null;
        }

        this.msSinceLastSpawn = 0;
        this.spawnedThisWave += 1;
        if (this.spawnedThisWave >= ENEMIES_PER_WAVE) {
            this.spawnedThisWave = 0;
            this.currentWave += 1;
        }
        return new Enemy();
    }

    allWavesComplete(): boolean {
        return this.currentWave > WAVE_COUNT;
    }

    get waveNumber(): number {
        return Math.min(this.currentWave, WAVE_COUNT);
    }
}
