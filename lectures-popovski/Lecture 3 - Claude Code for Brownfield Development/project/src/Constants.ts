/**
 * Every tunable balance number lives here so playtesting is a one-line
 * change instead of a hunt through the codebase.
 *
 * NOTE for the Lecture 3 merge-conflict exercise: ENEMY_SPAWN_INTERVAL_MS
 * is the line two practice branches will both edit.
 */

// Economy
export const STARTING_GOLD = 100;
export const TOWER_COST = 20;
export const ENEMY_REWARD = 5;

// Player
export const STARTING_LIVES = 10;

// Waves
export const ENEMY_SPAWN_INTERVAL_MS = 925;
export const ENEMIES_PER_WAVE = 8;
export const WAVE_COUNT = 3;

// Enemy
export const ENEMY_SPEED = 60; // pixels per second, along the path
export const ENEMY_HEALTH = 30;

// Tower
export const TOWER_RANGE = 120;
export const TOWER_DAMAGE = 15;
export const TOWER_FIRE_INTERVAL_MS = 400;

// Projectile
export const PROJECTILE_SPEED = 240; // pixels per second
export const PROJECTILE_HIT_RADIUS = 6;
