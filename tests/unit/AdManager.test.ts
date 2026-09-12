/** AdManager unit tests — commercial-break run-cadence logic (story 6.5). */

import { describe, expect, it } from 'vitest';

import { AdManager } from '../../src/systems/AdManager';

describe('AdManager', () => {
  it('does not want a commercial break before any runs complete', () => {
    const ads = new AdManager({ enabled: true });
    expect(ads.shouldShowCommercialBreak()).toBe(false);
  });

  it('wants a commercial break only on every 2nd completed run (CLAUDE.md §11.1)', () => {
    const ads = new AdManager({ enabled: true });
    ads.recordRunCompleted();
    expect(ads.shouldShowCommercialBreak()).toBe(false);

    ads.recordRunCompleted();
    expect(ads.shouldShowCommercialBreak()).toBe(true);
  });

  it('playCommercialBreak() resets the run counter', async () => {
    const ads = new AdManager({ enabled: true });
    ads.recordRunCompleted();
    ads.recordRunCompleted();
    expect(ads.shouldShowCommercialBreak()).toBe(true);

    await ads.playCommercialBreak();
    expect(ads.shouldShowCommercialBreak()).toBe(false);
  });

  it('playCommercialBreak() calls onAdStart before the break and onAdEnd after', async () => {
    const ads = new AdManager({ enabled: true });
    const calls: string[] = [];
    await ads.playCommercialBreak({
      onAdStart: () => calls.push('start'),
      onAdEnd: () => calls.push('end'),
    });
    expect(calls).toEqual(['start', 'end']);
  });

  it('playCommercialBreak() works with no hooks supplied', async () => {
    const ads = new AdManager({ enabled: true });
    await expect(ads.playCommercialBreak()).resolves.toBeUndefined();
  });

  it('playRewarded() calls hooks around the ad and returns the SDK result', async () => {
    const ads = new AdManager({ enabled: true });
    const calls: string[] = [];
    const result = await ads.playRewarded('medium', {
      onAdStart: () => calls.push('start'),
      onAdEnd: () => calls.push('end'),
    });
    // No PokiSDK on window in this test environment — poki.ts's wrapper resolves false, which is exactly the "not watched" contract callers must handle.
    expect(result).toBe(false);
    expect(calls).toEqual(['start', 'end']);
  });
});
