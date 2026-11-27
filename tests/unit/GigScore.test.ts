/** GigScore unit tests — pay ticks, pay by speed, multiplier, stars locked in by coin targets. */

import { describe, expect, it, vi } from 'vitest';

import { SpinnerState } from '../../src/entities/spinner/spinner.types';
import { GigScore, PAY_TICK_MS, payFor } from '../../src/scenes/game/GigScore';

/** config.ts pulls in Phaser (which needs a canvas), and GigScore only wants the two canvas sizes. */
vi.mock('../../src/config', () => ({ GAME_WIDTH: 1280, GAME_HEIGHT: 720 }));

function makeScore(targets: readonly [number, number, number] = [10, 20, 40]): {
  score: GigScore;
  float: ReturnType<typeof vi.fn>;
} {
  const float = vi.fn();
  return { score: new GigScore(float, targets), float };
}

describe('payFor', () => {
  it('pays 0 / 1 / 2 / 4 by how fast an instrument spins', () => {
    expect(payFor(SpinnerState.STOPPED)).toBe(0);
    expect(payFor(SpinnerState.SLOW)).toBe(1);
    expect(payFor(SpinnerState.MEDIUM)).toBe(2);
    expect(payFor(SpinnerState.FULL)).toBe(4);
  });
});

describe('GigScore tick', () => {
  it('pays nothing until a whole tick has passed, then the summed pay', () => {
    const { score } = makeScore();
    expect(score.tick(PAY_TICK_MS - 1, [1, 2, 4], 1)).toBe(0);
    expect(score.coins).toBe(0);
    expect(score.tick(1, [1, 2, 4], 1)).toBe(7);
    expect(score.coins).toBe(7);
  });

  it('applies the multiplier and rounds to whole coins', () => {
    const { score } = makeScore();
    expect(score.tick(PAY_TICK_MS, [4, 4], 3)).toBe(24);
    expect(score.tick(PAY_TICK_MS, [1], 1.5)).toBe(2); // 1.5 rounds up
  });

  it('carries the leftover time into the next tick', () => {
    const { score } = makeScore();
    score.tick(PAY_TICK_MS * 0.75, [4], 1);
    expect(score.tick(PAY_TICK_MS * 0.75, [4], 1)).toBe(4);
    expect(score.tick(PAY_TICK_MS * 0.25, [4], 1)).toBe(0);
    expect(score.tick(PAY_TICK_MS * 0.25, [4], 1)).toBe(4);
  });

  it('pays every tick a long frame spans', () => {
    const { score } = makeScore();
    expect(score.tick(PAY_TICK_MS * 3, [2], 1)).toBe(6);
  });

  it('pays nothing for an empty or stopped band', () => {
    const { score } = makeScore();
    expect(score.tick(PAY_TICK_MS, [], 5)).toBe(0);
    expect(score.tick(PAY_TICK_MS, [0, 0], 5)).toBe(0);
  });
});

describe('GigScore stars', () => {
  it('locks in a star as each target is passed, calling out the rating once', () => {
    const { score, float } = makeScore([10, 20, 40]);
    score.tick(PAY_TICK_MS, [9], 1);
    expect(score.stars).toBe(0);
    score.tick(PAY_TICK_MS, [1], 1); // 10
    expect(score.stars).toBe(1);
    expect(float).toHaveBeenCalledTimes(1);
    expect(float.mock.calls[0]?.[2]).toBe('ONE STAR!');
    score.tick(PAY_TICK_MS, [10], 1); // 20
    expect(score.stars).toBe(2);
    score.tick(PAY_TICK_MS, [20], 1); // 40
    expect(score.stars).toBe(3);
    expect(float.mock.calls.map((c) => c[2])).toEqual(['ONE STAR!', 'TWO STARS!', 'THREE STARS!']);
  });

  it('two targets passed in one go are one call-out for the rating now held', () => {
    const { score, float } = makeScore([10, 20, 40]);
    score.addCoins(25);
    expect(score.stars).toBe(2);
    expect(float).toHaveBeenCalledTimes(1);
    expect(float.mock.calls[0]?.[2]).toBe('TWO STARS!');
  });

  it('never calls out a star twice and never goes past three', () => {
    const { score, float } = makeScore([10, 20, 40]);
    score.addCoins(1000);
    score.addCoins(1000);
    expect(score.stars).toBe(3);
    expect(float).toHaveBeenCalledTimes(1);
  });
});

describe('GigScore reset', () => {
  it("empties the gig and takes the next gig's targets", () => {
    const { score } = makeScore([10, 20, 40]);
    score.addCoins(100);
    score.reset([50, 100, 200]);
    expect(score.coins).toBe(0);
    expect(score.stars).toBe(0);
    expect(score.targets).toEqual([50, 100, 200]);
    score.addCoins(60);
    expect(score.stars).toBe(1);
  });
});

describe('GigScore steal', () => {
  it('takes coins away and says how many it took', () => {
    const { score } = makeScore();
    score.addCoins(8);
    expect(score.steal(5)).toBe(5);
    expect(score.coins).toBe(3);
  });

  it('never takes the total below zero', () => {
    const { score } = makeScore();
    score.addCoins(3);
    expect(score.steal(10)).toBe(3);
    expect(score.coins).toBe(0);
    expect(score.steal(10)).toBe(0);
  });

  it('leaves stars already locked in', () => {
    const { score } = makeScore([10, 20, 40]);
    score.addCoins(25);
    expect(score.stars).toBe(2);
    score.steal(25);
    expect(score.coins).toBe(0);
    expect(score.stars).toBe(2);
  });

  it('lets the coins be earned back past the next target', () => {
    const { score } = makeScore([10, 20, 40]);
    score.addCoins(25);
    score.steal(15);
    score.addCoins(30);
    expect(score.stars).toBe(3);
  });
});
