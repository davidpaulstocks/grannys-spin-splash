/**
 * The gun ladder: eighteen guns in the order a child climbs them (cost, coin boost, rarity, power
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

/** The whole ladder, cheapest first: order, id, name, rarity, cost in coins, coin boost, power rating. */
export const GUN_LADDER: readonly GunLadderEntry[] = [
  {
    order: 1,
    id: 'pistol',
    name: 'Drip Pistol',
    rarity: 'common',
    cost: 0,
    coinBoost: 1,
    powerRating: 100,
  },
  {
    order: 2,
    id: 'squirter',
    name: 'The Squirter',
    rarity: 'common',
    cost: 0,
    coinBoost: 1,
    powerRating: 120,
  },
  {
    order: 3,
    id: 'hose',
    name: 'Garden Hose',
    rarity: 'common',
    cost: 6000,
    coinBoost: 1.5,
    powerRating: 200,
  },
  {
    order: 4,
    id: 'bubble_blitz',
    name: 'Bubble Blitz',
    rarity: 'common',
    cost: 12000,
    coinBoost: 1.75,
    powerRating: 280,
  },
  {
    order: 5,
    id: 'splashjr',
    name: 'Splash Jr',
    rarity: 'rare',
    cost: 20000,
    coinBoost: 2,
    powerRating: 400,
  },
  {
    order: 6,
    id: 'hydro_blaster',
    name: 'Hydro Blaster',
    rarity: 'rare',
    cost: 35000,
    coinBoost: 2.4,
    powerRating: 550,
  },
  {
    order: 7,
    id: 'slime_slinger',
    name: 'Slime Slinger',
    rarity: 'rare',
    cost: 55000,
    coinBoost: 2.8,
    powerRating: 700,
  },
  {
    order: 8,
    id: 'soaker3000',
    name: 'Soaker 3000',
    rarity: 'rare',
    cost: 80000,
    coinBoost: 3.2,
    powerRating: 900,
  },
  {
    order: 9,
    id: 'shark_soaker',
    name: 'Shark Soaker',
    rarity: 'epic',
    cost: 120000,
    coinBoost: 3.7,
    powerRating: 1200,
  },
  {
    order: 10,
    id: 'blizzard_blaster',
    name: 'Blizzard Blaster',
    rarity: 'epic',
    cost: 170000,
    coinBoost: 4.2,
    powerRating: 1500,
  },
  {
    order: 11,
    id: 'thunder_soaker',
    name: 'Thunder Soaker',
    rarity: 'epic',
    cost: 240000,
    coinBoost: 4.8,
    powerRating: 1900,
  },
  {
    order: 12,
    id: 'inferno',
    name: 'Inferno',
    rarity: 'epic',
    cost: 330000,
    coinBoost: 5.5,
    powerRating: 2400,
  },
  {
    order: 13,
    id: 'rainbow_rocket',
    name: 'Rainbow Rocket',
    rarity: 'epic',
    cost: 450000,
    coinBoost: 6.2,
    powerRating: 3000,
  },
  {
    order: 14,
    id: 'turbo_tornado',
    name: 'Turbo Tornado',
    rarity: 'legendary',
    cost: 600000,
    coinBoost: 7,
    powerRating: 3800,
  },
  {
    order: 15,
    id: 'dragon_drencher',
    name: 'Dragon Drencher',
    rarity: 'legendary',
    cost: 800000,
    coinBoost: 8,
    powerRating: 4800,
  },
  {
    order: 16,
    id: 'neptunes_trident',
    name: "Neptune's Trident",
    rarity: 'legendary',
    cost: 1050000,
    coinBoost: 9,
    powerRating: 6000,
  },
  {
    order: 17,
    id: 'galaxy_blaster',
    name: 'Galaxy Blaster',
    rarity: 'legendary',
    cost: 1400000,
    coinBoost: 10,
    powerRating: 7500,
  },
  {
    order: 18,
    id: 'mega_cannon',
    name: 'MEGA CANNON',
    rarity: 'legendary',
    cost: 2000000,
    coinBoost: 12,
    powerRating: 9999,
  },
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

/** All eighteen, painted or not: for the ladder tests and for planning. The game uses GUN_DEFS. */
export const GUN_LADDER_DEFS: readonly GunDef[] = GUN_LADDER.map(buildGun);

/** The guns that exist in the game today: the ladder, minus any whose picture is not yet painted. */
export const GUN_DEFS: readonly GunDef[] = GUN_LADDER_DEFS.filter((g) =>
  GUN_ART_READY.includes(g.id),
);

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GUN_ID = 'pistol';
