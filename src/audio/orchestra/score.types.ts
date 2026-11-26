/**
 * The shape of a world's score. A score is a short piece of real music —
 * key, tempo, an eight-bar chord progression — and one written part per
 * musician. Each spinner on the wall is seated at one part (CLAUDE.md §9):
 * waking the spinner brings that musician in, and a full wall is the full
 * arrangement.
 */

import type { InstrumentIconId } from './icons';
import type { Mode } from './theory';

/**
 * Every instrument the game can play. The orchestra's live in the core
 * sprite (tools/bands/orchestra.manifest.json), which every venue may use;
 * each other band adds its own (tools/bands/<band>.manifest.json).
 */
export type InstrumentId = OrchestraInstrumentId | KitchenInstrumentId | KitInstrumentId;

/** The rhythm section shared by the rock and disco bands — tools/bands/kit.manifest.json. */
export type KitInstrumentId =
  | 'kick'
  | 'snare_kit'
  | 'rimshot'
  | 'hat_closed'
  | 'hat_open'
  | 'crash'
  | 'tom_hi'
  | 'tom_lo'
  | 'conga'
  | 'ebass'
  | 'ebass_stac'
  | 'epiano'
  | 'clav';

/** The Kitchen's jazz combo — tools/bands/kitchen.manifest.json. */
export type KitchenInstrumentId =
  | 'jazz_bass'
  | 'piano'
  | 'vibes'
  | 'tenor_sus'
  | 'tenor_stac'
  | 'trumpet_mute'
  | 'trombone_sus'
  | 'jazz_guitar'
  | 'ride'
  | 'ride_bell'
  | 'brush_snare'
  | 'brush_swirl'
  | 'hat_chick'
  | 'kick_soft'
  | 'sidestick'
  | 'clap';

export type OrchestraInstrumentId =
  | 'bass_pizz'
  | 'cello_pizz'
  | 'violin_pizz'
  | 'violin_spic'
  | 'harp'
  | 'flute_stac'
  | 'clarinet_stac'
  | 'bassoon_stac'
  | 'trumpet_stac'
  | 'trombone_stac'
  | 'tuba_stac'
  | 'glock'
  | 'marimba'
  | 'xylo'
  | 'timpani'
  | 'cello_sus'
  | 'viola_sus'
  | 'violin_sus'
  | 'flute_sus'
  | 'clarinet_sus'
  | 'oboe_sus'
  | 'horn_sus'
  | 'organ'
  | 'bass_drum'
  | 'snare'
  | 'snare_roll'
  | 'timpani_roll'
  | 'cymbal_crash'
  | 'cymbal_swell'
  | 'triangle'
  | 'tambourine'
  | 'shaker'
  | 'claves'
  | 'cowbell'
  | 'anvil'
  | 'bell_tree'
  | 'sleighbells';

/** One line of notation per bar; lengths of 1, 2, 4 or 8 bars loop against the eight-bar form. */
export type Bars = readonly string[];

export interface Line {
  readonly instrument: InstrumentId;
  /** Lowest MIDI note the line's chord tones and tonic are placed at or above. */
  readonly floor: number;
  /** Mix level, 0–1, before the spinner's own charge is applied. */
  readonly level: number;
  /** Notes are held for their written length (bowed/blown) rather than left to ring (plucked/struck). */
  readonly sustain?: boolean;
  readonly bars: Bars;
}

export interface Part extends Line {
  /** Stable id, unique within the score. */
  readonly id: string;
  /** Shown to the player the first time this musician joins: "Flute", "Harp". */
  readonly name: string;
  /** The painted instrument on this seat's spinner, where the default for its instrument would be wrong. */
  readonly icon?: InstrumentIconId;
  /** What a barely-spinning musician plays. Defaults to the beat-only outline of `bars`. */
  readonly light?: Bars;
  /** Lines that always sound alongside the full part — a percussionist's second instrument. */
  readonly with?: readonly Line[];
  /** An extra line that joins only at full speed — an octave doubling, a harmony, a flourish. */
  readonly ornament?: Line;
  /**
   * Struck parts only: a different instrument to answer a squirt with — a
   * drum kit answering on its snare. A held part always answers in its own
   * voice, so this is ignored for one.
   */
  readonly spray?: InstrumentId;
  /** Struck parts only: where squirt notes are pitched, if not at `floor`. Lets a bass answer an octave up. */
  readonly sprayFloor?: number;
  /** 0–1: how hard this musician is driven through a guitar amp. Omit for a clean sound. */
  readonly drive?: number;
}

export const BARS_PER_FORM = 8;

export interface Score {
  readonly id: string;
  readonly bpm: number;
  /** Tonic note name, e.g. `G` or `Bb`. */
  readonly tonic: string;
  readonly mode: Mode;
  /** Eight chord symbols, one per bar. Write `"C D"` to change chord on beat three. */
  readonly chords: readonly string[];
  /** Fraction of a beat by which every off-beat eighth is delayed. 0 is straight, 1/6 is triplet swing. */
  readonly swing: number;
  /** Always playing, very quietly: the harmonic floor that makes any one musician sound like music. */
  readonly bed: readonly Line[];
  /** Every musician in the band, grouped by section for readability. */
  readonly seats: readonly Part[];
  /**
   * Seat ids in the order musicians join the band as gigs grow
   * (docs/ENGAGEMENT_DESIGN.md §3). A gig with a band of five seats the
   * first five. The first three must already sound like music: a bass, a
   * harmony instrument and a tune.
   */
  readonly lineup: readonly string[];
  /** Joins for the final third of the round, whatever the wall looks like. */
  readonly finale: readonly Line[];
  /** Joins for the Splash Frenzy window. */
  readonly frenzy: readonly Line[];
}
