/**
 * The decisions behind the note fountain, kept free of Phaser so they can be
 * tested: what each section throws, how many of a spinner's notes get a
 * visual at each speed, and which visual gives way when the screen is full.
 */

import type { InstrumentFamily } from '../../audio/orchestra/families';
import { SpinnerState } from '../../entities/spinner/spinner.types';

/** The drawn note shapes (textures are made once, see ui/noteShapes.ts). */
export type NoteShape = 'crotchet' | 'quaver' | 'semiquaver' | 'pair' | 'clef';

/** How a section's visuals move. */
export type SectionMotion =
  | 'ribbon'
  | 'burst'
  | 'spiral'
  | 'drift'
  | 'stairs'
  | 'sparkle'
  | 'impact';

export interface SectionStyle {
  readonly motion: SectionMotion;
  /** Shapes the section cycles through; empty for percussion, which throws no notes. */
  readonly shapes: readonly NoteShape[];
  /** Size multiplier on top of the note's velocity. */
  readonly scale: number;
  readonly lifeMs: number;
}

/** What each section's notes look like and how they travel. */
export const SECTION_STYLE: Readonly<Record<InstrumentFamily, SectionStyle>> = {
  strings: { motion: 'ribbon', shapes: ['quaver', 'crotchet'], scale: 1, lifeMs: 1000 },
  brass: { motion: 'burst', shapes: ['crotchet', 'quaver'], scale: 1.25, lifeMs: 750 },
  woodwind: { motion: 'spiral', shapes: ['semiquaver', 'quaver'], scale: 0.8, lifeMs: 1100 },
  bass: { motion: 'drift', shapes: ['crotchet'], scale: 1.5, lifeMs: 1100 },
  keys: { motion: 'stairs', shapes: ['pair'], scale: 1, lifeMs: 900 },
  plucked: { motion: 'sparkle', shapes: ['quaver', 'semiquaver'], scale: 0.95, lifeMs: 800 },
  percussion: { motion: 'impact', shapes: [], scale: 1, lifeMs: 600 },
};

/** The most visuals alive at once. */
export const MAX_LIVE_VISUALS = 70;
/** Above this fraction of the cap, slow and medium spinners stop adding. */
export const NEAR_CAP_FRACTION = 0.8;
/** Chance that a note from an instrument at full speed is a treble clef. */
export const CLEF_CHANCE = 0.06;
/** Chance of a bonus flourish (a few sparks) on a note at full speed. */
export const FLOURISH_CHANCE = 0.18;
/** At most one squirt burst per instrument this often. */
export const SQUIRT_BURST_GAP_MS = 250;
/** Notes at or above this height only: nothing may cover the HUD band. */
export const HUD_BAND_Y = 110;
/** Visuals fade out over this many pixels above the HUD band's edge. */
export const HUD_FADE_PX = 40;

/** Whether a section throws notes at all (percussion strikes instead). */
export function throwsNotes(style: SectionStyle): boolean {
  return style.shapes.length > 0;
}

/**
 * Whether the spinner's `count`-th note gets a visual. Slow: one in three.
 * Medium: three in four. Full: every note. Close to the cap, slow and medium
 * thin further so full-speed instruments keep their visuals.
 */
export function shouldSpawn(
  state: SpinnerState,
  count: number,
  live: number,
  cap: number = MAX_LIVE_VISUALS,
): boolean {
  const nearCap = live >= cap * NEAR_CAP_FRACTION;
  switch (state) {
    case SpinnerState.FULL:
      return true;
    case SpinnerState.MEDIUM:
      return nearCap ? count % 2 === 0 : count % 4 !== 3;
    case SpinnerState.SLOW:
      return !nearCap && count % 3 === 0;
    default:
      return false;
  }
}

/** Which shape the `count`-th note takes; a rare treble clef from an instrument at full speed. */
export function pickShape(
  style: SectionStyle,
  state: SpinnerState,
  count: number,
  roll: number,
): NoteShape {
  if (state === SpinnerState.FULL && roll < CLEF_CHANCE) return 'clef';
  return style.shapes[count % style.shapes.length] ?? 'crotchet';
}

/** Note size from how hard it was played, times the section's size. */
export function noteScale(velocity: number, style: SectionStyle): number {
  const v = Math.min(1, Math.max(0, velocity));
  return (0.7 + 0.45 * v) * style.scale;
}

/** How much a visual from a spinner in this state matters when the screen is full. */
export function priorityFor(state: SpinnerState, squirt: boolean): number {
  if (squirt) return 3;
  if (state === SpinnerState.FULL) return 3;
  return state === SpinnerState.MEDIUM ? 2 : 1;
}

/** 0..1 — how visible something at `y` may be, so nothing sits over the HUD band. */
export function hudFade(y: number): number {
  return Math.min(1, Math.max(0, (y - HUD_BAND_Y) / HUD_FADE_PX));
}

/** What the cap says about one more visual. */
export interface CapDecision {
  readonly admit: boolean;
  /** Index into the live list to drop first, or -1 when there is room. */
  readonly evict: number;
}

export interface LiveVisual {
  readonly priority: number;
  readonly size: number;
  /** Milliseconds alive. */
  readonly age: number;
}

/**
 * At the cap, the lowest-priority, then smallest, then oldest visual makes
 * way — unless everything alive matters more than the newcomer, which is
 * then dropped instead.
 */
export function decideCap(
  live: readonly LiveVisual[],
  incomingPriority: number,
  cap: number = MAX_LIVE_VISUALS,
): CapDecision {
  if (live.length < cap) return { admit: true, evict: -1 };
  let victim = 0;
  for (let i = 1; i < live.length; i++) {
    const a = live[i];
    const b = live[victim];
    if (!a || !b) continue;
    if (
      a.priority < b.priority ||
      (a.priority === b.priority && (a.size < b.size || (a.size === b.size && a.age > b.age)))
    ) {
      victim = i;
    }
  }
  const worst = live[victim];
  if (!worst || worst.priority > incomingPriority) return { admit: false, evict: -1 };
  return { admit: true, evict: victim };
}
