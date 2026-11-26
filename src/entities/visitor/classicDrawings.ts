/**
 * Procedural draw routines for each obstacle kind — simple, round,
 * friendly shapes matching CLAUDE.md §5.4/§5.9 (no sharp corners, single
 * light source, kid-friendly silhouettes over detail). Module-internal to
 * Obstacle.ts.
 */

import Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';

const STROKE_WIDTH = 4;

/** Cat — sitting (calm, guarding its spinner) or fleeing (stretched, mid-dash) after being shooed. */
export function drawCat(g: Phaser.GameObjects.Graphics, fleeing: boolean): void {
  g.clear();
  const bodyColour = COLOUR.softSlate;
  const stretch = fleeing ? 1.35 : 1;

  g.fillStyle(bodyColour, 1);
  g.lineStyle(STROKE_WIDTH, COLOUR.ink, 1);
  // Body.
  g.fillEllipse(0, 6, 30 * stretch, 20);
  g.strokeEllipse(0, 6, 30 * stretch, 20);
  // Head.
  g.fillCircle(fleeing ? 18 : 0, -8, 15);
  g.strokeCircle(fleeing ? 18 : 0, -8, 15);
  // Ears.
  const earX = fleeing ? 18 : 0;
  g.fillTriangle(earX - 12, -18, earX - 4, -30, earX - 2, -16);
  g.fillTriangle(earX + 4, -18, earX + 10, -30, earX + 12, -16);
  g.strokeTriangle(earX - 12, -18, earX - 4, -30, earX - 2, -16);
  g.strokeTriangle(earX + 4, -18, earX + 10, -30, earX + 12, -16);
  // Tail curl.
  g.lineStyle(STROKE_WIDTH - 1, COLOUR.ink, 1);
  g.beginPath();
  const tailX = fleeing ? -20 : -16;
  g.moveTo(tailX, 10);
  g.lineTo(tailX - 10, -4);
  g.strokePath();
}

/** Umbrella — closed (safe to shoot past) or open (blocks water falling on it). */
export function drawUmbrella(g: Phaser.GameObjects.Graphics, open: boolean): void {
  g.clear();
  g.lineStyle(STROKE_WIDTH - 1, COLOUR.ink, 1);
  g.beginPath();
  g.moveTo(0, open ? -6 : -30);
  g.lineTo(0, 28);
  g.strokePath();

  if (!open) return;

  const canopyRadius = 40;
  g.fillStyle(COLOUR.waterBlue, 1);
  g.lineStyle(STROKE_WIDTH, COLOUR.ink, 1);
  g.beginPath();
  g.arc(0, -6, canopyRadius, Math.PI, 0, false);
  g.lineTo(canopyRadius, -6);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Scalloped hem — small half-circle notches along the bottom edge.
  g.fillStyle(COLOUR.ink, 1);
  for (let i = 0; i < 5; i++) {
    const x = -canopyRadius + (canopyRadius * 2 * (i + 0.5)) / 5;
    g.fillCircle(x, -6, 4);
  }
}

/** Duck — floats and bobs; `facingRight` flips its beak direction. */
export function drawDuck(g: Phaser.GameObjects.Graphics, facingRight: boolean): void {
  g.clear();
  const dir = facingRight ? 1 : -1;
  g.fillStyle(COLOUR.sunnyGold, 1);
  g.lineStyle(STROKE_WIDTH - 1, COLOUR.ink, 1);
  g.fillEllipse(0, 4, 34, 22);
  g.strokeEllipse(0, 4, 34, 22);
  g.fillCircle(dir * 14, -8, 13);
  g.strokeCircle(dir * 14, -8, 13);
  g.fillStyle(COLOUR.heatOrange, 1);
  g.fillTriangle(dir * 22, -8, dir * 32, -5, dir * 22, -2);
}
