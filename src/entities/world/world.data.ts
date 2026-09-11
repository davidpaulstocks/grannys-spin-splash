/**
 * WORLD_DEFS — single launch world: Garden (CLAUDE.md §1, §4). Workshop,
 * Disco, Funfair, Kitchen are post-launch content drops (C1–C2, P3).
 * Round length is 30 s per §4.
 *
 * Grid (4×3, 12 spinners) and the pinwheel/fan/windmill type roster are
 * extracted verbatim from the reference prototype's `WORLDS.GARDEN` entry
 * (`game prototype/granny-spin-splash.html`) — its easiest, most-playtested
 * layout. Widening variety to the full 8-kind roster is a Sprint 2 story
 * 2.8 pacing option, not a correctness fix.
 *
 * Obstacles: the prototype only places cat/umbrella/duck in later worlds
 * (Workshop onward) since it had 5 worlds to ramp difficulty across. V1
 * has exactly one world, so CLAUDE.md §1's "3 obstacles" launch feature is
 * deliberately folded into Garden here rather than cut.
 */

import type { WorldDef } from './world.types';

export const ROUND_LENGTH_SECONDS = 30;

export const WORLD_DEFS: readonly WorldDef[] = [
  {
    id: 'garden',
    name: 'Garden',
    bg: 'world_garden_bg',
    grid: { cols: 4, rows: 3 },
    types: ['pinwheel', 'fan', 'windmill'],
    obstacles: ['cat', 'umbrella', 'duck'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 0,
  },
];

export const DEFAULT_WORLD_ID = 'garden';
