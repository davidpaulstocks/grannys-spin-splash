import { describe, expect, it } from 'vitest';

import { aimBox, clampToBox, resolveSoftAim } from '../../src/utils/softAim';

// The shipped values of the AIM_* constants in config.ts (which cannot load without Phaser's canvas).
const AIM_BOX_GROW = 0.5;
const AIM_CAPTURE_SCALE = 1.2;
const AIM_CAPTURE_EXTRA = 14;
const AIM_MAGNET_MARGIN = 28;

/** A 4 x 3 wall of instruments of radius 45, 150 px apart. */
const WALL = [0, 1, 2].flatMap((row) =>
  [0, 1, 2, 3].map((col) => ({ id: row * 4 + col, x: 200 + col * 150, y: 120 + row * 150, r: 45 })),
);
const BOX = aimBox(WALL, AIM_BOX_GROW);

const resolve = (x: number, y: number) =>
  resolveSoftAim(
    clampToBox({ x, y }, BOX),
    WALL,
    null,
    AIM_CAPTURE_SCALE,
    AIM_CAPTURE_EXTRA,
    AIM_MAGNET_MARGIN,
  );

describe('aimBox', () => {
  it('is null for an empty wall', () => {
    expect(aimBox([], AIM_BOX_GROW)).toBeNull();
  });

  it('grows the centres by a fraction of the radius', () => {
    const pad = 45 * AIM_BOX_GROW;
    expect(BOX).toEqual({ left: 200 - pad, right: 650 + pad, top: 120 - pad, bottom: 420 + pad });
  });
});

describe('clampToBox', () => {
  it('leaves a point inside the box untouched', () => {
    expect(clampToBox({ x: 300, y: 250 }, BOX)).toEqual({ x: 300, y: 250 });
  });

  it('pulls a point back to the nearest edge', () => {
    const box = { left: 10, top: 20, right: 110, bottom: 220 };
    expect(clampToBox({ x: -50, y: 500 }, box)).toEqual({ x: 10, y: 220 });
    expect(clampToBox({ x: 500, y: -50 }, box)).toEqual({ x: 110, y: 20 });
  });

  it('does nothing without a box', () => {
    expect(clampToBox({ x: 5, y: 6 }, null)).toEqual({ x: 5, y: 6 });
  });
});

describe('the aim cannot leave the band', () => {
  it("a pointer far above each column resolves to that column's top instrument", () => {
    for (let col = 0; col < 4; col++) {
      const result = resolve(200 + col * 150, -400);
      expect(result.snapped).toBe(true);
      expect(result.target?.id).toBe(col);
    }
  });

  it('a pointer far below each column lands on the bottom row', () => {
    for (let col = 0; col < 4; col++) {
      expect(resolve(200 + col * 150, 2000).target?.id).toBe(8 + col);
    }
  });

  it('a pointer far to either side lands on the outer column', () => {
    expect(resolve(-900, 270).target?.id).toBe(4);
    expect(resolve(4000, 270).target?.id).toBe(7);
  });

  it('a pointer inside the box behaves as before', () => {
    const inside = resolve(275, 195);
    expect(inside.snapped).toBe(false);
    expect(inside).toMatchObject({ x: 275, y: 195 });
  });
});
