/** Big Finish rules — bow bonus, cascade timing, full-band check, verdict word, coins to the next star. */

import { describe, expect, it, vi } from 'vitest';

import { SpinnerState } from '../../src/entities/spinner/spinner.types';
import {
  BOW_BONUS_TICKS,
  CASCADE_BUDGET_MS,
  CASCADE_MAX_GAP_MS,
  CASCADE_MIN_GAP_MS,
  bowBonus,
  cascadeGapMs,
  coinsToNextStar,
  finishVerdict,
  isFullBand,
  planBows,
} from '../../src/scenes/game/bigFinishRules';

/** config.ts pulls in Phaser (which needs a canvas), and GigScore only wants the two canvas sizes. */
vi.mock('../../src/config', () => ({ GAME_WIDTH: 1280, GAME_HEIGHT: 720 }));

const { STOPPED, SLOW, MEDIUM, FULL } = SpinnerState;

describe('bowBonus', () => {
  it('is the pay per tick x the bow ticks x groove x gun boost', () => {
    expect(bowBonus(FULL, 1, 1, false)).toBe(4 * BOW_BONUS_TICKS);
    expect(bowBonus(MEDIUM, 3, 1.5, false)).toBe(Math.round(2 * BOW_BONUS_TICKS * 3 * 1.5));
    expect(bowBonus(SLOW, 5, 2, false)).toBe(BOW_BONUS_TICKS * 5 * 2);
  });

  it('pays nothing for a quiet instrument', () => {
    expect(bowBonus(STOPPED, 5, 5, false)).toBe(0);
    expect(bowBonus(STOPPED, 5, 5, true)).toBe(0);
  });

  it('doubles for a full-band finish', () => {
    expect(bowBonus(FULL, 2, 1, true)).toBe(2 * bowBonus(FULL, 2, 1, false));
  });
});

describe('cascadeGapMs', () => {
  it('is 120 ms for a small band and tightens for a big one, never under 60 ms', () => {
    expect(cascadeGapMs(3)).toBe(CASCADE_MAX_GAP_MS);
    expect(cascadeGapMs(12)).toBeLessThan(CASCADE_MAX_GAP_MS);
    expect(cascadeGapMs(100)).toBe(CASCADE_MIN_GAP_MS);
  });

  it('keeps the whole cascade under 1.5 s for every band size on the ladder', () => {
    for (let n = 1; n <= 20; n++) expect((n - 1) * cascadeGapMs(n)).toBeLessThanOrEqual(1500);
    expect(CASCADE_BUDGET_MS).toBeLessThan(1500);
  });
});

describe('isFullBand', () => {
  it('needs a band, all at full speed', () => {
    expect(isFullBand([FULL, FULL, FULL])).toBe(true);
    expect(isFullBand([FULL, MEDIUM, FULL])).toBe(false);
    expect(isFullBand([])).toBe(false);
  });
});

describe('planBows', () => {
  const band = [
    { x: 600, state: FULL },
    { x: 200, state: STOPPED },
    { x: 400, state: MEDIUM },
  ];

  it('bows left to right, each later than the last', () => {
    const plan = planBows(band, 2, 1);
    expect(plan.bows.map((b) => b.index)).toEqual([1, 2, 0]);
    const delays = plan.bows.map((b) => b.delayMs);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    expect(plan.cascadeMs).toBe(delays[delays.length - 1]);
  });

  it('pays a spinning instrument and only dims a quiet one', () => {
    const [first, second, third] = planBows(band, 2, 1).bows;
    expect(first).toMatchObject({ index: 1, spinning: false, bonus: 0 });
    expect(second).toMatchObject({ index: 2, spinning: true, bonus: 2 * BOW_BONUS_TICKS * 2 });
    expect(third).toMatchObject({ index: 0, spinning: true, bonus: 4 * BOW_BONUS_TICKS * 2 });
    expect(planBows(band, 2, 1).fullBand).toBe(false);
  });

  it('doubles every bonus when the whole band is at full speed', () => {
    const full = [
      { x: 1, state: FULL },
      { x: 2, state: FULL },
    ];
    const plan = planBows(full, 1, 1);
    expect(plan.fullBand).toBe(true);
    expect(plan.bows.every((b) => b.bonus === 4 * BOW_BONUS_TICKS * 2)).toBe(true);
  });

  it('climbs the chime across the cascade', () => {
    const wide = Array.from({ length: 10 }, (_, i) => ({ x: i, state: FULL }));
    const levels = planBows(wide, 1, 1).bows.map((b) => b.chimeLevel);
    expect(levels[0]).toBe(1);
    expect(levels[levels.length - 1]).toBe(5);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });
});

describe('finishVerdict', () => {
  it('names each star count', () => {
    expect([0, 1, 2, 3].map(finishVerdict)).toEqual(['Almost!', 'Nice!', 'Great!', 'Superstar!']);
  });
});

describe('coinsToNextStar', () => {
  const targets = [100, 300, 600] as const;

  it('is the gap to the next star not yet held', () => {
    expect(coinsToNextStar(40, targets, 0)).toBe(60);
    expect(coinsToNextStar(250.2, targets, 1)).toBe(50);
  });

  it('is 0 once all three stars are held or the star is already passed', () => {
    expect(coinsToNextStar(900, targets, 3)).toBe(0);
    expect(coinsToNextStar(500, targets, 1)).toBe(0);
  });
});
