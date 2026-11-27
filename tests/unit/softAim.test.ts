import { describe, expect, it } from 'vitest';

import { captureRadius, resolveSoftAim } from '../../src/utils/softAim';

const SCALE = 1.6;
const EXTRA = 36;
const MARGIN = 28;
const A = { id: 1, x: 100, y: 100, r: 45 };
const B = { id: 2, x: 250, y: 100, r: 45 };
const aim = (x: number, y: number, current: number | null = null) =>
  resolveSoftAim({ x, y }, [A, B], current, SCALE, EXTRA, MARGIN);

describe('captureRadius', () => {
  it('is the larger of the scaled radius and radius plus extra', () => {
    expect(captureRadius(45, SCALE, EXTRA)).toBe(81);
    expect(captureRadius(10, SCALE, EXTRA)).toBe(46);
  });
});

describe('resolveSoftAim', () => {
  it('snaps to the centre inside the capture radius', () => {
    const r = aim(100, 100 + 80);
    expect(r).toMatchObject({ x: 100, y: 100, snapped: true });
    expect(r.target?.id).toBe(1);
  });

  it('is exactly the pointer outside every capture radius', () => {
    expect(aim(175, 160)).toEqual({ x: 175, y: 160, target: null, snapped: false });
  });

  it('holds a snap until the pointer is the margin past the capture radius', () => {
    expect(aim(100, 100 + 81 + MARGIN, 1).snapped).toBe(true);
    expect(aim(100, 100 + 81 + MARGIN + 1, 1).snapped).toBe(false);
    // A fresh approach at the same distance does not capture.
    expect(aim(100, 100 + 85, null).snapped).toBe(false);
  });

  it('picks the nearer of two overlapping captures', () => {
    expect(aim(172, 100).target?.id).toBe(1);
    expect(aim(178, 100).target?.id).toBe(2);
  });

  it('keeps the current target until the other is nearer by more than the margin', () => {
    expect(aim(178, 100, 1).target?.id).toBe(1); // 78 vs 72
    expect(aim(240, 100, 1).target?.id).toBe(2); // out of A's hold, B at 10
  });

  it('is free with no targets', () => {
    expect(resolveSoftAim({ x: 5, y: 6 }, [], null, SCALE, EXTRA, MARGIN).snapped).toBe(false);
  });
});
