/** GigScore unit tests — coin/star rules: stars never fall, each pays once, tiers pay once per spinner, playing instruments tip by the second. */

import { describe, expect, it, vi } from 'vitest';

import { SpinnerState } from '../../src/entities/spinner/spinner.types';
import {
  COINS_PER_LEVEL_UP,
  COINS_PER_STAR,
  GigScore,
  TIP_COINS_PER_PLAYER_SECOND,
} from '../../src/scenes/game/GigScore';

/** config.ts pulls in Phaser (which needs a canvas), and GigScore only wants the two canvas sizes. */
vi.mock('../../src/config', () => ({ GAME_WIDTH: 1280, GAME_HEIGHT: 720 }));

function makeScore(): { score: GigScore; float: ReturnType<typeof vi.fn> } {
  const float = vi.fn();
  return { score: new GigScore(float), float };
}

describe('GigScore stars', () => {
  it('pays COINS_PER_STAR for each star reached, with one call-out for the rating now held', () => {
    const { score, float } = makeScore();
    score.awardStars(2);
    expect(score.stars).toBe(2);
    expect(score.coins).toBe(2 * COINS_PER_STAR);
    // Two stars earned in the same instant are one moment, not two labels overprinting.
    expect(float).toHaveBeenCalledTimes(1);
    score.awardStars(2);
    expect(float).toHaveBeenCalledTimes(1); // nothing new, nothing said
    score.awardStars(3);
    expect(float).toHaveBeenCalledTimes(2);
  });

  it('never decreases, and each star pays only once', () => {
    const { score } = makeScore();
    score.awardStars(3);
    score.awardStars(1);
    score.awardStars(3);
    expect(score.stars).toBe(3);
    expect(score.coins).toBe(3 * COINS_PER_STAR);
  });
});

describe('GigScore level-up coins', () => {
  it('pays coins times the multiplier the first time a spinner reaches a tier', () => {
    const { score } = makeScore();
    expect(score.levelUp(1, SpinnerState.SLOW, 3)).toBe(COINS_PER_LEVEL_UP * 3);
    expect(score.coins).toBe(COINS_PER_LEVEL_UP * 3);
  });

  it('pays nothing for re-climbing a tier that spinner already reached', () => {
    const { score } = makeScore();
    score.levelUp(1, SpinnerState.SLOW, 1);
    score.levelUp(1, SpinnerState.MEDIUM, 1);
    const before = score.coins;
    expect(score.levelUp(1, SpinnerState.SLOW, 1)).toBe(0);
    expect(score.levelUp(1, SpinnerState.MEDIUM, 1)).toBe(0);
    expect(score.coins).toBe(before);
  });

  it('tracks each spinner independently', () => {
    const { score } = makeScore();
    score.levelUp(1, SpinnerState.FULL, 1);
    expect(score.levelUp(2, SpinnerState.FULL, 1)).toBe(COINS_PER_LEVEL_UP);
  });

  it('forgets tiers on reset so a new gig pays again', () => {
    const { score } = makeScore();
    score.levelUp(1, SpinnerState.FULL, 1);
    score.reset();
    expect(score.coins).toBe(0);
    expect(score.levelUp(1, SpinnerState.FULL, 1)).toBe(COINS_PER_LEVEL_UP);
  });

  it('floats a labelled "+N" only when something was paid', () => {
    const { score, float } = makeScore();
    score.showCoinText(0, 1, 10, 20);
    expect(float).not.toHaveBeenCalled();
    score.showCoinText(2, 2, 10, 20);
    expect(float).toHaveBeenCalledWith(10, 20, '+2 ×2', expect.any(String));
  });
});

describe('GigScore tips', () => {
  it('pays every playing instrument by the second', () => {
    const { score } = makeScore();
    const paid = score.payTips(2000, 4);
    expect(paid).toBe(Math.floor(2 * 4 * TIP_COINS_PER_PLAYER_SECOND));
    expect(score.coins).toBe(paid);
  });

  it('carries a part-coin across frames', () => {
    const { score } = makeScore();
    const frameMs = 1000 / TIP_COINS_PER_PLAYER_SECOND / 2;
    expect(score.payTips(frameMs, 1)).toBe(0);
    expect(score.payTips(frameMs, 1)).toBe(1);
    expect(score.coins).toBe(1);
  });

  it('pays nothing when nothing is playing', () => {
    const { score } = makeScore();
    expect(score.payTips(10_000, 0)).toBe(0);
    expect(score.coins).toBe(0);
  });
});
