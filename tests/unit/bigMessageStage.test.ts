import { describe, expect, it } from 'vitest';

import { STAGE_PRIORITY as P, takesStage } from '../../src/scenes/game/stageRules';
import { boxesOverlap, placeClearOfStage, STAGE_AVOID_MARGIN } from '../../src/ui/stageBounds';

describe('takesStage', () => {
  it('an empty stage takes anything', () => {
    expect(takesStage(null, P.other, 'drop')).toBe(true);
  });

  it('a higher priority replaces a lower one', () => {
    expect(takesStage(P.star, P.frenzy, 'drop')).toBe(true);
    expect(takesStage(P.frenzy, P.finish, 'drop')).toBe(true);
    expect(takesStage(P.finish, P.verdict, 'drop')).toBe(true);
  });

  it('a lower priority is dropped', () => {
    expect(takesStage(P.frenzy, P.countdown, 'replace')).toBe(false);
    expect(takesStage(P.finish, P.frenzy, 'replace')).toBe(false);
    expect(takesStage(P.countdown, P.star, 'replace')).toBe(false);
  });

  it('an equal priority follows its tie rule', () => {
    expect(takesStage(P.countdown, P.countdown, 'replace')).toBe(true);
    expect(takesStage(P.other, P.other, 'drop')).toBe(false);
  });

  it('orders the priorities as specified', () => {
    expect(P.verdict).toBeGreaterThan(P.finish);
    expect(P.finish).toBeGreaterThan(P.frenzy);
    expect(P.frenzy).toBeGreaterThan(P.countIn);
    expect(P.countIn).toBeGreaterThan(P.countdown);
    expect(P.countdown).toBeGreaterThan(P.star);
    expect(P.star).toBeGreaterThan(P.other);
  });

  it('after the final whistle only the finish and the verdict may speak', () => {
    expect(takesStage(null, P.star, 'replace', P.finish)).toBe(false);
    expect(takesStage(null, P.frenzy, 'replace', P.finish)).toBe(false);
    expect(takesStage(null, P.countdown, 'replace', P.finish)).toBe(false);
    expect(takesStage(null, P.finish, 'replace', P.finish)).toBe(true);
    expect(takesStage(P.finish, P.verdict, 'replace', P.finish)).toBe(true);
  });
});

describe('placeClearOfStage', () => {
  const STAGE = { left: 400, right: 880, top: 260, bottom: 340 };

  it('leaves a text alone when no message is up', () => {
    expect(placeClearOfStage(640, 300, 30, 12, 54, null)).toEqual({ y: 300, moved: false });
  });

  it('leaves a text alone when it is clear of the message', () => {
    expect(placeClearOfStage(100, 300, 30, 12, 54, STAGE).moved).toBe(false);
    expect(placeClearOfStage(640, 600, 30, 12, 54, STAGE).moved).toBe(false);
  });

  it('moves a text that would land on the message to just above it, keeping its x', () => {
    const placed = placeClearOfStage(640, 300, 30, 12, 54, STAGE, 0);
    expect(placed.moved).toBe(true);
    const path = { left: 610, right: 670, top: placed.y - 54 - 12, bottom: placed.y + 12 };
    expect(boxesOverlap(path, STAGE)).toBe(false);
    expect(placed.y + 12 + STAGE_AVOID_MARGIN).toBeLessThanOrEqual(STAGE.top);
  });

  it('goes below the message when there is no room above', () => {
    const tall = { left: 400, right: 880, top: 60, bottom: 340 };
    const placed = placeClearOfStage(640, 200, 30, 12, 54, tall, 0);
    expect(placed.moved).toBe(true);
    expect(placed.y).toBeGreaterThan(tall.bottom);
  });
});
