/**
 * Gun upgrade levels. Every owned gun can be upgraded from level 1 to
 * `MAX_GUN_LEVEL` with coins: each level adds a share of the gun's own coin
 * boost and fill power, so something is always within reach without new art.
 * Pure functions only; buying lives in `systems/UnlockManager.ts`.
 */

import type { GunDef } from './gun.types';
import {
  GUN_LEVEL_COIN_STEP,
  GUN_LEVEL_POWER_STEP,
  GUN_UPGRADE_BASE_COST_SHARE,
  GUN_UPGRADE_COST_GROWTH,
  GUN_UPGRADE_MIN_COST,
  GUN_UPGRADE_ROUNDING,
  MAX_GUN_LEVEL,
  MIN_GUN_LEVEL,
} from './gun.data';

/** Keeps a stored or passed-in level to a whole number from 1 to the maximum; anything unusable reads as level 1. */
export function clampGunLevel(level: number | undefined): number {
  if (level === undefined || !Number.isFinite(level)) return MIN_GUN_LEVEL;
  return Math.min(MAX_GUN_LEVEL, Math.max(MIN_GUN_LEVEL, Math.floor(level)));
}

/** The level a save holds for a gun; a gun with no entry (or an old save with none at all) is level 1. */
export function gunLevelIn(
  levels: Readonly<Record<string, number>> | undefined,
  gunId: string,
): number {
  return clampGunLevel(levels?.[gunId]);
}

/** The gun as it fires at `level`: `power` and `coinBoost` scaled, everything else untouched. Level 1 is the base gun. */
export function gunAtLevel(def: GunDef, level: number): GunDef {
  const steps = clampGunLevel(level) - MIN_GUN_LEVEL;
  if (steps === 0) return def;
  return {
    ...def,
    power: def.power * (1 + GUN_LEVEL_POWER_STEP * steps),
    coinBoost: def.coinBoost * (1 + GUN_LEVEL_COIN_STEP * steps),
  };
}

/** Coins to take a gun from `level` to `level + 1`, or null at the maximum level. */
export function upgradeCost(def: GunDef, level: number): number | null {
  const current = clampGunLevel(level);
  if (current >= MAX_GUN_LEVEL) return null;
  const base = Math.max(GUN_UPGRADE_MIN_COST, def.cost * GUN_UPGRADE_BASE_COST_SHARE);
  const raw = base * GUN_UPGRADE_COST_GROWTH ** (current - MIN_GUN_LEVEL);
  return Math.round(raw / GUN_UPGRADE_ROUNDING) * GUN_UPGRADE_ROUNDING;
}
