/** startRoundAfterAdGate — the shared PLAY / PLAY AGAIN ad gate. */

import { describe, expect, it, vi } from 'vitest';

import { AdManager } from '../../src/systems/AdManager';
import { startRoundAfterAdGate } from '../../src/systems/startRound';

describe('startRoundAfterAdGate', () => {
  it('starts immediately with no break when none is due', async () => {
    const ads = new AdManager({ enabled: true });
    const calls: string[] = [];
    await startRoundAfterAdGate(
      ads,
      { onAdStart: () => calls.push('mute'), onAdEnd: () => calls.push('unmute') },
      () => calls.push('start'),
    );
    expect(calls).toEqual(['start']);
  });

  it('mutes, shows the break, unmutes, THEN starts when a break is due', async () => {
    const ads = new AdManager({ enabled: true });
    ads.recordRunCompleted();
    ads.recordRunCompleted();
    const calls: string[] = [];
    await startRoundAfterAdGate(
      ads,
      { onAdStart: () => calls.push('mute'), onAdEnd: () => calls.push('unmute') },
      () => calls.push('start'),
    );
    expect(calls).toEqual(['mute', 'unmute', 'start']);
    expect(ads.shouldShowCommercialBreak()).toBe(false);
  });

  it('does not start until the break promise resolves', async () => {
    let release!: () => void;
    const ads = {
      shouldShowCommercialBreak: () => true,
      playCommercialBreak: () => new Promise<void>((r) => (release = r)),
    };
    const start = vi.fn();
    const pending = startRoundAfterAdGate(ads, {}, start);
    await Promise.resolve();
    expect(start).not.toHaveBeenCalled();
    release();
    await pending;
    expect(start).toHaveBeenCalledOnce();
  });

  it('still starts the round if the ad call rejects', async () => {
    const ads = {
      shouldShowCommercialBreak: () => true,
      playCommercialBreak: () => Promise.reject(new Error('ad blocker')),
    };
    const start = vi.fn();
    await startRoundAfterAdGate(ads, {}, start);
    expect(start).toHaveBeenCalledOnce();
  });
});
