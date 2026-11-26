import { describe, expect, it } from 'vitest';

import { GUN_DEFS, MAX_GUN_LEVEL } from '../../src/entities/gun/gun.data';
import type { GunDef } from '../../src/entities/gun/gun.types';
import {
  clampGunLevel,
  gunAtLevel,
  gunLevelIn,
  upgradeCost,
} from '../../src/entities/gun/gunLevels';

function gun(id: string): GunDef {
  const def = GUN_DEFS.find((g) => g.id === id);
  if (!def) throw new Error(`no gun ${id}`);
  return def;
}
const hose = gun('hose');
const pistol = gun('pistol');

describe('gunAtLevel', () => {
  it('is the base gun at level 1', () => {
    expect(gunAtLevel(hose, 1)).toBe(hose);
  });

  it('adds 15% of the base coin boost and 8% of the base power per level', () => {
    const l3 = gunAtLevel(hose, 3);
    expect(l3.coinBoost).toBeCloseTo(hose.coinBoost * 1.3);
    expect(l3.power).toBeCloseTo(hose.power * 1.16);
    const l5 = gunAtLevel(hose, 5);
    expect(l5.coinBoost).toBeCloseTo(hose.coinBoost * 1.6);
    expect(l5.power).toBeCloseTo(hose.power * 1.32);
  });

  it('leaves every other stat alone and clamps silly levels', () => {
    const l5 = gunAtLevel(hose, 99);
    expect(l5).toEqual({ ...hose, power: l5.power, coinBoost: l5.coinBoost });
    expect(gunAtLevel(hose, 99).coinBoost).toBeCloseTo(hose.coinBoost * 1.6);
    expect(gunAtLevel(hose, -4)).toBe(hose);
  });
});

describe('upgradeCost', () => {
  it('is max(1500, 30% of the gun cost) doubling per level, to the nearest 100', () => {
    expect(upgradeCost(pistol, 1)).toBe(1500);
    expect(upgradeCost(pistol, 4)).toBe(12000);
    expect(upgradeCost(hose, 1)).toBe(1800);
    expect(upgradeCost(hose, 2)).toBe(3600);
  });

  it('has no price at the maximum level', () => {
    expect(upgradeCost(hose, MAX_GUN_LEVEL)).toBeNull();
  });
});

describe('levels in a save', () => {
  it('reads missing, bad and out-of-range entries as sensible levels', () => {
    expect(gunLevelIn(undefined, 'pistol')).toBe(1);
    expect(gunLevelIn({}, 'pistol')).toBe(1);
    expect(gunLevelIn({ pistol: 3 }, 'pistol')).toBe(3);
    expect(clampGunLevel(Number.NaN)).toBe(1);
    expect(clampGunLevel(9)).toBe(MAX_GUN_LEVEL);
  });
});
