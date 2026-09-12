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

/** Granny's on-screen size (CLAUDE.md §8.1 sprite art, wired Sprint 3). */
export const GRANNY_WIDTH = 96;
/**
 * How tall Granny stands, in logical px (her sprite is scaled to exactly
 * this — `Granny._fitToHeight`). 216 is 30% of the 720 canvas, above §5.8's
 * "~12% of vertical real estate", which was written before any art existed
 * and reads far too small once she is an illustrated character rather than
 * a placeholder rectangle (direct user feedback, 2026-09-12: "she just
 * looks really small").
 *
 * Raised 160 → 216 together with GRANNY_Y_FROM_BOTTOM below. The two
 * compound: at 160 tall sitting at y 624 her feet landed at 704, which is
 * 56px BELOW the water bar's top edge — a third of her was hidden behind
 * the HUD, so she only ever read as ~104px. Un-hiding her and scaling up
 * together roughly doubles her on-screen presence (104 → 216), which is
 * what the feedback was actually asking for.
 *
 * She is drawn in front of the spinner wall and will overlap its bottom row
 * in the centre column on some worlds. That matches the reference
 * prototype, where the same overlap exists, and she is narrow (~111px) on a
 * 1060px-wide wall and moves left/right, so she never parks over a target.
 */
export const GRANNY_HEIGHT = 216;
/** The prototype's 320 px/s, rescaled into this game's 4/3-larger canvas — see WATER_PARTICLE_SPEED. */
export const GRANNY_MOVE_SPEED = 427;
/**
 * Vertical gap between the bottom edge and Granny's centre. Chosen so her
 * FEET (centre + GRANNY_HEIGHT/2) land just above the water bar's top edge
 * rather than 56px behind it — see GRANNY_HEIGHT. 184 puts her feet at 644
 * against a bar top of 648.
 */
export const GRANNY_Y_FROM_BOTTOM = 184;
/** Idle breath cycle duration, ms — one full scale-up-and-back (CLAUDE.md §5.6: "scale 1.0 ↔ 1.02"). */
export const GRANNY_BREATH_CYCLE_MS = 2000;
export const GRANNY_BREATH_SCALE = 1.02;

/**
 * Gun's longest on-screen dimension, px — its 8 angle sprites all target
 * roughly this same apparent size. Scaled with GRANNY_HEIGHT (160 → 216) by
 * the same 1.35x so the gun stays in proportion to the hands holding it.
 */
export const GUN_LENGTH_PX = 148;

/**
 * Water particle arc physics — from the reference prototype's `_spawnWater`,
 * **rescaled into this game's larger coordinate space** (2026-09-12).
 *
 * The prototype runs on a 960x540 canvas; this game runs on 1280x720, which
 * is 4/3 larger in both axes (§3 rule 1). Its speed (650) and gravity (90)
 * were originally copied across verbatim, so water crossed a 33% wider wall
 * at the prototype's speed while every spinner decay rate stayed byte-for-byte
 * identical — silently making the whole game harder than the version that was
 * actually playtested, and measurably contributing to Splash Frenzy being
 * unreachable (see BACKLOG.md's balance note). A bot firing continuously for a
 * full round could hold only 4 of Garden's 12 spinners at FULL at once.
 *
 * Scaling both by 4/3 restores the prototype's *geometry*: for a trajectory to
 * stay the same shape when positions scale by k, velocity and acceleration
 * both scale by k, and flight duration is unchanged. Particle lifetime derives
 * from speed (`WaterParticle._lifeSeconds`), so it follows automatically.
 */
const PROTOTYPE_SCALE = 4 / 3;
export const WATER_PARTICLE_SPEED = Math.round(650 * PROTOTYPE_SCALE);
export const WATER_PARTICLE_GRAVITY = Math.round(90 * PROTOTYPE_SCALE);
export const WATER_PARTICLE_RADIUS = 5;
export const WATER_PARTICLE_MAX_POOL = 50;
/** Random horizontal wobble added to each shot's direction, in radians. */
export const WATER_PARTICLE_WOBBLE = 0.04;
/** Super Soaker power-up: horizontal shear on its two extra side streams (prototype: `wobbleExtra`, ±0.12). */
export const SOAKER_EXTRA_WOBBLE = 0.12;

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
 * Final-countdown urgency (restored 2026-09-12 from the prototype's own
 * `updateTimer` — direct user feedback that the game had lost the
 * "urgency building as the clock counts down" the prototype had). Below
 * this many seconds remaining: a pulsing red vignette, a scale-pulsing
 * red timer, a per-second tick sound + camera shake, and a big popping
 * countdown number. `TWENTY_SECOND_CALLOUT_AT` is a one-time "20 SECONDS!"
 * heads-up shown exactly once per round, matching the prototype's own
 * single early warning before the real urgency phase begins.
 */
export const URGENT_COUNTDOWN_SECONDS = 10;
export const TWENTY_SECOND_CALLOUT_AT = 20;
/** The final 3 seconds get the loudest tick + biggest shake + reddest number (prototype: `secs<=3`). */
export const FINAL_COUNTDOWN_SECONDS = 3;
export const COUNTDOWN_TICK_SHAKE_DURATION_MS = { normal: 150, final: 300 } as const;
export const COUNTDOWN_TICK_SHAKE_INTENSITY = { normal: 0.006, final: 0.012 } as const;

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
/**
 * 48 rather than 32 (2026-09-12): the tank was rebuilt as a live body of
 * water — sloshing meniscus, rising bubbles, a colour that warms as it
 * drains (see ui/WaterBar.ts) — and at 32px none of that detail survived
 * the scale down to Poki's 640x360 canonical size, where a logical px is
 * half a CSS px. Still inside §5.8's "8% bottom" HUD band (48/720 = 6.7%),
 * and still clear of Granny's feet at y 644.
 */
export const WATER_BAR_HEIGHT = 48;
export const WATER_BAR_Y = GAME_HEIGHT - WATER_BAR_HEIGHT - 24;
