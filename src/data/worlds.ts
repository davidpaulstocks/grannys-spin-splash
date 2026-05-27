/**
 * WORLD_DEFS — single launch world: Garden (CLAUDE.md §1, §4). Workshop,
 * Disco, Funfair, Kitchen are post-launch content drops (C1–C2, P3).
 * Round length is 30 s per §4.
 */

import type { WorldDef } from '../types/world';

export const ROUND_LENGTH_SECONDS = 30;

export const WORLD_DEFS: readonly WorldDef[] = [
  {
    id: 'garden',
    name: 'Garden',
    bg: 'world_garden_bg',
    grid: { cols: 6, rows: 4 },
    types: ['pinwheel', 'fan', 'daisy', 'propeller', 'cog', 'wheel', 'turbine', 'gear'],
    obstacles: ['cat', 'umbrella', 'duck'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 0,
  },
];

export const DEFAULT_WORLD_ID = 'garden';
