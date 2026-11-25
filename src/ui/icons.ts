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

/**
 * Draws a rounded "play" glyph (a filmstrip-free stand-in for a video icon)
 * centred on (0, 0) — a ring with a play triangle inside. CLAUDE.md §11.3
 * requires every rewarded-ad button to "include a video icon prominently,"
 * and §7.3 rule 8 bans emoji as UI, so this is the custom equivalent of the
 * 🎬 the spec names.
 */
export function drawPlayIcon(g: Phaser.GameObjects.Graphics, radius: number, colour: number): void {
  g.lineStyle(radius * 0.16, colour, 1);
  g.strokeCircle(0, 0, radius);
  g.fillStyle(colour, 1);
  const triRadius = radius * 0.5;
  g.fillTriangle(-triRadius * 0.6, -triRadius, -triRadius * 0.6, triRadius, triRadius, 0);
}

/** Draws a gold coin centred on (0, 0): rim, face and a highlight, so it reads as money at any size. */
export function drawCoinIcon(
  g: Phaser.GameObjects.Graphics,
  radius: number,
  face: number,
  rim: number,
): void {
  g.fillStyle(rim, 1);
  g.fillCircle(0, 0, radius);
  g.fillStyle(face, 1);
  g.fillCircle(0, 0, radius * 0.78);
  g.fillStyle(0xffffff, 0.55);
  g.fillEllipse(-radius * 0.28, -radius * 0.3, radius * 0.42, radius * 0.24);
}

/** A house: for "back to the home screen". Fits a `size` x `size` box centred on (0, 0). */
export function drawHomeIcon(g: Phaser.GameObjects.Graphics, size: number, colour: number): void {
  const half = size / 2;
  g.fillStyle(colour, 1);
  g.fillTriangle(-half * 1.1, -half * 0.05, 0, -half, half * 1.1, -half * 0.05);
  g.fillRect(-half * 0.72, -half * 0.05, half * 1.44, half * 0.95);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(-half * 0.2, half * 0.32, half * 0.4, half * 0.58);
}

/** A circular arrow: for "play this again". */
export function drawRetryIcon(g: Phaser.GameObjects.Graphics, size: number, colour: number): void {
  const radius = size * 0.4;
  g.lineStyle(size * 0.17, colour, 1);
  g.beginPath();
  g.arc(0, 0, radius, Phaser.Math.DegToRad(-50), Phaser.Math.DegToRad(230), false);
  g.strokePath();
  // Arrowhead at the open end of the arc, pointing along it.
  const tipAngle = Phaser.Math.DegToRad(-50);
  const tipX = Math.cos(tipAngle) * radius;
  const tipY = Math.sin(tipAngle) * radius;
  const head = size * 0.26;
  g.fillStyle(colour, 1);
  g.fillTriangle(
    tipX - head,
    tipY - head * 0.25,
    tipX + head * 0.55,
    tipY - head * 0.7,
    tipX + head * 0.2,
    tipY + head * 0.75,
  );
}

/** A left-pointing arrow: for "back". */
export function drawBackIcon(g: Phaser.GameObjects.Graphics, size: number, colour: number): void {
  const half = size / 2;
  g.fillStyle(colour, 1);
  g.fillTriangle(-half, 0, half * 0.1, -half * 0.85, half * 0.1, half * 0.85);
  g.fillRect(half * 0.05, -half * 0.3, half * 0.9, half * 0.6);
}

/** A flag on a pole: for the tour map. */
export function drawTourIcon(g: Phaser.GameObjects.Graphics, size: number, colour: number): void {
  const half = size / 2;
  g.fillStyle(colour, 1);
  g.fillRect(-half * 0.62, -half, size * 0.14, size);
  g.fillTriangle(-half * 0.34, -half * 0.95, half * 0.95, -half * 0.45, -half * 0.34, half * 0.05);
}

/** A shopping bag: for the shop. */
export function drawShopIcon(g: Phaser.GameObjects.Graphics, size: number, colour: number): void {
  const half = size / 2;
  g.fillStyle(colour, 1);
  g.fillRoundedRect(-half * 0.85, -half * 0.35, size * 0.85, size * 0.68, size * 0.1);
  g.lineStyle(size * 0.13, colour, 1);
  g.beginPath();
  g.arc(0, -half * 0.35, half * 0.42, Math.PI, 0, false);
  g.strokePath();
}
