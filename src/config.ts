/** Game-wide constants: logical canvas size + scale config. See CLAUDE.md §3 rule 1, §7.2. */

import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const SCALE_CONFIG: Phaser.Types.Core.ScaleConfig = {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
};

export const BACKGROUND_COLOUR = '#F5F2E8';

/** Round length lives in data/worlds.ts (ROUND_LENGTH_SECONDS) — worlds own pacing, not config. */

/** Auto-aim snap radius in px, desktop (CLAUDE.md §6.4). Mobile scales this at call sites. */
export const AIM_SNAP_RADIUS = 96;

/** Granny placeholder rectangle (Sprint 1; replaced by sprites in Sprint 3, CLAUDE.md §8.1). */
export const GRANNY_WIDTH = 96;
export const GRANNY_HEIGHT = 160;
export const GRANNY_MOVE_SPEED = 360;
/** Vertical gap kept between the play-field edges and Granny's centre. */
export const GRANNY_Y_FROM_BOTTOM = 96;

/** Water particle arc physics — extracted from the reference prototype's `_spawnWater`. */
export const WATER_PARTICLE_SPEED = 650;
export const WATER_PARTICLE_GRAVITY = 90;
export const WATER_PARTICLE_RADIUS = 5;
export const WATER_PARTICLE_MAX_POOL = 50;
/** Random horizontal wobble added to each shot's direction, in radians. */
export const WATER_PARTICLE_WOBBLE = 0.04;

/** Default fire cadence in ms while no gun is selectable yet (Sprint 1; guns.ts picks per-gun from Sprint 5). */
export const DEFAULT_FIRE_INTERVAL_MS = 220;
/** Default hit power in ms while no gun is selectable yet — mirrors GUN_DEFS' `pistol` entry. */
export const DEFAULT_FIRE_POWER = 6;

/** How long the SPLASH FRENZY bonus window locks spinners at FULL, in ms (CLAUDE.md §2). */
export const FRENZY_DURATION_MS = 5000;
/** Bonus stars awarded the instant SPLASH FRENZY triggers (prototype `triggerFrenzy`). */
export const FRENZY_BONUS_STARS = 25;

/** How long the water-tank pump refill takes once it runs dry, in ms (CLAUDE.md §2 — "2-second pump refill"). */
export const PUMP_REFILL_MS = 2000;

/**
 * The spinner wall's play-field rectangle — spinners cover ~60% of the
 * visible area, Granny + HUD take the rest (CLAUDE.md §5.8). Sprint 2's
 * FrenzyMeterUI/HUDScene may recompute this more carefully; Sprint 1 just
 * needs a sensible fixed inset.
 */
export const WALL_AREA = {
  x: 96,
  y: 96,
  width: GAME_WIDTH - 192,
  height: GAME_HEIGHT * 0.56,
} as const;

/** Horizontal margin kept between Granny's edges and the canvas edges while moving. */
export const GRANNY_X_MARGIN = 48;
