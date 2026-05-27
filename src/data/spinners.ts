/**
 * SPINNER_DEFS — the 8 spinner kinds (CLAUDE.md §1) and the state-machine
 * speed thresholds (§2). Gameplay numbers (decay/power/stars) are
 * placeholders that loosely scale with `r` and tuned in Sprint 2 story 2.8.
 *
 * Palette references CLAUDE.md §5.1 — colours stored as #RRGGBB strings so
 * data is portable; objects/Spinner.ts converts to Phaser 0x format.
 */

import { SpinnerState, type SpinnerDef } from '../types/spinner';

/** Speed thresholds that drive the STOPPED → SLOW → MEDIUM → FULL state transitions. */
export const SPINNER_STATE_THRESHOLDS: Readonly<Record<SpinnerState, number>> = {
  [SpinnerState.STOPPED]: 0,
  [SpinnerState.SLOW]: 40,
  [SpinnerState.MEDIUM]: 80,
  [SpinnerState.FULL]: 100,
};

/** Combo persistence window in milliseconds (CLAUDE.md §2). */
export const COMBO_WINDOW_MS = 2000;

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
    power: 10,
    stars: 1,
    r: 36,
    blades: 5,
    style: 'pinwheel',
    colors: ['#FF6BA8', '#FFC93C'],
  },
  {
    type: 'cog',
    decay: 10,
    power: 8,
    stars: 2,
    r: 40,
    blades: 8,
    style: 'cog',
    colors: ['#6B6F8C', '#1F2138'],
  },
  {
    type: 'fan',
    decay: 6,
    power: 12,
    stars: 1,
    r: 44,
    blades: 4,
    style: 'fan',
    colors: ['#4DB3E5', '#F5F2E8'],
  },
  {
    type: 'daisy',
    decay: 7,
    power: 9,
    stars: 2,
    r: 38,
    blades: 6,
    style: 'daisy',
    colors: ['#7FD9A8', '#FFC93C'],
  },
  {
    type: 'propeller',
    decay: 9,
    power: 11,
    stars: 2,
    r: 42,
    blades: 3,
    style: 'propeller',
    colors: ['#FF8A3D', '#1F2138'],
  },
  {
    type: 'wheel',
    decay: 11,
    power: 7,
    stars: 3,
    r: 48,
    blades: 10,
    style: 'wheel',
    colors: ['#4DB3E5', '#1F2138'],
  },
  {
    type: 'turbine',
    decay: 12,
    power: 9,
    stars: 3,
    r: 46,
    blades: 7,
    style: 'turbine',
    colors: ['#7FD9A8', '#4DB3E5'],
  },
  {
    type: 'gear',
    decay: 14,
    power: 6,
    stars: 5,
    r: 52,
    blades: 12,
    style: 'gear',
    colors: ['#FFC93C', '#FF8A3D'],
  },
];
