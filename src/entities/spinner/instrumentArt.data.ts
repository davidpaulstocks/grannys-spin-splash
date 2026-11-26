/**
 * Which instrument pictures have actually been painted and shipped. Only these
 * are loaded (BootScene) and only their spinners get the painted mount; every
 * other spinner keeps the drawn badge. To switch an icon on: run
 * `npm run instruments`, then add the ids it prints here.
 */

import type { InstrumentIconId } from '../../audio/orchestra/icons';

export const INSTRUMENT_ART_READY: readonly InstrumentIconId[] = [
  'acoustic_guitar',
  'cello',
  'double_bass',
  'electric_guitar',
  'harp',
  'violin',
];
