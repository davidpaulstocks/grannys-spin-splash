/** GunDef, the nozzle anchor, rarity and projectile styles. CLAUDE.md §7.2, §8.2. */

export type GunTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type GunType = 'water' | 'fire';

/** How rare a gun is: shown as a coloured tag, and the colour of the reveal's rays. */
export type GunRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

/**
 * What a gun fires, as drawn (the hit logic is the same for all of them). One renderer per style in
 * `entities/waterParticle/projectiles/`.
 */
export type ProjectileStyle =
  | 'water'
  | 'bubbles'
  | 'slime'
  | 'shark'
  | 'ice'
  | 'lightning'
  | 'flame'
  | 'rainbow'
  | 'tornado'
  | 'dragon'
  | 'trident'
  | 'laser'
  | 'mega'
  | 'lava'
  | 'glitter'
  | 'kraken'
  | 'starpony'
  | 'vortex'
  | 'phoenix';

/**
 * Where the water leaves the gun, in the pixels of the one side-on picture (nozzle pointing right).
 * Written by `npm run guns` for new pictures; Gun.ts turns the single picture to the aim.
 */
export interface AnchorJSON {
  readonly x: number;
  readonly y: number;
}

/** The facts of the ladder, in the order a child climbs it (gun.data.ts). */
export interface GunLadderEntry {
  readonly order: number;
  readonly id: string;
  readonly name: string;
  readonly rarity: GunRarity;
  readonly cost: number;
  readonly coinBoost: number;
  /** A display number only: grows 8% per upgrade level. */
  readonly powerRating: number;
}

/** How a gun shoots and what its shots look like (gunMechanics.data.ts). */
export interface GunMechanics {
  readonly tier: GunTier;
  readonly tank: number;
  readonly drain: number;
  readonly interval: number;
  readonly power: number;
  readonly streams: number;
  readonly sz: number;
  readonly type: GunType;
  readonly projectile: ProjectileStyle;
  /** Main colour of the shots and the impact (palette colours only, via `shade`). */
  readonly particleColour: number;
  /** Second colour of the projectile (core, edge, sparkle), where the style has one. */
  readonly accentColour: number;
  /** Gap between neighbouring barrels in px, where the gun has more than one stream; default is the cannon's. */
  readonly barrelSpacing?: number;
}

export interface GunDef extends GunLadderEntry, GunMechanics {
  readonly spriteKey: string;
  readonly rarity: GunRarity;
  /** How big the picture is on the reveal, 1 for the pistol to about 1.5 for the MEGA CANNON. */
  readonly showScale: number;
  /** How big the gun is in Granny's hands, same ladder. */
  readonly handScale: number;
}
