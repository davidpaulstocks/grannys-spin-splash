/**
 * SPINNER_DEFS — the 8 spinner kinds (CLAUDE.md §1) and the state-machine
 * speed thresholds (§2). Gameplay numbers (decay/power/stars/r/blades/
 * colors) are extracted verbatim from the reference prototype's `ST` table
 * (`game prototype/granny-spin-splash.html`, playtested and tuned) per
 * CLAUDE.md §2's extraction instructions — this replaces the Sprint 0
 * placeholder values (0.6 was completed before the prototype file was
 * available in this repo).
 *
 * Palette references CLAUDE.md §5.1 loosely — the prototype's own colours
 * are kept here for physics/behavioural fidelity; Sprint 2 story 2.7/2.8
 * may re-skin to the production hero palette without touching the numbers.
 */

import type { SpinnerDef } from './spinner.types';

/**
 * Speed breakpoints for the STOPPED → SLOW → MEDIUM → FULL state machine,
 * extracted from the prototype's exact comparisons: `speed <= 0` STOPPED,
 * `< 40` SLOW, `< 80` MEDIUM, else FULL. So 40 is MEDIUM's entry point and
 * 80 is FULL's — SLOW has no breakpoint of its own, it's just "> 0".
 * (Sprint 0's placeholder data mislabelled these as SLOW:40/MEDIUM:80/
 * FULL:100, shifted one state off from the real prototype — fixed here
 * since it directly controls how fast Frenzy arrives.)
 */
export const SPINNER_STATE_THRESHOLDS = {
  medium: 40,
  full: 80,
} as const;

/** Speed is clamped to this ceiling on every hit. */
export const MAX_SPINNER_SPEED = 100;

/** Combo persistence window in milliseconds (CLAUDE.md §2; prototype `comboTimer = 2.0`). */
export const COMBO_WINDOW_MS = 2000;

/** Combo multiplier ceiling (prototype `Math.min(combo+1, 5)`). */
export const MAX_COMBO = 5;

/** Mini-frenzy + full-frenzy thresholds expressed as proportion of spinners at FULL (§2, §9.1). */
export const FRENZY_THRESHOLDS = {
  miniLow: 0.6,
  miniHigh: 0.8,
  full: 1.0,
} as const;

export const SPINNER_DEFS: readonly SpinnerDef[] = [
  {
    type: 'pinwheel',
    decay: 8,
    power: 28,
    stars: 1,
    r: 40,
    blades: 4,
    style: 'pinwheel',
    colors: ['#FF4455', '#4499FF', '#44DD66', '#FFCC00'],
  },
  {
    type: 'fan',
    decay: 15,
    power: 32,
    stars: 1,
    r: 36,
    blades: 5,
    style: 'fan',
    colors: ['#CCDDEE', '#AABBCC', '#BBCCDD', '#99AABB', '#DDEEFF'],
  },
  {
    type: 'windmill',
    decay: 4,
    power: 20,
    stars: 2,
    r: 44,
    blades: 4,
    style: 'windmill',
    colors: ['#CC8844', '#AA6622', '#DD9955', '#BB7733'],
  },
  {
    type: 'cog',
    decay: 5,
    power: 15,
    stars: 2,
    r: 34,
    blades: 0,
    style: 'cog',
    colors: ['#CC8833', '#AA6611', '#EEAA44', '#BB7722'],
  },
  {
    type: 'propeller',
    decay: 3,
    power: 12,
    stars: 3,
    r: 50,
    blades: 3,
    style: 'propeller',
    colors: ['#8899AA', '#99AABB', '#778899', '#BBCCDD'],
  },
  {
    type: 'whirligig',
    decay: 6,
    power: 22,
    stars: 3,
    r: 40,
    blades: 6,
    style: 'whirligig',
    colors: ['#FF4444', '#FF8844', '#FFCC44', '#44FF88', '#4488FF', '#FF44FF'],
    deflects: true,
  },
  {
    type: 'disco',
    decay: 2,
    power: 18,
    stars: 5,
    r: 38,
    blades: 0,
    style: 'disco',
    colors: ['#DDDDDD', '#EEEEEE', '#CCCCCC', '#AAAAAA'],
  },
  {
    type: 'golden',
    decay: 18,
    power: 50,
    stars: 10,
    r: 28,
    blades: 4,
    style: 'golden',
    colors: ['#FFDD00', '#FFAA00', '#FFEE44', '#FFCC00'],
    isGolden: true,
  },
];
