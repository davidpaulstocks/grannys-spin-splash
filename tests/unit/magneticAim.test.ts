import { describe, expect, it } from 'vitest';

import { resolveMagneticAim, scaleAboutPivot } from '../../src/utils/math';

const A = { id: 1, x: 100, y: 100 };
const B = { id: 2, x: 200, y: 100 };

describe('resolveMagneticAim', () => {
  it('picks the nearest target at any distance', () => {
    const aim = resolveMagneticAim({ x: 1000, y: 900 }, [A, B], null, 28);
    expect(aim.target).toBe(B);
    expect(aim.snapped).toBe(true);
    expect([aim.x, aim.y]).toEqual([200, 100]);
  });

  it('keeps the current target inside the margin', () => {
    // 20 px nearer to B, but A is current and the margin is 28.
    const aim = resolveMagneticAim({ x: 160, y: 100 }, [A, B], 1, 28);
    expect(aim.target).toBe(A);
  });

  it('switches once another is nearer by more than the margin', () => {
    const aim = resolveMagneticAim({ x: 190, y: 100 }, [A, B], 1, 28);
    expect(aim.target).toBe(B);
  });

  it('ignores a current id that is no longer a target', () => {
    const aim = resolveMagneticAim({ x: 110, y: 100 }, [A, B], 99, 28);
    expect(aim.target).toBe(A);
  });

  it('returns the raw point, unsnapped, with no targets', () => {
    const aim = resolveMagneticAim({ x: 5, y: 6 }, [], null, 28);
    expect(aim).toEqual({ x: 5, y: 6, target: null, snapped: false });
  });
});

describe('scaleAboutPivot', () => {
  const pivot = { x: 640, y: 500 };
  it('pushes away from the pivot', () => {
    expect(scaleAboutPivot({ x: 740, y: 400 }, pivot, 1.5, 1280, 720)).toEqual({ x: 790, y: 350 });
  });
  it('is the identity at gain 1', () => {
    expect(scaleAboutPivot({ x: 12, y: 34 }, pivot, 1, 1280, 720)).toEqual({ x: 12, y: 34 });
  });
  it('clamps to the bounds', () => {
    expect(scaleAboutPivot({ x: 640, y: 100 }, pivot, 3, 1280, 720)).toEqual({ x: 640, y: 0 });
  });
});
