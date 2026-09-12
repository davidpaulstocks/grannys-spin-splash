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
    // The fence panel itself, between the framing posts and above the grass.
    wallArea: { x: 110, y: 130, width: 1060, height: 360 },
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
    // The pegboard — tools already hang here, so spinners read as hung too.
    wallArea: { x: 265, y: 130, width: 800, height: 320 },
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
    // Lower shelf + tiled backsplash, clear of the pink side walls and counter.
    wallArea: { x: 165, y: 120, width: 950, height: 390 },
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
    // Tent canvas between the poles, above the sawdust floor.
    wallArea: { x: 120, y: 190, width: 1040, height: 350 },
  },
  {
    id: 'disco',
    name: 'Disco',
    bg: 'world_disco_bg',
    grid: { cols: 5, rows: 4 },
    types: ['disco', 'pinwheel', 'propeller', 'whirligig', 'fan'],
    // The big mirror ball hanging in the middle of the backdrop. Centre and
    // radius were measured off disco_bg.jpg itself (brightest low-saturation
    // blob: centre px 810,131 r~94) and converted through the background's
    // own cover-fit scale of 0.8063, so the spinner sits exactly on the
    // painted ball. It hangs above the wall grid, which is what makes it
    // read as the room's centrepiece rather than another wall target.
    featureSpinner: { type: 'disco', x: 648, y: 106, r: 75 },
    obstacles: ['umbrella', 'duck'],
    time: ROUND_LENGTH_SECONDS,
    unlockThreshold: 2000,
    goldenFrequent: true,
    // Back wall in the light pools — below the mirror ball, above the dance floor.
    wallArea: { x: 165, y: 165, width: 950, height: 370 },
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

/**
 * Bespoke per-world shape swaps — pushing past a colour-only reskin
 * (2026-09-12, direct user feedback: "push harder into more bespoke
 * spinner objects... entertaining original objects from each world").
 * Keyed `worldId -> mechanicalType -> bespoke SpinnerStyle`: only the
 * *visual* dispatch changes (spinnerRenderers.ts's `drawSpinner` switches
 * on `style`), the mechanical `type`/`decay`/`power`/`blades`/`deflects`
 * stay exactly as SPINNER_DEFS defines them — a Workshop whirligig drawn
 * as a `sawblade` still deflects 38% of hits like every other whirligig.
 * A type/world combination not listed here just keeps its default shared
 * shape (e.g. Garden's pinwheel/fan/windmill are left as the baseline).
 */
export const WORLD_STYLE_OVERRIDE: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  // A flower head instead of a grey extractor-fan blade.
  garden: { fan: 'daisy' },
  // A stand-mixer whisk and a citrus slice instead of generic blades.
  kitchen: { fan: 'whisk', whirligig: 'citrus' },
  // A toothed circular-saw blade instead of whirligig's rounded blades.
  workshop: { whirligig: 'sawblade' },
  // A striped candy-cane spiral instead of a propeller blade.
  funfair: { propeller: 'candyswirl' },
  // A spinning 7" vinyl instead of a child's pinwheel.
  disco: { pinwheel: 'record' },
};

/**
 * Narrower than SPINNER_PALETTE_BY_WORLD: recolours a *single* type within
 * a world, layered on top of (and winning over) the world palette. Needed
 * because the bespoke shapes above want colours their world's general
 * palette doesn't carry — Garden's daisy wants petal colours while Garden's
 * windmill should stay weathered wood, Disco's record label wants neon
 * while its mirror ball stays silver.
 */
export const WORLD_TYPE_PALETTE: Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
> = {
  garden: { fan: ['#FF6BA8', '#FFC93C', '#F5F2E8', '#FF8A3D', '#7FD9A8'] },
  // Brushed-steel whisk wires with a blue handle collar — cream would
  // disappear straight into the kitchen's own pale backsplash.
  kitchen: {
    fan: ['#B9C4D4', '#8899AA', '#CDD6E2', '#4DB3E5', '#A3AFC1'],
    // Rind, then two alternating flesh tones.
    whirligig: ['#FFC93C', '#FF8A3D', '#F5F2E8'],
  },
  disco: { pinwheel: ['#FF6BA8', '#4DB3E5', '#FFC93C', '#7FD9A8'] },
};

/** Disco spinners get a glitter overlay on top of whatever shape they already draw (SpinnerDef.sparkle). */
export const SPARKLE_WORLDS: ReadonlySet<string> = new Set(['disco']);

/** Funfair spinners mount on shooting-gallery target boards (SpinnerDef.mount) — see that field for why. */
export const MOUNT_BY_WORLD: Readonly<Record<string, 'target'>> = {
  funfair: 'target',
};

/**
 * Per-world easter egg — a rare surprise reaction when a spinner levels
 * up (2026-09-12, direct user feedback: "wow factor and unexpected
 * creativity per world"). Deliberately keyed off level-ups rather than
 * every hit: level-ups are already the game's reward beat, and firing
 * this on every hit would make it wallpaper instead of a surprise. Each
 * world gets its own shout + confetti palette so the moment is instantly
 * recognisable as "that's the Kitchen one". Text, not emoji — CLAUDE.md
 * §7.3 rule 8 bans emoji in user-facing UI.
 */
export interface WorldEasterEgg {
  readonly text: string;
  readonly textColour: string;
  readonly confetti: readonly number[];
}

export const WORLD_EASTER_EGG: Readonly<Record<string, WorldEasterEgg>> = {
  garden: { text: 'BLOOM!', textColour: '#7FD9A8', confetti: [0x7fd9a8, 0xff6ba8, 0xffc93c] },
  workshop: { text: 'CLANG!', textColour: '#CC8844', confetti: [0xcc8844, 0x8899aa, 0xffc93c] },
  kitchen: { text: 'SIZZLE!', textColour: '#FF6BA8', confetti: [0xf5f2e8, 0xffc93c, 0xff6ba8] },
  funfair: {
    text: 'TA-DA!',
    textColour: '#FFC93C',
    confetti: [0xff6ba8, 0xffc93c, 0x4db3e5, 0x7fd9a8],
  },
  disco: { text: 'GROOVY!', textColour: '#4DB3E5', confetti: [0xff6ba8, 0x4db3e5, 0xffc93c] },
};

/** How often a level-up triggers its world's easter egg — rare enough to stay a surprise. */
export const EASTER_EGG_CHANCE = 0.1;

/** Golden Spinner respawn window in ms — shorter (more frequent) in `goldenFrequent` worlds. */
export const GOLDEN_SPAWN_DELAY_MS = {
  normal: { min: 25_000, max: 40_000 },
  frequent: { min: 12_000, max: 20_000 },
} as const;

/** How long a spawned Golden Spinner stays before it vanishes unclaimed. */
export const GOLDEN_LIFETIME_MS = 6000;
