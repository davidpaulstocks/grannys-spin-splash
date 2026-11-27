/**
 * What the player is saving for — docs/REWARD_LOOP.md. Pure functions over
 * `SaveData`: the next gun or granny not yet owned in price order (with the
 * plain-words line that says what it does), whether an upgrade is affordable,
 * and the next venue still locked. The results
 * screen, Home and the Shop all read the same answer.
 */

import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import type { GunDef } from '../entities/gun/gun.types';
import { gunAtLevel, gunLevelIn, upgradeCost } from '../entities/gun/gunLevels';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import type { SaveData } from '../types/save';
import { nextLockedVenue } from './Progress';

export type RewardKind = 'gun' | 'granny' | 'upgrade';

export interface NextReward {
  readonly kind: RewardKind;
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  /** For an upgrade: the level the gun would reach. */
  readonly level?: number;
  /** Coins held. */
  readonly have: number;
  readonly canAfford: boolean;
  /** `have / cost`, 0 to 1. */
  readonly progress: number;
  /** One short line a child reads at a glance: what owning it does. */
  readonly perk: string;
}

/** The streams count that makes a gun a "two jets" gun. */
const TWO_JETS = 2;
const STARTER_PERK = 'Starter gun';
const MAX_DECIMALS = 2;
const GRANNY_PERK = 'New look';
/** A particle at least this size reads as a wider jet. */
const WIDE_JET_SIZE = 10;

/** "1,120" — thousands separated, so a big total reads at a glance. */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** A number to at most two decimals, trailing zeros dropped: 1.95, 1.3, 2. */
function trimmed(value: number): string {
  return `${Number(value.toFixed(MAX_DECIMALS))}`;
}

/** What a gun does at `level`, in words and without the level: "Coins ×1.95 · Two jets", or the starter-gun line. */
export function gunEffect(gun: GunDef, level = 1): string {
  const boosted = gunAtLevel(gun, level);
  const parts: string[] = [];
  if (boosted.coinBoost > 1) parts.push(`Coins ×${trimmed(boosted.coinBoost)}`);
  if (boosted.streams === TWO_JETS) parts.push('Two jets');
  return parts.length > 0 ? parts.join(' · ') : STARTER_PERK;
}

/** The headline on the goal card, in plain words: "Coins ×1.5 · Wider jet". */
export function gunHeadline(gun: GunDef): string {
  const parts: string[] = [];
  if (gun.coinBoost > 1) parts.push(`Coins ×${trimmed(gun.coinBoost)}`);
  if (gun.streams === TWO_JETS) parts.push('Two jets');
  else if (gun.type === 'fire') parts.push('Fire jet');
  else if (gun.sz >= WIDE_JET_SIZE) parts.push('Wider jet');
  return parts.length > 0 ? parts.join(' · ') : STARTER_PERK;
}

/** The gun's perk line: "Coins ×1.5" at level 1, "Level 3 · Coins ×1.95" above it. */
export function gunPerk(gun: GunDef, level = 1): string {
  const effect = gunEffect(gun, level);
  return level > 1 ? `Level ${level} · ${effect}` : effect;
}

type Candidate = Omit<NextReward, 'have' | 'canAfford' | 'progress'>;

/**
 * The next thing the player does not own, in price order across guns and
 * grannies, or null when they own everything. Never an upgrade: upgrades are
 * a smaller, separate thing bought in the Shop (`affordableUpgrade`). Ties go
 * to the gun, which changes the next gig.
 */
export function nextReward(save: SaveData): NextReward | null {
  const candidates: Candidate[] = [
    ...GUN_DEFS.filter((g) => !save.unlockedGuns.includes(g.id)).map(
      (g): Candidate => ({
        kind: 'gun',
        id: g.id,
        name: g.name,
        cost: g.cost,
        perk: gunHeadline(g),
      }),
    ),
    ...GRANNY_DEFS.filter((g) => !save.unlockedGrannies.includes(g.id)).map(
      (g): Candidate => ({
        kind: 'granny',
        id: g.id,
        name: g.name,
        cost: g.unlockCost,
        perk: GRANNY_PERK,
      }),
    ),
  ];
  let cheapest: Candidate | undefined;
  for (const candidate of candidates) {
    if (!cheapest || candidate.cost < cheapest.cost) cheapest = candidate;
  }
  if (!cheapest) return null;
  return {
    ...cheapest,
    have: save.vault,
    canAfford: save.vault >= cheapest.cost,
    progress: cheapest.cost <= 0 ? 1 : Math.min(1, Math.max(0, save.vault / cheapest.cost)),
  };
}

/** The cost of the equipped gun's next level when the player can pay it now, else null (also null at the top level). */
export function affordableUpgrade(save: SaveData): number | null {
  const gun = GUN_DEFS.find((g) => g.id === save.selectedGunId);
  if (!gun || !save.unlockedGuns.includes(gun.id)) return null;
  const cost = upgradeCost(gun, gunLevelIn(save.gunLevels, gun.id));
  return cost !== null && save.vault >= cost ? cost : null;
}

/** True when the Shop has something the player can buy now: a gun they do not own, or an upgrade for the equipped gun. Drives the dot on Home's SHOP button. */
export function shopHasNews(save: SaveData): boolean {
  const newGun = GUN_DEFS.some((g) => !save.unlockedGuns.includes(g.id) && save.vault >= g.cost);
  return newGun || affordableUpgrade(save) !== null;
}

/** The next venue still locked and how many more stars it needs, or null when all are open. */
export function nextVenue(
  save: SaveData,
  venues: readonly WorldDef[] = WORLD_DEFS,
): { readonly venue: WorldDef; readonly starsNeeded: number } | null {
  return nextLockedVenue(save, venues);
}
