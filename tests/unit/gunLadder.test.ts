import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  GUN_ART_READY,
  GUN_DEFS,
  GUN_LADDER,
  GUN_LADDER_DEFS,
  MAX_GUN_LEVEL,
} from '../../src/entities/gun/gun.data';
import { GUN_MECHANICS } from '../../src/entities/gun/gunMechanics.data';
import { powerRatingAt } from '../../src/entities/gun/gunLevels';

const pairs = GUN_LADDER_DEFS.slice(1).map((g, i) => [GUN_LADDER_DEFS[i] ?? g, g] as const);

describe('the gun ladder', () => {
  it('has eighteen guns, in order, with unique ids', () => {
    expect(GUN_LADDER).toHaveLength(18);
    expect(GUN_LADDER.map((g) => g.order)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(new Set(GUN_LADDER.map((g) => g.id)).size).toBe(18);
  });

  it('never goes down in cost, coin boost or power rating', () => {
    for (const [a, b] of pairs) {
      expect(b.cost, `${b.id} cost`).toBeGreaterThanOrEqual(a.cost);
      expect(b.coinBoost, `${b.id} coinBoost`).toBeGreaterThanOrEqual(a.coinBoost);
      expect(b.powerRating, `${b.id} powerRating`).toBeGreaterThanOrEqual(a.powerRating);
    }
  });

  it('never goes down in fill power x streams or in tank / drain', () => {
    for (const [a, b] of pairs) {
      expect(b.power * b.streams, `${b.id} power x streams`).toBeGreaterThanOrEqual(
        a.power * a.streams,
      );
      expect(b.tank / b.drain, `${b.id} tank / drain`).toBeGreaterThanOrEqual(a.tank / a.drain);
    }
  });

  it('keeps every tank lasting a whole gig of continuous fire', () => {
    for (const g of GUN_LADDER_DEFS) {
      const seconds = (g.tank / g.drain) * (g.interval / 1000);
      expect(seconds, g.id).toBeGreaterThanOrEqual(30);
    }
  });

  it('keeps the old ids and the prices the owner decided', () => {
    const cost = (id: string): number | undefined => GUN_LADDER.find((g) => g.id === id)?.cost;
    expect(cost('soaker3000')).toBe(80000);
    expect(cost('inferno')).toBe(330000);
    expect(cost('mega_cannon')).toBe(2000000);
    expect(GUN_LADDER.filter((g) => g.cost === 0).map((g) => g.id)).toEqual(['pistol', 'squirter']);
  });

  it('gives every gun mechanics, a growing picture size and a rarity in ladder order', () => {
    const rank = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
    for (const [a, b] of pairs) {
      expect(rank[b.rarity]).toBeGreaterThanOrEqual(rank[a.rarity]);
      expect(b.showScale).toBeGreaterThan(a.showScale);
      expect(b.handScale).toBeGreaterThan(a.handScale);
    }
    for (const g of GUN_LADDER) {
      expect(GUN_MECHANICS[g.id]?.projectile, g.id).toBeTypeOf('string');
    }
    expect(GUN_LADDER_DEFS[0]?.showScale).toBe(1);
  });

  it('grows the displayed power rating 8% per upgrade level', () => {
    const pistol = GUN_LADDER_DEFS.find((g) => g.id === 'pistol');
    if (!pistol) throw new Error('no pistol');
    expect(powerRatingAt(pistol, 1)).toBe(100);
    expect(powerRatingAt(pistol, 2)).toBe(108);
    expect(powerRatingAt(pistol, MAX_GUN_LEVEL)).toBe(132);
  });

  it('only includes painted guns in the game, and each has its picture and nozzle', () => {
    expect(GUN_DEFS.map((g) => g.id)).toEqual(
      GUN_LADDER.map((g) => g.id).filter((id) => GUN_ART_READY.includes(id)),
    );
    for (const id of GUN_ART_READY) {
      expect(existsSync(`public/sprites/guns/${id}/0.webp`), id).toBe(true);
      expect(existsSync(`public/sprites/guns/${id}/anchor.json`), id).toBe(true);
    }
  });
});
