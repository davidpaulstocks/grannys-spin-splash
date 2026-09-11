/** FrenzyMeter unit tests — 60% / 80% / 100% threshold events (story 1.6). */

import { describe, expect, it } from 'vitest';

import { FrenzyMeter } from '../../src/systems/FrenzyMeter';
import { SpinnerState } from '../../src/types/spinner';

function spinnersAt(fullCount: number, total: number): { state: SpinnerState }[] {
  return Array.from({ length: total }, (_, i) => ({
    state: i < fullCount ? SpinnerState.FULL : SpinnerState.STOPPED,
  }));
}

describe('FrenzyMeter', () => {
  it('emits "miniLow" the instant 60% of spinners reach FULL', () => {
    const meter = new FrenzyMeter();
    const seen: string[] = [];
    meter.on('miniLow', () => seen.push('miniLow'));

    meter.update(spinnersAt(5, 10)); // 50% — below threshold
    expect(seen).toEqual([]);

    meter.update(spinnersAt(6, 10)); // 60% — crosses up
    expect(seen).toEqual(['miniLow']);

    meter.update(spinnersAt(6, 10)); // stays at 60% — no re-fire
    expect(seen).toEqual(['miniLow']);
  });

  it('emits "miniHigh" when 80% of spinners reach FULL', () => {
    const meter = new FrenzyMeter();
    const seen: string[] = [];
    meter.on('miniHigh', () => seen.push('miniHigh'));

    meter.update(spinnersAt(7, 10));
    expect(seen).toEqual([]);

    meter.update(spinnersAt(8, 10));
    expect(seen).toEqual(['miniHigh']);
  });

  it('emits "full" when all spinners reach FULL, and only refires after a genuine dip below 100%', () => {
    const meter = new FrenzyMeter();
    const seen: string[] = [];
    meter.on('full', () => seen.push('full'));

    meter.update(spinnersAt(9, 10));
    expect(seen).toEqual([]);

    meter.update(spinnersAt(10, 10));
    expect(seen).toEqual(['full']);

    // Still reading 100% — this is exactly the GameScene scenario that used
    // to cause an infinite Frenzy loop (locking every spinner at FULL for
    // the bonus window reads as "still full", not "still triggering"). A
    // plain rising-edge check must NOT re-fire here.
    meter.update(spinnersAt(10, 10));
    meter.update(spinnersAt(10, 10));
    expect(seen).toEqual(['full']);

    meter.update(spinnersAt(9, 10)); // a genuine dip below 100%...
    meter.update(spinnersAt(10, 10)); // ...then crosses back up
    expect(seen).toEqual(['full', 'full']);
  });

  it('reset() clears threshold state so events can fire again from a fresh run', () => {
    const meter = new FrenzyMeter();
    meter.update(spinnersAt(10, 10));
    meter.reset();

    const seen: string[] = [];
    meter.on('full', () => seen.push('full'));
    meter.update(spinnersAt(10, 10));
    expect(seen).toEqual(['full']);
  });

  it('does nothing with an empty spinner list', () => {
    const meter = new FrenzyMeter();
    expect(() => meter.update([])).not.toThrow();
  });
});
