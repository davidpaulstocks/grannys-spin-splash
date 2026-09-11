/** Game-wide constants: logical canvas size + scale config. See CLAUDE.md §3 rule 1, §7.2. */

import Phaser from 'phaser';

import { COLOUR_HEX } from './utils/colour';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const SCALE_CONFIG: Phaser.Types.Core.ScaleConfig = {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
};

/** Cloud — CLAUDE.md §5.1 backgrounds. */
export const BACKGROUND_COLOUR: string = COLOUR_HEX.cloud;

/** Round length lives in data/worlds.ts (ROUND_LENGTH_SECONDS) — worlds own pacing, not config. */

/** Auto-aim snap radius in px, desktop (CLAUDE.md §6.4). Mobile scales this at call sites. */
export const AIM_SNAP_RADIUS = 96;

/** Granny placeholder rectangle (Sprint 1; replaced by sprites in Sprint 3, CLAUDE.md §8.1). */
export const GRANNY_WIDTH = 96;
export const GRANNY_HEIGHT = 160;
export const GRANNY_MOVE_SPEED = 360;
/** Vertical gap kept between the play-field edges and Granny's centre. */
export const GRANNY_Y_FROM_BOTTOM = 96;
/** Idle breath cycle duration, ms — one full scale-up-and-back (CLAUDE.md §5.6: "scale 1.0 ↔ 1.02"). */
export const GRANNY_BREATH_CYCLE_MS = 2000;
export const GRANNY_BREATH_SCALE = 1.02;

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
/** Camera shake on Frenzy trigger — duration ms + intensity (prototype: `shake(500, 0.012)`). */
export const FRENZY_SHAKE_DURATION_MS = 500;
export const FRENZY_SHAKE_INTENSITY = 0.012;
/** Screen-flash on Frenzy trigger, ms — fades from full white to transparent. */
export const FRENZY_FLASH_DURATION_MS = 400;

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

/**
 * Water bar layout (CLAUDE.md §5.8's bottom-8% HUD strip) — lives here,
 * not inside HUDScene.ts, because GameScene also needs WATER_BAR_Y to
 * position the mid-run refill prompt (story 6.3) directly above it.
 */
export const WATER_BAR_MARGIN_X = 96;
export const WATER_BAR_HEIGHT = 32;
export const WATER_BAR_Y = GAME_HEIGHT - WATER_BAR_HEIGHT - 24;
