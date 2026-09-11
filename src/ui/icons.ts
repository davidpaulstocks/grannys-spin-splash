/**
 * Custom procedural icons — no emoji in user-facing UI (CLAUDE.md §7.3
 * rule 8, story 2.4). Just the two the carousel actually needs so far
 * (star for cost, padlock for locked items); grows as real need shows up
 * rather than pre-building a full SVG sprite sheet nothing uses yet.
 */

import Phaser from 'phaser';

/** Draws a 5-point star centred on (0, 0) into an existing Graphics object — caller positions/clears it. */
export function drawStarIcon(g: Phaser.GameObjects.Graphics, radius: number, colour: number): void {
  const innerRadius = radius * 0.45;
  g.fillStyle(colour, 1);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? radius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}

/** Draws a simple padlock silhouette centred on (0, 0) — body + shackle arc. */
export function drawLockIcon(g: Phaser.GameObjects.Graphics, size: number, colour: number): void {
  const bodyWidth = size;
  const bodyHeight = size * 0.75;
  const shackleRadius = size * 0.32;

  g.lineStyle(size * 0.14, colour, 1);
  g.beginPath();
  g.arc(0, -bodyHeight / 2, shackleRadius, Math.PI, 0, false);
  g.strokePath();

  g.fillStyle(colour, 1);
  g.fillRoundedRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight, size * 0.12);
}
