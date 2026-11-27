/** Game-wide constants: logical canvas size + scale config. See CLAUDE.md §3 rule 1, §7.2. */

import Phaser from 'phaser';

import { COLOUR_HEX } from './utils/colour';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Never render more than this many canvas pixels per logical pixel: 4x the fill rate is the most a mid-range phone should be asked for. */
const MAX_RENDER_SCALE = 2;
/** Render scale is rounded to this step so a 1.37x display doesn't produce a 1753.6px canvas. */
const RENDER_SCALE_STEP = 0.25;

/**
 * Canvas pixels per logical pixel. The game is laid out at 1280x720, but a
 * canvas that size shown on a high-density screen — or simply shown larger
 * than 1280 CSS px — is stretched by the browser, and stretched text is
 * blurred text (2026-11-25, direct user feedback: "the fonts are quite hard
 * to read", with a screenshot of a button label smeared by the upscale).
 *
 * So the canvas is created at the size it will actually be shown at, in
 * device pixels, up to MAX_RENDER_SCALE, and every scene's camera zooms by
 * the same factor (`fitCameraToLogicalSize`). All layout stays in 1280x720
 * logical coordinates; only the number of pixels drawn changes. Measured
 * once at boot: a later resize just scales the canvas, as before.
 */
export const RENDER_SCALE = ((): number => {
  if (typeof window === 'undefined') return 1;
  // A tab opened in the background reports a 0x0 viewport until it is first
  // shown; the screen's own size is the safe stand-in (it can only over-
  // estimate, and the result is capped).
  const viewWidth = window.innerWidth || window.screen.width;
  const viewHeight = window.innerHeight || window.screen.height;
  const shownWidth = Math.min(viewWidth, (viewHeight * GAME_WIDTH) / GAME_HEIGHT);
  const needed = (shownWidth * (window.devicePixelRatio || 1)) / GAME_WIDTH;
  const stepped = Math.round(needed / RENDER_SCALE_STEP) * RENDER_SCALE_STEP;
  return Math.min(MAX_RENDER_SCALE, Math.max(1, stepped));
})();

export const SCALE_CONFIG: Phaser.Types.Core.ScaleConfig = {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: GAME_WIDTH * RENDER_SCALE,
  height: GAME_HEIGHT * RENDER_SCALE,
  parent: 'game',
};

/**
 * Points a scene's camera at the 1280x720 logical play area, at the render
 * scale. Centred, so camera zoom effects (the Frenzy punch) still zoom about
 * the middle of the screen. Applied to every scene from main.ts.
 */
export function fitCameraToLogicalSize(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;
  camera.setZoom(RENDER_SCALE);
  camera.setScroll(-(camera.width - GAME_WIDTH) / 2, -(camera.height - GAME_HEIGHT) / 2);
}

/** Cloud — CLAUDE.md §5.1 backgrounds. */
export const BACKGROUND_COLOUR: string = COLOUR_HEX.cloud;

/** Round length lives in data/worlds.ts (ROUND_LENGTH_SECONDS) — worlds own pacing, not config. */

/** Auto-aim snap radius in px, desktop (CLAUDE.md §6.4). Mobile scales this at call sites. */
export const AIM_SNAP_RADIUS = 96;

/**
 * Free aim with a soft snap (2026-11-27). Owner: "when you're aiming at the
 * spinny things, you kind of aim and they seem to just get stuck on one
 * predetermined point of each of the spinners rather than giving you free
 * aim, which makes it harder to hit the treats or hit the barriers, because
 * it's almost like your aim is semi-controlled." The day before he had said
 * aiming at the top row was "hard work", so the help stays but is local:
 * the water goes where the pointer is, and only inside an instrument's
 * capture radius does it snap to that instrument's centre (ring shown).
 * Capture radius = the larger of radius x AIM_CAPTURE_SCALE and
 * radius + AIM_CAPTURE_EXTRA px. Once snapped, it holds until the pointer is
 * AIM_MAGNET_MARGIN beyond the capture radius, so it does not flicker.
 * Kept only a little bigger than the instrument itself (they were 1.6 and 36,
 * which left no free band between two rows of large instruments, where
 * blockers park and treats fly).
 */
export const AIM_CAPTURE_SCALE = 1.2;
export const AIM_CAPTURE_EXTRA = 14;
export const AIM_MAGNET_MARGIN = 28;
/**
 * Mouse/trackpad reach assist: the aim point is the pointer pushed away from
 * a pivot at the wall's bottom-centre by this factor, so the top row is
 * reachable without the hand travelling the whole way. 1 turns it off. Touch
 * is always 1:1 (a finger must hit what it touches).
 */
export const AIM_REACH_GAIN = 1.3;
/** Extra px around a power-up pickup within which aim goes to the pickup instead of the magnet. */
export const AIM_PICKUP_MARGIN = 16;
/** How close a water particle must pass to collect a power-up pickup, px (mirrors PowerUp.ts). */
export const AIM_PICKUP_RADIUS = 22;
/** Targeting ring: gap outside the spinner's radius, stroke width, and scale-in time on a new target. */
export const AIM_RING_PADDING = 6;
export const AIM_RING_STROKE = 4;
export const AIM_RING_POP_MS = 100;
/** The ring starts this much larger than its final size when it lands on a new target. */
export const AIM_RING_POP_FROM = 1.4;
/** Reticle at the free aim point (mouse and touch; hidden while snapped): radius and stroke, px. */
export const AIM_RETICLE_RADIUS = 7;
export const AIM_RETICLE_STROKE = 3;

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
 * in the centre column on some worlds. That matches the reference prototype,
 * where the same overlap exists, and she is narrow (~111px) against a
 * 1060px-wide wall. Since she no longer walks, the overlap is fixed rather
 * than transient — worth a look if a bottom-centre spinner ever reads as
 * hard to see, though auto-aim snaps to it regardless.
 */
export const GRANNY_HEIGHT = 216;
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
 * Gun's longest on-screen dimension, px — its one picture (turned in code to
 * face the aim) targets roughly this size. Scaled with GRANNY_HEIGHT (160 → 216) by
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
/**
 * 2026-11-26: speed raised 1.6x (867 -> 1387 px/s). Owner: "The actual
 * gameplay of aiming isn't very fun. As you move your finger around on the
 * cursor it just doesn't feel very good. It's quite hard work to reach the
 * spinners at the top." The water took about half a second to reach the top
 * row, so it lagged the hand. Gravity is scaled by the square of the same
 * factor: droop is g*t^2/2 and flight time shrinks by 1.6, so this keeps the
 * same gentle sag as before rather than a dead-straight line.
 */
const WATER_SPEED_BOOST = 1.6;
export const WATER_PARTICLE_SPEED = Math.round(650 * PROTOTYPE_SCALE * WATER_SPEED_BOOST);
export const WATER_PARTICLE_GRAVITY = Math.round(
  90 * PROTOTYPE_SCALE * WATER_SPEED_BOOST * WATER_SPEED_BOOST,
);
export const WATER_PARTICLE_RADIUS = 5;
export const WATER_PARTICLE_MAX_POOL = 160;
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

/**
 * Water bar layout (CLAUDE.md §5.8's bottom-8% HUD strip) — lives here
 * rather than inside HUDScene.ts so Granny's standing position can be
 * derived against it (GRANNY_Y_FROM_BOTTOM keeps her feet clear of the bar).
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

/** Pivot of the mouse reach assist: bottom-centre of the spinner wall. */
export const AIM_REACH_PIVOT = {
  x: WALL_AREA.x + WALL_AREA.width / 2,
  y: WALL_AREA.y + WALL_AREA.height,
} as const;
