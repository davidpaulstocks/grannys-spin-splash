/**
 * Who plays the set pieces. The lean-in, the fanfare, the closing chord, the
 * feedback accents and the results chimes are written once, in terms of
 * roles ("the crash", "the held chord", "the rising call"); each band's score
 * names the instruments that fill those roles, so a rock band's Frenzy lands
 * on a kit and a guitar where the orchestra's lands on timpani and trumpets.
 * A score that names nothing gets the orchestra's, which is what every
 * venue sounded like before bands had palettes.
 */

import type { Palette, PaletteRole, Score } from './score.types';

/** The orchestra's own choices — Garden's, and the default for any band that does not override a role. */
export const ORCHESTRAL_PALETTE: Palette = {
  roll: 'timpani_roll',
  swell: 'cymbal_swell',
  crash: 'cymbal_crash',
  shimmer: 'bell_tree',
  ting: 'triangle',
  boom: 'timpani',
  thump: 'bass_drum',
  bass: 'bass_pizz',
  sustain: 'horn_sus',
  pad: 'violin_sus',
  lead: 'trumpet_stac',
  pluck: 'harp',
  chime: 'glock',
  tap: 'xylo',
  knock: 'marimba',
};

/** A palette with its octave shifts and amp resolved: what the set pieces actually read. */
export interface ResolvedPalette {
  readonly instruments: Palette;
  readonly leadDrive: number;
  /** Semitones to add to a pitched role's written notes (0 when the score names none). */
  shift(role: PaletteRole): number;
}

/** Roles that must be filled by an unpitched instrument: they never ask for a note. `boom` is free either way. */
export const UNPITCHED_ROLES: readonly PaletteRole[] = [
  'roll',
  'swell',
  'crash',
  'shimmer',
  'ting',
  'thump',
];

/** Roles that must be filled by a pitched instrument. */
export const PITCHED_ROLES: readonly PaletteRole[] = [
  'bass',
  'sustain',
  'pad',
  'lead',
  'pluck',
  'chime',
  'tap',
  'knock',
];

/**
 * The lowest and highest note each pitched role can ask for, before the
 * palette's octave shift. The `boom` role is included for a pitched drum
 * (timpani, tuba); an unpitched one ignores it. Set-piece floors and chord
 * stacking (root to octave is up to 23 semitones above a floor) set these.
 */
export const ROLE_RANGES: Readonly<
  Record<string, { readonly low: number; readonly high: number }>
> = {
  boom: { low: 36, high: 47 },
  bass: { low: 31, high: 42 },
  sustain: { low: 48, high: 59 },
  pad: { low: 60, high: 83 },
  lead: { low: 60, high: 83 },
  pluck: { low: 43, high: 95 },
  chime: { low: 72, high: 102 },
  tap: { low: 72, high: 107 },
  knock: { low: 55, high: 73 },
};

/** Resolves a score's palette over the orchestral default. */
export function resolvePalette(score: Score): ResolvedPalette {
  const overrides = score.palette;
  const instruments: Palette = { ...ORCHESTRAL_PALETTE, ...overrides?.instruments };
  const shifts = overrides?.shifts ?? {};
  return {
    instruments,
    leadDrive: overrides?.leadDrive ?? 0,
    shift: (role) => shifts[role] ?? 0,
  };
}
