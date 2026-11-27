import { describe, expect, it } from 'vitest';

import {
  SPINNER_HIT_RING_PADDING,
  pickVisitorLock,
  resolveShotLock,
  spinnersForShot,
} from '../../src/utils/shotLock';

interface Disc {
  id: string;
  x: number;
  y: number;
  r: number;
}

const GRANNY = { x: 640, y: 536 };
const RADIUS = 45;
const ROW_XS = [243, 508, 773, 1038];
const WALL: Disc[] = [220, 400].flatMap((y) =>
  ROW_XS.map((x) => ({ id: `${x},${y}`, x, y, r: RADIUS })),
);

/** Flies a straight shot from Granny to `aim` and returns what it meets first. */
function firstHit(
  aim: { x: number; y: number },
  spinners: readonly Disc[],
  visitor: { x: number; y: number; r: number } | null,
): string | null {
  const len = Math.hypot(aim.x - GRANNY.x, aim.y - GRANNY.y);
  const steps = Math.ceil(len);
  for (let i = 0; i <= steps; i++) {
    const x = GRANNY.x + ((aim.x - GRANNY.x) * i) / steps;
    const y = GRANNY.y + ((aim.y - GRANNY.y) * i) / steps;
    // Visitors are tested first, as WaterCollisions does.
    if (visitor && Math.hypot(x - visitor.x, y - visitor.y) < visitor.r) return 'visitor';
    for (const s of spinners) {
      if (Math.hypot(x - s.x, y - s.y) < s.r + SPINNER_HIT_RING_PADDING) return s.id;
    }
  }
  return null;
}

describe('a shot aimed at a visitor', () => {
  const blockers = [243, 1038].map((x) => ({ x, y: 310, aimRadius: 90, r: 90 }));

  it('is spent on a front-row instrument when it is free (the bug)', () => {
    const grazed = blockers.map((b) => firstHit(b, spinnersForShot('free', null, WALL), b));
    // At least one of the two outer blockers is shadowed by a nearer instrument on the line.
    expect(grazed.some((hit) => hit !== 'visitor' && hit !== null)).toBe(true);
  });

  it.each(blockers)('reaches the blocker at x=$x when locked onto it', (b) => {
    const lock = resolveShotLock(true, false);
    expect(lock).toBe('visitor');
    expect(spinnersForShot(lock, null, WALL)).toEqual([]);
    expect(firstHit(b, spinnersForShot(lock, null, WALL), b)).toBe('visitor');
  });
});

describe('a shot aimed at an instrument', () => {
  it('is only ever tested against that instrument, whatever is in front', () => {
    const back = WALL.find((s) => s.id === '1038,220') as Disc;
    const lock = resolveShotLock(false, true);
    expect(spinnersForShot(lock, back, WALL)).toEqual([back]);
    expect(firstHit(back, spinnersForShot(lock, back, WALL), null)).toBe(back.id);
  });

  it('a loose shot may hit any instrument', () => {
    expect(spinnersForShot(resolveShotLock(false, false), null, WALL)).toBe(WALL);
  });
});

describe('pickVisitorLock', () => {
  const near = { x: 243, y: 310, aimRadius: 90 };
  const far = { x: 1038, y: 310, aimRadius: 90 };

  it('returns the visitor whose ring holds the aim point', () => {
    expect(pickVisitorLock(260, 330, [far, near], 8)).toBe(near);
  });

  it('returns null when the aim is on no visitor', () => {
    expect(pickVisitorLock(640, 100, [far, near], 8)).toBeNull();
    expect(pickVisitorLock(640, 100, [], 8)).toBeNull();
  });

  it('picks the nearer of two overlapping rings', () => {
    const a = { x: 300, y: 300, aimRadius: 90 };
    const b = { x: 340, y: 300, aimRadius: 90 };
    expect(pickVisitorLock(330, 300, [a, b], 0)).toBe(b);
  });
});
