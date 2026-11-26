/** Groove unit tests — the coin multiplier: ring fill rate, level cap, drop-outs, jackpot. */

import { describe, expect, it } from 'vitest';

import { Groove, GROOVE_LEVEL_MS, MAX_GROOVE_LEVEL } from '../../src/systems/Groove';

describe('Groove', () => {
  it('starts at level 1 with an empty ring', () => {
    const groove = new Groove();
    expect(groove.level).toBe(1);
    expect(groove.ring).toBe(0);
  });

  it('the whole band at full earns a level every GROOVE_LEVEL_MS', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS / 2, 8, 8);
    expect(groove.level).toBe(1);
    expect(groove.ring).toBeCloseTo(0.5);
    groove.update(GROOVE_LEVEL_MS / 2, 8, 8);
    expect(groove.level).toBe(2);
    expect(groove.ring).toBeCloseTo(0);
  });

  it('half the band at full takes twice as long', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS, 4, 8);
    expect(groove.level).toBe(1);
    expect(groove.ring).toBeCloseTo(0.5);
    groove.update(GROOVE_LEVEL_MS, 4, 8);
    expect(groove.level).toBe(2);
  });

  it('does not fill with nobody at full, or with an empty band', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS * 3, 0, 8);
    groove.update(GROOVE_LEVEL_MS * 3, 3, 0);
    expect(groove.level).toBe(1);
    expect(groove.ring).toBe(0);
  });

  it('caps at level 5 and holds the ring full', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS * 10, 4, 4);
    expect(groove.level).toBe(MAX_GROOVE_LEVEL);
    expect(groove.ring).toBe(1);
  });

  it('can climb several levels in one long frame', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS * 2.5, 4, 4);
    expect(groove.level).toBe(3);
    expect(groove.ring).toBeCloseTo(0.5);
  });

  it('a drop-out in a small band costs one whole level, never below 1', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS * 2.5, 4, 4); // level 3, ring 0.5
    groove.dropOut(4);
    expect(groove.level).toBe(2);
    expect(groove.ring).toBeCloseTo(0.5);
    groove.dropOut(3);
    groove.dropOut(3);
    expect(groove.level).toBe(1);
    expect(groove.ring).toBe(0);
  });

  it('a drop-out in a big band costs proportionally less', () => {
    const groove = new Groove();
    groove.update(GROOVE_LEVEL_MS * 2.5, 16, 16); // level 3, ring 0.5
    groove.dropOut(16); // a quarter of a level
    expect(groove.level).toBe(3);
    expect(groove.ring).toBeCloseTo(0.25);
    groove.dropOut(16);
    groove.dropOut(16); // through the bottom of the ring: a level goes
    expect(groove.level).toBe(2);
    expect(groove.ring).toBeCloseTo(0.75);
  });

  it('jackpot adds one level, and never passes the top', () => {
    const groove = new Groove();
    groove.jackpot();
    expect(groove.level).toBe(2);
    for (let i = 0; i < MAX_GROOVE_LEVEL * 2; i++) groove.jackpot();
    expect(groove.level).toBe(MAX_GROOVE_LEVEL);
  });

  it('emits levelUp and levelDown only when the level really changes', () => {
    const groove = new Groove();
    const seen: string[] = [];
    groove.on('levelUp', () => seen.push(`up${groove.level}`));
    groove.on('levelDown', () => seen.push(`down${groove.level}`));
    groove.update(GROOVE_LEVEL_MS, 2, 2);
    groove.dropOut();
    groove.dropOut(); // already 1: silent
    groove.jackpot();
    expect(seen).toEqual(['up2', 'down1', 'up2']);
  });

  it('reset returns to level 1', () => {
    const groove = new Groove();
    groove.jackpot();
    groove.reset();
    expect(groove.level).toBe(1);
    expect(groove.ring).toBe(0);
  });
});
