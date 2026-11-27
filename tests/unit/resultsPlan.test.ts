import { describe, expect, it } from 'vitest';

import { planMain, type MainPlanInput } from '../../src/scenes/results/resultsPlan';
import { gigTitle, starsStillLine, starsToWinLine } from '../../src/ui/gigLines';

const garden = (gig: number) => ({ venueId: 'garden', gig });

function input(over: Partial<MainPlanInput>): MainPlanInput {
  return {
    passed: true,
    here: garden(2),
    onward: garden(3),
    stars: [3, 3, 1, 0, 0, 0, 0, 0],
    recommended: 3,
    joins: 'The Cello joins!',
    ...over,
  };
}

describe('the results main button', () => {
  it('is TRY AGAIN, here, after a miss', () => {
    const plan = planMain(input({ passed: false, onward: null }));
    expect(plan).toMatchObject({ label: 'TRY AGAIN', target: garden(2), line: null });
    expect(plan.showRetry).toBe(false);
  });

  it('points at a gig with stars to win after a miss on a gig that already has all three', () => {
    const plan = planMain(
      input({ passed: false, onward: null, stars: [3, 3, 3, 1, 0, 0, 0, 0], recommended: 4 }),
    );
    expect(plan).toMatchObject({ label: 'GIG 5', target: garden(4), showRetry: true });
    expect(plan.line).toContain('gig 5');
  });

  it('is NEXT GIG when the next gig up the ladder is unplayed', () => {
    const plan = planMain(input({}));
    expect(plan).toMatchObject({ label: 'NEXT GIG', target: garden(3), line: 'The Cello joins!' });
    expect(plan.showRetry).toBe(true);
  });

  it('sends a replay to the recommended gig, saying what is still to win there', () => {
    const plan = planMain(
      input({
        here: garden(0),
        onward: garden(1),
        stars: [3, 3, 3, 1, 3, 3, 3, 3],
        recommended: 3,
      }),
    );
    expect(plan).toMatchObject({
      label: 'GIG 4',
      target: garden(3),
      line: '2 stars still to win in gig 4',
    });
    expect(plan.showRetry).toBe(true);
  });

  it('stays TRY AGAIN when this gig is the one with stars left', () => {
    const plan = planMain(
      input({
        here: garden(1),
        onward: garden(2),
        stars: [3, 2, 3, 3, 3, 3, 3, 3],
        recommended: 1,
      }),
    );
    expect(plan).toMatchObject({
      label: 'TRY AGAIN',
      target: garden(1),
      line: '1 star still to win in gig 2',
    });
    expect(plan.showRetry).toBe(false);
  });

  it('goes on to the next venue after the Grand Concert', () => {
    const next = { venueId: 'workshop', gig: 0 };
    const plan = planMain(
      input({
        here: garden(7),
        onward: next,
        stars: Array(8).fill(3),
        recommended: null,
        joins: 'Next stop: Workshop!',
      }),
    );
    expect(plan).toMatchObject({ label: 'NEXT GIG', target: next, line: 'Next stop: Workshop!' });
  });

  it('is PLAY AGAIN when the whole venue is three stars and nothing else is open', () => {
    const plan = planMain(
      input({ here: garden(7), onward: null, stars: Array(8).fill(3), recommended: null }),
    );
    expect(plan).toMatchObject({ label: 'PLAY AGAIN', target: garden(7), line: null });
  });
});

describe('gig lines', () => {
  it('titles a gig and its finale', () => {
    expect(gigTitle(2)).toBe('Gig 3 of 8');
    expect(gigTitle(7)).toBe('The Grand Concert');
  });

  it('counts the stars left with the right plural', () => {
    expect(starsToWinLine(0)).toBe('3 stars to win');
    expect(starsToWinLine(2)).toBe('1 star to win');
    expect(starsToWinLine(3)).toBe('all 3 stars');
    expect(starsStillLine(4, 1)).toBe('2 stars still to win in gig 5');
  });
});
