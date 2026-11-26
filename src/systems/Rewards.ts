/**
 * What the player is saving for — docs/REWARD_LOOP.md. Pure functions over
 * `SaveData`: the cheapest gun or granny not yet owned (with the plain-words
 * line that says what it does), and the next venue still locked. The results
 * screen, Home and the Shop all read the same answer.
 */

import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import type { GunDef } from '../entities/gun/gun.types';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import type { SaveData } from '../types/save';
import { nextLockedVenue } from './Progress';

export type RewardKind = 'gun' | 'granny';

export interface NextReward {
  readonly kind: RewardKind;
  readonly id: string;
  readonly name: string;
  readonly cost: number;
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
const GRANNY_PERK = 'New look';

/** "1,120" — thousands separated, so a big total reads at a glance. */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

/** What a gun does, in words: "Coins ×1.5", with "Two jets" when it fires two. */
export function gunPerk(gun: GunDef): string {
  const parts: string[] = [];
  if (gun.coinBoost > 1) parts.push(`Coins ×${gun.coinBoost}`);
  if (gun.streams === TWO_JETS) parts.push('Two jets');
  return parts.length > 0 ? parts.join(' · ') : STARTER_PERK;
}

type Candidate = Omit<NextReward, 'have' | 'canAfford' | 'progress'>;

/**
 * The cheapest gun or granny the player does not own, or null when they own
 * everything. Ties go to the gun: it is the upgrade that changes the next gig.
 */
export function nextReward(save: SaveData): NextReward | null {
  const candidates: Candidate[] = [
    ...GUN_DEFS.filter((g) => !save.unlockedGuns.includes(g.id)).map(
      (g): Candidate => ({ kind: 'gun', id: g.id, name: g.name, cost: g.cost, perk: gunPerk(g) }),
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

/** The next venue still locked and how many more stars it needs, or null when all are open. */
export function nextVenue(
  save: SaveData,
  venues: readonly WorldDef[] = WORLD_DEFS,
): { readonly venue: WorldDef; readonly starsNeeded: number } | null {
  return nextLockedVenue(save, venues);
}
