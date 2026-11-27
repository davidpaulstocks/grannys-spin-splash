/**
 * The three numbers a child can compare between guns, and the rows the gun
 * reveal animates: Coins (the coin multiplier), Power (how fast it fills an
 * instrument: fill power x streams) and Water (how long the tank lasts: tank
 * / drain). Pure maths over `GUN_DEFS`; no Phaser.
 */

import { GUN_DEFS, MAX_GUN_LEVEL } from '../entities/gun/gun.data';
import type { GunDef } from '../entities/gun/gun.types';
import { gunAtLevel } from '../entities/gun/gunLevels';

export interface GunStats {
  readonly coins: number;
  readonly power: number;
  readonly water: number;
}

export type StatKey = keyof GunStats;

export interface StatRow {
  readonly key: StatKey;
  readonly label: string;
  readonly from: number;
  readonly to: number;
  /** Bar fill for `from` and `to`, 0 to 1 against the best any gun reaches. */
  readonly fromFill: number;
  readonly toFill: number;
  /** `to - from`, when positive; 0 otherwise (a gun can trade one stat for another). */
  readonly gain: number;
}

export const STAT_LABELS: Readonly<Record<StatKey, string>> = {
  coins: 'Coins',
  power: 'Power',
  water: 'Water',
};
const STAT_KEYS: readonly StatKey[] = ['coins', 'power', 'water'];

/** The stats of a gun at a level. */
export function gunStats(def: GunDef, level = 1): GunStats {
  const g = gunAtLevel(def, level);
  return { coins: g.coinBoost, power: g.power * g.streams, water: g.tank / g.drain };
}

/** The best of each stat over every gun at the top level: what a full bar means. */
export function statCeilings(): GunStats {
  const all = GUN_DEFS.map((g) => gunStats(g, MAX_GUN_LEVEL));
  return {
    coins: Math.max(...all.map((s) => s.coins)),
    power: Math.max(...all.map((s) => s.power)),
    water: Math.max(...all.map((s) => s.water)),
  };
}

/** The three rows comparing `previous` with `next`, in the order the reveal plays them. */
export function statRows(previous: GunStats, next: GunStats): StatRow[] {
  const ceiling = statCeilings();
  const fill = (key: StatKey, value: number): number =>
    Math.min(1, Math.max(0, value / ceiling[key]));
  return STAT_KEYS.map((key) => ({
    key,
    label: STAT_LABELS[key],
    from: previous[key],
    to: next[key],
    fromFill: fill(key, previous[key]),
    toFill: fill(key, next[key]),
    gain: Math.max(0, next[key] - previous[key]),
  }));
}

/** "x1.5", "28", "197": each stat the way the reveal prints it. */
export function formatStat(key: StatKey, value: number): string {
  if (key === 'coins') return `×${Number(value.toFixed(2))}`;
  return `${Math.round(value)}`;
}

/** The gain printed beside a row: "+0.5", "+12". */
export function formatGain(key: StatKey, gain: number): string {
  return `+${key === 'coins' ? Number(gain.toFixed(2)) : Math.round(gain)}`;
}
