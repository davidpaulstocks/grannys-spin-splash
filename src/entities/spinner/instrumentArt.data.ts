/**
 * Which instrument pictures have actually been painted and shipped. Only these
 * are loaded (BootScene) and only their spinners get the painted mount; every
 * other spinner keeps the drawn badge. To switch an icon on: run
 * `npm run instruments`, then add the ids it prints here.
 */

import type { InstrumentIconId } from '../../audio/orchestra/icons';

export const INSTRUMENT_ART_READY: readonly InstrumentIconId[] = [
  'acoustic_guitar',
  'anvil',
  'bass_drum',
  'bass_guitar',
  'bassoon',
  'cello',
  'clappers',
  'clarinet',
  'congas',
  'cowbell',
  'cymbal',
  'double_bass',
  'drum_kit',
  'electric_guitar',
  'electric_piano',
  'euphonium',
  'flute',
  'french_horn',
  'glockenspiel',
  'harp',
  'maracas',
  'marimba',
  'mirror_ball',
  'organ',
  'piano',
  'pots',
  'saxophone',
  'snare_drum',
  'tambourine',
  'tom_toms',
  'trombone',
  'trumpet',
  'tuba',
  'vibraphone',
  'violin',
  'whisk',
];
