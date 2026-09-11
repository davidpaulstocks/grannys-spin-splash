/** ComboTracker unit tests — combo count + 2s decay window + multiplier. */

import { describe, expect, it } from 'vitest';

import { ComboTracker } from '../../src/systems/ComboTracker';

describe('ComboTracker', () => {
  it('increments combo on consecutive hits on different spinners', () => {
    const combo = new ComboTracker();
    expect(combo.registerHit(1)).toBe(1);
    expect(combo.registerHit(2)).toBe(2);
    expect(combo.registerHit(3)).toBe(3);
  });

  it('caps the combo at 5', () => {
    const combo = new ComboTracker();
    for (let i = 0; i < 10; i++) combo.registerHit(i);
    expect(combo.combo).toBe(5);
  });

  it('holds the combo steady (does not increment) when re-hitting the same spinner', () => {
    const combo = new ComboTracker();
    combo.registerHit(1);
    combo.registerHit(2);
    expect(combo.registerHit(2)).toBe(2);
    expect(combo.registerHit(2)).toBe(2);
  });

  it('resets combo to 1 after the 2-second decay window elapses', () => {
    const combo = new ComboTracker();
    combo.registerHit(1);
    combo.registerHit(2);
    expect(combo.combo).toBe(2);

    combo.update(1999);
    expect(combo.combo).toBe(2);

    combo.update(2);
    expect(combo.combo).toBe(1);
  });

  it('does not reset the window on a repeat hit of the same spinner (prototype-faithful)', () => {
    const combo = new ComboTracker();
    combo.registerHit(1);
    combo.registerHit(2); // combo=2, timer resets to 2000ms
    combo.update(1500);
    combo.registerHit(2); // same spinner again — timer is NOT refreshed
    combo.update(600); // 1500 + 600 = 2100ms since the last refresh
    expect(combo.combo).toBe(1);
  });

  it('multiplies stars by the current combo, floored at 1 even before any hit', () => {
    const combo = new ComboTracker();
    expect(combo.multiplier).toBe(1);
    combo.registerHit(1);
    combo.registerHit(2);
    combo.registerHit(3);
    expect(combo.multiplier).toBe(3);
  });

  it('reset() clears combo, timer, and last-hit tracking', () => {
    const combo = new ComboTracker();
    combo.registerHit(1);
    combo.registerHit(2);
    combo.reset();
    expect(combo.combo).toBe(0);
    expect(combo.multiplier).toBe(1);
    // A hit right after reset behaves like a fresh run, not a repeat of spinner 2.
    expect(combo.registerHit(2)).toBe(1);
  });
});
