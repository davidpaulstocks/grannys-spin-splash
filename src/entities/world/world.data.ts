/**
 * WORLD_DEFS — all 5 launch worlds (CLAUDE.md §1, §4; re-planned into v1
 * scope 2026-09-11, see BACKLOG.md — originally launch was Garden-only
 * with the other 4 as post-launch drops, but the whole prototype roster
 * ships together now). Round length is 30 s for every world per §4.
 *
 * Grid/types/obstacles/movingTargets/goldenFrequent are extracted
 * verbatim from the reference prototype's `WORLDS` table
 * (`game prototype/granny-spin-splash.html`) per CLAUDE.md §2's
 * extraction instructions. `unlockThreshold` values are new — the
 * prototype's own world picker was unlock-free (a flat menu, since it
 * existed to demo all 5 at once) but this game already has a Vault/star
 * economy driving granny + gun unlocks, so worlds unlock into that same
 * curve instead of introducing a second, inconsistent "everything free"
 * system. Ordered by the prototype's own escalating spinner count/
 * mechanic complexity (12 → 15 → 16 → 16 → 20 spinners; no obstacles →
 * obstacles → double obstacles → moving targets → golden fever), with
 * Workshop/Disco's costs matching the original C1/C2 post-launch plan
 * and Kitchen/Funfair filled in between.
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
    obstacles: [],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 0,
  },
  {
    id: 'workshop',
    name: 'Workshop',
    bg: 'world_workshop_bg',
    grid: { cols: 5, rows: 3 },
    types: ['cog', 'propeller', 'whirligig', 'disco', 'fan', 'windmill'],
    obstacles: ['cat', 'umbrella', 'umbrella', 'duck'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 500,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    bg: 'world_kitchen_bg',
    grid: { cols: 4, rows: 4 },
    types: ['whirligig', 'cog', 'windmill', 'fan'],
    obstacles: ['cat', 'cat', 'umbrella'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 1000,
  },
  {
    id: 'funfair',
    name: 'Funfair',
    bg: 'world_funfair_bg',
    grid: { cols: 4, rows: 4 },
    types: ['propeller', 'pinwheel', 'fan', 'windmill'],
    obstacles: ['umbrella', 'umbrella'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 1500,
    movingTargets: true,
  },
  {
    id: 'disco',
    name: 'Disco',
    bg: 'world_disco_bg',
    grid: { cols: 5, rows: 4 },
    types: ['disco', 'pinwheel', 'propeller', 'whirligig', 'fan'],
    obstacles: ['umbrella', 'duck'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 2000,
    goldenFrequent: true,
  },
];

export const DEFAULT_WORLD_ID = 'garden';

/** Golden Spinner respawn window in ms — shorter (more frequent) in `goldenFrequent` worlds. */
export const GOLDEN_SPAWN_DELAY_MS = {
  normal: { min: 25_000, max: 40_000 },
  frequent: { min: 12_000, max: 20_000 },
} as const;

/** How long a spawned Golden Spinner stays before it vanishes unclaimed. */
export const GOLDEN_LIFETIME_MS = 6000;
