/**
 * The picture a musician's spinner wears. Each icon is one painted instrument
 * (public/sprites/instruments/<icon>.webp, see INSTRUMENT_ART_BRIEF.md), shared
 * by every venue: a trumpet is the same trumpet in the Funfair and the Disco.
 * An instrument gets its own icon only if it would look different at 100 px,
 * so a viola borrows the violin and a piccolo borrows the flute.
 */

import { familyOf, type InstrumentFamily } from './families';
import type { InstrumentId, Part } from './score.types';

/** Every instrument picture, in the order the art sheets paint them. */
export const INSTRUMENT_ICON_IDS = [
  // Sheet 1 — strings
  'violin',
  'cello',
  'double_bass',
  'harp',
  'acoustic_guitar',
  'electric_guitar',
  // Sheet 2 — woodwind and first brass
  'flute',
  'clarinet',
  'bassoon',
  'saxophone',
  'trumpet',
  'trombone',
  // Sheet 3 — brass and keys
  'french_horn',
  'tuba',
  'euphonium',
  'piano',
  'organ',
  'electric_piano',
  // Sheet 4 — mallets and the rhythm section
  'glockenspiel',
  'marimba',
  'vibraphone',
  'bass_guitar',
  'drum_kit',
  'bass_drum',
  // Sheet 5 — drums and percussion
  'snare_drum',
  'cymbal',
  'tom_toms',
  'congas',
  'tambourine',
  'cowbell',
  // Sheet 6 — shakers, kitchen and the odd ones
  'maracas',
  'clappers',
  'whisk',
  'pots',
  'anvil',
  'mirror_ball',
] as const;

export type InstrumentIconId = (typeof INSTRUMENT_ICON_IDS)[number];

/** The icon for each recorded instrument, unless a seat says otherwise. */
const ICON_BY_INSTRUMENT: Readonly<Record<InstrumentId, InstrumentIconId>> = {
  // Orchestra
  bass_pizz: 'double_bass',
  cello_pizz: 'cello',
  cello_sus: 'cello',
  violin_pizz: 'violin',
  violin_spic: 'violin',
  violin_sus: 'violin',
  viola_sus: 'violin',
  harp: 'harp',
  flute_stac: 'flute',
  flute_sus: 'flute',
  clarinet_stac: 'clarinet',
  clarinet_sus: 'clarinet',
  oboe_sus: 'clarinet',
  bassoon_stac: 'bassoon',
  trumpet_stac: 'trumpet',
  trombone_stac: 'trombone',
  tuba_stac: 'tuba',
  horn_sus: 'french_horn',
  glock: 'glockenspiel',
  marimba: 'marimba',
  xylo: 'marimba',
  organ: 'organ',
  timpani: 'bass_drum',
  timpani_roll: 'bass_drum',
  bass_drum: 'bass_drum',
  snare: 'snare_drum',
  snare_roll: 'snare_drum',
  cymbal_crash: 'cymbal',
  cymbal_swell: 'cymbal',
  triangle: 'tambourine',
  tambourine: 'tambourine',
  shaker: 'maracas',
  claves: 'anvil',
  cowbell: 'cowbell',
  anvil: 'anvil',
  bell_tree: 'glockenspiel',
  sleighbells: 'tambourine',
  // Kitchen jazz combo
  jazz_bass: 'double_bass',
  piano: 'piano',
  vibes: 'vibraphone',
  tenor_sus: 'saxophone',
  tenor_stac: 'saxophone',
  trumpet_mute: 'trumpet',
  trombone_sus: 'trombone',
  jazz_guitar: 'electric_guitar',
  ride: 'cymbal',
  ride_bell: 'cymbal',
  brush_snare: 'snare_drum',
  brush_swirl: 'snare_drum',
  hat_chick: 'cymbal',
  kick_soft: 'bass_drum',
  sidestick: 'snare_drum',
  clap: 'clappers',
  // Rhythm section (Workshop, Disco)
  kick: 'bass_drum',
  snare_kit: 'snare_drum',
  rimshot: 'snare_drum',
  hat_closed: 'cymbal',
  hat_open: 'cymbal',
  crash: 'cymbal',
  tom_hi: 'tom_toms',
  tom_lo: 'tom_toms',
  conga: 'congas',
  ebass: 'bass_guitar',
  ebass_stac: 'bass_guitar',
  epiano: 'electric_piano',
  clav: 'electric_piano',
};

/** A sensible picture for a section, for an instrument the map above has not met. */
const ICON_BY_FAMILY: Readonly<Record<InstrumentFamily, InstrumentIconId>> = {
  strings: 'violin',
  bass: 'double_bass',
  woodwind: 'flute',
  brass: 'trumpet',
  plucked: 'harp',
  keys: 'piano',
  percussion: 'tambourine',
};

/**
 * The picture for a seat: the seat's own `icon` if the score names one, else
 * the default for its instrument, else its section's default.
 */
export function iconFor(part: Part): InstrumentIconId {
  return (
    part.icon ?? ICON_BY_INSTRUMENT[part.instrument] ?? ICON_BY_FAMILY[familyOf(part.instrument)]
  );
}
