/**
 * What the Shop's gun card says about one gun: for an owned gun the next
 * level before and after in words and numbers ("Level 2 → 3", "Coins ×1.15 →
 * ×1.3", "Power +8% → +16%"); for a gun not owned, what it does (its price is on
 * the button). Pure over the save; the card only draws it.
 */

import { GUN_LEVEL_POWER_STEP, MAX_GUN_LEVEL } from '../../entities/gun/gun.data';
import type { GunDef } from '../../entities/gun/gun.types';
import { gunAtLevel, upgradeCost } from '../../entities/gun/gunLevels';
import { gunHeadline } from '../../systems/Rewards';
import type { UnlockManager } from '../../systems/UnlockManager';
import type { GunCardRow, GunCardState } from '../../ui/GunCard';
import { isMysteryGun } from './mystery';

const PERCENT = 100;
const MAX_DECIMALS = 2;

const whole = (n: number): string => `${Math.round(n)}`;
const multiplier = (n: number): string => `×${Number(n.toFixed(MAX_DECIMALS))}`;
const percent = (n: number): string => `+${Math.round(n)}%`;

/** A row of plain words with nothing to count. */
function plain(text: string): GunCardRow {
  return { prefix: text, from: 0, format: () => '' };
}

/** The card's rows for an owned gun at `level`. */
function ownedRows(def: GunDef, level: number): GunCardRow[] {
  const atTop = level >= MAX_GUN_LEVEL;
  const now = gunAtLevel(def, level).coinBoost;
  const then = gunAtLevel(def, level + 1).coinBoost;
  const powerNow = (level - 1) * GUN_LEVEL_POWER_STEP * PERCENT;
  const powerThen = level * GUN_LEVEL_POWER_STEP * PERCENT;
  if (atTop) {
    return [
      { prefix: 'Level', from: level, format: (n) => `${whole(n)} · MAX` },
      { prefix: 'Coins', from: now, format: multiplier },
      { prefix: 'Power', from: powerNow, format: percent },
    ];
  }
  return [
    { prefix: 'Level', from: level, to: level + 1, format: whole },
    { prefix: 'Coins', from: now, to: then, format: multiplier },
    { prefix: 'Power', from: powerNow, to: powerThen, format: percent },
  ];
}

/** The card's state for gun `def` against the player's save. */
export function gunCardState(unlocks: UnlockManager, def: GunDef): GunCardState {
  const owned = unlocks.isGunUnlocked(def.id);
  const level = unlocks.getGunLevel(def.id);
  const price = owned ? upgradeCost(def, level) : def.cost;
  return {
    gunId: def.id,
    owned,
    level,
    rows: owned ? ownedRows(def, level) : [plain(gunHeadline(def))],
    price,
    canAfford: price !== null && unlocks.getVault() >= price,
    canBlast: !owned && !isMysteryGun(unlocks, def.id),
  };
}
