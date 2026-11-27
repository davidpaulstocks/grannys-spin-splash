/**
 * Grannies join the band at total-star milestones (20, 40, 70, 100 for the painted ones): stars are a
 * rating and are never spent, so a granny is never bought. Pure functions over `SaveData`, so the rules
 * are unit-tested without a scene or storage. A granny counts as joined when the save already lists her
 * (an old save that bought Punk Granny with coins keeps her) or when the player's stars have reached her
 * milestone; `joinGrannies` writes the milestone ones into the save and says who just arrived.
 */

import { GRANNY_DEFS } from '../entities/granny/granny.data';
import type { GrannyDef } from '../entities/granny/granny.types';
import type { SaveData } from '../types/save';
import { totalStars } from './Progress';

/** True once she is owned or the player's stars have reached her milestone. */
export function isGrannyJoined(save: SaveData, granny: GrannyDef): boolean {
  return save.unlockedGrannies.includes(granny.id) || totalStars(save) >= granny.starsToJoin;
}

/** How many more stars before she joins; 0 once she has. */
export function starsUntilJoin(save: SaveData, granny: GrannyDef): number {
  return isGrannyJoined(save, granny) ? 0 : granny.starsToJoin - totalStars(save);
}

/** "Joins at 40 stars", the line a locked granny wears in the Shop. */
export function joinLine(granny: GrannyDef): string {
  return `Joins at ${granny.starsToJoin} stars`;
}

/** The toast for a granny who has just joined: "Punk Granny has joined! Loud: Splash Frenzy lasts 30% longer". */
export function joinedMessage(granny: GrannyDef): string {
  return `${granny.name} has joined! ${granny.talent.name}: ${granny.talent.line}`;
}

/** The save with every granny whose milestone has been reached recorded as owned, and the ones who are new. */
export function joinGrannies(save: SaveData): { save: SaveData; joined: readonly GrannyDef[] } {
  const stars = totalStars(save);
  const joined = GRANNY_DEFS.filter(
    (g) => g.starsToJoin > 0 && stars >= g.starsToJoin && !save.unlockedGrannies.includes(g.id),
  );
  if (joined.length === 0) return { save, joined };
  return {
    save: { ...save, unlockedGrannies: [...save.unlockedGrannies, ...joined.map((g) => g.id)] },
    joined,
  };
}
