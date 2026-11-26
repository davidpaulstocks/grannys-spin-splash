/** Shared pieces for the visitor drawings: the outline weights and two helpers. */

import type Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';

export type Gfx = Phaser.GameObjects.Graphics;

export const OUTLINE = 4;
export const THIN = 2;

export function blobs(
  g: Gfx,
  discs: readonly (readonly [number, number, number])[],
  fill: number,
): void {
  g.fillStyle(COLOUR.ink, 1);
  for (const [x, y, r] of discs) g.fillCircle(x, y, r + OUTLINE / 2 + 1);
  g.fillStyle(fill, 1);
  for (const [x, y, r] of discs) g.fillCircle(x, y, r);
}

export function inked(g: Gfx, fill: number): void {
  g.fillStyle(fill, 1);
  g.lineStyle(OUTLINE, COLOUR.ink, 1);
}
