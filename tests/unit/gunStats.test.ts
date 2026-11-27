import { describe, expect, it } from 'vitest';

import { GUN_DEFS } from '../../src/entities/gun/gun.data';
import {
  formatGain,
  formatStat,
  gunStats,
  statCeilings,
  statRows,
} from '../../src/systems/gunStats';

const gun = (id: string) => {
  const found = GUN_DEFS.find((g) => g.id === id);
  if (!found) throw new Error(`missing gun ${id}`);
  return found;
};

describe('gun stats', () => {
  it('reads coins, power (fill power x streams) and water (tank / drain)', () => {
    expect(gunStats(gun('pistol'))).toEqual({ coins: 1, power: 26, water: 150 });
    expect(gunStats(gun('splashjr'))).toEqual({ coins: 2, power: 30, water: 210 });
  });

  it('grows coins and power with the level, and leaves water alone', () => {
    const base = gunStats(gun('hose'), 1);
    const top = gunStats(gun('hose'), 5);
    expect(top.coins).toBeCloseTo(base.coins * 1.6);
    expect(top.power).toBeCloseTo(base.power * 1.32);
    expect(top.water).toBe(base.water);
  });

  it('builds three rows from the old gun to the new, with the gain', () => {
    const rows = statRows(gunStats(gun('pistol')), gunStats(gun('hose')));
    expect(rows.map((r) => r.key)).toEqual(['coins', 'power', 'water']);
    expect(rows[0]).toMatchObject({ from: 1, to: 1.5, gain: 0.5 });
    expect(rows[1]?.gain).toBe(2);
    expect(rows[2]?.gain).toBeCloseTo(395 / 2 - 150);
    for (const r of rows) {
      expect(r.toFill).toBeGreaterThan(r.fromFill);
      expect(r.toFill).toBeLessThanOrEqual(1);
    }
  });

  it('shows no gain when the new gun is weaker at something', () => {
    const rows = statRows(gunStats(gun('inferno')), gunStats(gun('pistol')));
    expect(rows.every((r) => r.gain === 0)).toBe(true);
  });

  it('keeps every bar inside the track', () => {
    const ceiling = statCeilings();
    for (const g of GUN_DEFS) {
      const s = gunStats(g, 5);
      expect(s.coins).toBeLessThanOrEqual(ceiling.coins);
      expect(s.power).toBeLessThanOrEqual(ceiling.power);
      expect(s.water).toBeLessThanOrEqual(ceiling.water);
    }
  });

  it('prints each stat the way the reveal shows it', () => {
    expect(formatStat('coins', 1.5)).toBe('×1.5');
    expect(formatStat('coins', 1.15)).toBe('×1.15');
    expect(formatStat('power', 27.6)).toBe('28');
    expect(formatGain('coins', 0.5)).toBe('+0.5');
    expect(formatGain('water', 47.5)).toBe('+48');
  });
});
