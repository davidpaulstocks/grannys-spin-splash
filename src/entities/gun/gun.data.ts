/**
 * The gun ladder: twenty-four guns in the order a child climbs them (cost, coin boost, rarity, power
 * rating), the upgrade-level constants, and which pictures are painted. How each gun shoots and
 * what its shots look like is in gunMechanics.data.ts.
 *
 * Tuning history, short (the long version is in git, before 2026-11-27):
 * - `tank` is sized so continuous fire lasts a whole gig (`drain / (interval / 1000) x seconds x
 *   1.05`), so the water bar is a second clock and the orchestra never goes silent on a dry tank.
 * - `power` is balanced against a bot that plays like a child (retargets every 0.9 s, lands 80%):
 *   starter gun, a trio is full in about 5 s; the ladder of gigs, not the gun, keeps Frenzy
 *   reachable. Each hit adds `power / FIRE_DENSITY_SCALE`, so DPS is `power x streams / interval`.
 * - The top of the ladder is deliberately steep in coins but gentle in DPS: a wall that is full
 *   all the time flattens the build-and-release the audio is built on (docs/REWARD_LOOP.md).
 * Still not a substitute for a real playtest.
 */

import type { GunDef, GunLadderEntry } from './gun.types';
import { GUN_LADDER_BASE } from './gunLadderBase.data';
import { GUN_MECHANICS } from './gunMechanics.data';

/** Upgrade levels (see `gunLevels.ts`): every owned gun runs from level 1 to this. */
export const MIN_GUN_LEVEL = 1;
export const MAX_GUN_LEVEL = 5;
/** Each level above 1 adds this share of the gun's base `coinBoost` (level 5 = base x 1.6). */
export const GUN_LEVEL_COIN_STEP = 0.15;
/** Each level above 1 adds this share of the gun's base fill `power` (level 5 = base x 1.32). */
export const GUN_LEVEL_POWER_STEP = 0.08;
/** The displayed POWER rating grows this share of its base per upgrade level. */
export const GUN_LEVEL_RATING_STEP = 0.08;
/** Upgrade price: `max(min, gun cost x share) x growth ^ (level - 1)`, rounded to the nearest `rounding`. */
export const GUN_UPGRADE_MIN_COST = 1500;
export const GUN_UPGRADE_BASE_COST_SHARE = 0.3;
export const GUN_UPGRADE_COST_GROWTH = 2;
export const GUN_UPGRADE_ROUNDING = 100;
/** The picture grows along the ladder: the pistol is 1, the last gun this much (reveal, and in Granny's hands). */
export const GUN_SHOW_SCALE_MAX = 1.5;
export const GUN_HAND_SCALE_MAX = 1.25;

/** Guns beyond MEGA CANNON, weakest first: each is priced and boosted by the rule below. */
const MYTHIC_GUNS: readonly { readonly id: string; readonly name: string }[] = [
  { id: 'volcano_blaster', name: 'Volcano Blaster' },
  { id: 'unicorn_sparkler', name: 'Unicorn Sparkler' },
  { id: 'kraken_cannon', name: 'Kraken Cannon' },
  { id: 'star_pony', name: 'Star Pony' },
  { id: 'robo_rex', name: 'Robo-Rex' },
  { id: 'phoenix_fury', name: 'Phoenix Fury' },
];
/**
 * Price and power rise together past MEGA CANNON: each new gun costs this many times the last and
 * pays this many times the coins, so a new gun keeps arriving at the same pace however long the
 * ladder gets. The displayed POWER grows by `LADDER_RATING_STEP`.
 */
export const LADDER_PRICE_STEP = 1.25;
export const LADDER_BOOST_STEP = 1.25;
export const LADDER_RATING_STEP = 1.3;
/** Prices and ratings are rounded to this many significant digits (tidy figures); boosts to one decimal. */
const LADDER_SIGNIFICANT_DIGITS = 2;
const LADDER_BOOST_DECIMALS = 1;

/** `value` rounded to `digits` significant digits: 3,906,250 -> 3,900,000. */
function roundSignificant(value: number, digits: number): number {
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - digits + 1);
  return Math.round(value / magnitude) * magnitude;
}

/** The mythic guns, each a step above the last (the chain runs on unrounded values so rounding never drifts). */
function extendLadder(base: readonly GunLadderEntry[]): GunLadderEntry[] {
  const top = base[base.length - 1] as GunLadderEntry;
  let cost = top.cost;
  let boost = top.coinBoost;
  let rating = top.powerRating;
  return MYTHIC_GUNS.map((gun, i) => {
    cost *= LADDER_PRICE_STEP;
    boost *= LADDER_BOOST_STEP;
    rating *= LADDER_RATING_STEP;
    return {
      order: top.order + i + 1,
      id: gun.id,
      name: gun.name,
      rarity: 'mythic',
      cost: roundSignificant(cost, LADDER_SIGNIFICANT_DIGITS),
      coinBoost: Number(boost.toFixed(LADDER_BOOST_DECIMALS)),
      powerRating: roundSignificant(rating, LADDER_SIGNIFICANT_DIGITS),
    };
  });
}

/** The whole ladder, cheapest first: the hand-set eighteen, then the mythic guns by the rule above. */
export const GUN_LADDER: readonly GunLadderEntry[] = [
  ...GUN_LADDER_BASE,
  ...extendLadder(GUN_LADDER_BASE),
];

/**
 * Which gun pictures have been painted and shipped (public/sprites/guns/<id>/0.webp + anchor.json).
 * A gun not listed is left out of the game entirely: no Shop slot, no rack cell, no reward, no
 * texture loaded. To switch one on: save the owner's sheets in `_art_inbox/guns/`, run
 * `npm run guns`, look at each picture, then add the ids it prints here.
 */
export const GUN_ART_READY: readonly string[] = [
  'pistol',
  'squirter',
  'hose',
  'bubble_blitz',
  'splashjr',
  'hydro_blaster',
  'slime_slinger',
  'soaker3000',
  'shark_soaker',
  'blizzard_blaster',
  'thunder_soaker',
  'inferno',
  'rainbow_rocket',
  'turbo_tornado',
  'dragon_drencher',
  'neptunes_trident',
  'galaxy_blaster',
  'mega_cannon',
  'volcano_blaster',
  'unicorn_sparkler',
  'kraken_cannon',
  'star_pony',
  'robo_rex',
  'phoenix_fury',
];

/** Fully built gun for one ladder entry: ladder facts + mechanics + the size it is shown at. */
function buildGun(entry: GunLadderEntry): GunDef {
  const mechanics = GUN_MECHANICS[entry.id];
  const along = (entry.order - 1) / (GUN_LADDER.length - 1);
  return {
    ...entry,
    ...mechanics,
    spriteKey: `gun_${entry.id}`,
    showScale: 1 + (GUN_SHOW_SCALE_MAX - 1) * along,
    handScale: 1 + (GUN_HAND_SCALE_MAX - 1) * along,
  };
}

/** All of them, painted or not: for the ladder tests and for planning. The game uses GUN_DEFS. */
export const GUN_LADDER_DEFS: readonly GunDef[] = GUN_LADDER.map(buildGun);

/** The guns that exist in the game today: the ladder, minus any whose picture is not yet painted. */
export const GUN_DEFS: readonly GunDef[] = GUN_LADDER_DEFS.filter((g) =>
  GUN_ART_READY.includes(g.id),
);

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GUN_ID = 'pistol';
