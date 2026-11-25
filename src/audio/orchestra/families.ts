/**
 * The sections of the band. Every instrument belongs to one, and a spinner
 * shows its musician's section — by the colour of its blades and the badge
 * in its hub — so the wall reads the way a real band does: strings here,
 * brass there, the rhythm section underneath.
 *
 * This is the answer to "are they just random shapes that spin instruments
 * randomly?" (2026-11-25, David). The shapes stay the world's own; the
 * section is what ties a spinner to what you hear when you squirt it.
 */

import type { InstrumentId } from './score.types';

export type InstrumentFamily =
  | 'strings'
  | 'bass'
  | 'woodwind'
  | 'brass'
  | 'plucked'
  | 'keys'
  | 'percussion';

const FAMILY_BY_INSTRUMENT: Readonly<Partial<Record<InstrumentId, InstrumentFamily>>> = {
  violin_sus: 'strings',
  violin_spic: 'strings',
  violin_pizz: 'strings',
  viola_sus: 'strings',
  cello_sus: 'strings',
  cello_pizz: 'strings',
  bass_pizz: 'bass',
  jazz_bass: 'bass',
  flute_sus: 'woodwind',
  flute_stac: 'woodwind',
  clarinet_sus: 'woodwind',
  clarinet_stac: 'woodwind',
  oboe_sus: 'woodwind',
  bassoon_stac: 'woodwind',
  tenor_sus: 'woodwind',
  tenor_stac: 'woodwind',
  horn_sus: 'brass',
  trumpet_stac: 'brass',
  trumpet_mute: 'brass',
  trombone_stac: 'brass',
  trombone_sus: 'brass',
  tuba_stac: 'brass',
  harp: 'plucked',
  jazz_guitar: 'plucked',
  ebass: 'bass',
  ebass_stac: 'bass',
  epiano: 'keys',
  clav: 'keys',
  piano: 'keys',
  organ: 'keys',
  vibes: 'keys',
  marimba: 'keys',
  xylo: 'keys',
  glock: 'keys',
};

/** An instrument's section. Anything not listed above is hit or shaken: percussion. */
export function familyOf(instrument: InstrumentId): InstrumentFamily {
  return FAMILY_BY_INSTRUMENT[instrument] ?? 'percussion';
}
