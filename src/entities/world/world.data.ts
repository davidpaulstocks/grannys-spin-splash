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

/**
 * Per-world spinner colour palette (2026-09-12, direct user feedback:
 * spinners "just look like generic shapes" — they need to feel specific
 * to each world). Types are shared/reused across worlds (Workshop and
 * Kitchen both use `cog`/`whirligig`/`fan`/`windmill`, for instance), so a
 * per-world recolour is what actually gives a spinner "this belongs in
 * Workshop, not Garden" identity without inventing a whole new geometric
 * shape per world × type combination. `GameScene._buildWall()` overrides
 * each spinner's `def.colors` with its world's set at construction time —
 * `spinnerRenderers.ts` itself is untouched, since `colourAt()` already
 * cycles through whatever colour array it's given. Garden keeps the
 * original prototype-extracted colours (already varied/bright) as the
 * baseline every other world's palette contrasts against. All hex values
 * come from CLAUDE.md §5.1's 8-colour palette — no new colours introduced.
 */
export const SPINNER_PALETTE_BY_WORLD: Readonly<Record<string, readonly string[]>> = {
  // Workshop: wood/metal/brass tones for a tool-shed feel.
  workshop: ['#AA6622', '#8899AA', '#6B6F8C', '#CC8844'],
  // Kitchen: pastel appliance tones — butter, mint, cherry, cream.
  kitchen: ['#FFC93C', '#7FD9A8', '#FF6BA8', '#F5F2E8'],
  // Funfair: bold carnival primaries.
  funfair: ['#FF6BA8', '#FFC93C', '#4DB3E5', '#7FD9A8'],
  // Disco: neon glam.
  disco: ['#FF6BA8', '#4DB3E5', '#FFC93C', '#6B6F8C'],
};

/** Golden Spinner respawn window in ms — shorter (more frequent) in `goldenFrequent` worlds. */
export const GOLDEN_SPAWN_DELAY_MS = {
  normal: { min: 25_000, max: 40_000 },
  frequent: { min: 12_000, max: 20_000 },
} as const;

/** How long a spawned Golden Spinner stays before it vanishes unclaimed. */
export const GOLDEN_LIFETIME_MS = 6000;
