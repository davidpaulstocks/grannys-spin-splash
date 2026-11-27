/**
 * Which guns are still a mystery: a gun the player does not own, is not the
 * next one to save for, and cannot afford yet. The rack draws it as a dark
 * shape and the Shop gives it no preview ("Keep playing to find out!"). Pure
 * over the player's save.
 */

import { GUN_DEFS } from '../../entities/gun/gun.data';
import type { UnlockManager } from '../../systems/UnlockManager';

/** What a tap on a mystery gun says. */
export const MYSTERY_MESSAGE = 'Keep playing to find out!';

/** True when gun `id` is a silhouette in the rack. */
export function isMysteryGun(unlocks: UnlockManager, id: string): boolean {
  if (unlocks.isGunUnlocked(id)) return false;
  const ordered = [...GUN_DEFS].sort((a, b) => a.cost - b.cost);
  const next = ordered.find((g) => !unlocks.isGunUnlocked(g.id));
  const def = ordered.find((g) => g.id === id);
  return def !== undefined && id !== next?.id && def.cost > unlocks.getVault();
}
