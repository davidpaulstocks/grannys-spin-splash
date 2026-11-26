/** Stand-in drawings for the six treats (see visitorDrawings.ts), facing right around the origin. */

import Phaser from 'phaser';

import { COLOUR, shade } from '../../utils/colour';
import { blobs, inked, OUTLINE, THIN, type Gfx } from './drawKit';

export function drawWateringCan(g: Gfx): void {
  g.fillStyle(COLOUR.sunnyGold, 0.28);
  g.fillCircle(0, 0, 54);
  g.lineStyle(10, COLOUR.ink, 1);
  g.lineBetween(20, 0, 46, -24);
  g.lineStyle(5, COLOUR.sunnyGold, 1);
  g.lineBetween(20, 0, 46, -24);
  g.lineStyle(14, COLOUR.ink, 1);
  g.beginPath();
  g.arc(-30, -2, 18, Math.PI * 0.5, Math.PI * 1.5, false);
  g.strokePath();
  g.lineStyle(7, COLOUR.sunnyGold, 1);
  g.beginPath();
  g.arc(-30, -2, 18, Math.PI * 0.5, Math.PI * 1.5, false);
  g.strokePath();
  inked(g, COLOUR.sunnyGold);
  g.fillRoundedRect(-30, -18, 54, 42, 12);
  g.strokeRoundedRect(-30, -18, 54, 42, 12);
  g.fillStyle(COLOUR.heatOrange, 1);
  g.fillEllipse(48, -27, 16, 20);
  g.fillStyle(COLOUR.cloud, 0.7);
  g.fillRoundedRect(-22, -10, 10, 24, 5);
}

export function drawCupcake(g: Gfx): void {
  inked(g, COLOUR.mintGreen);
  g.fillPoints(
    [
      new Phaser.Geom.Point(-28, -2),
      new Phaser.Geom.Point(28, -2),
      new Phaser.Geom.Point(19, 36),
      new Phaser.Geom.Point(-19, 36),
    ],
    true,
  );
  g.lineStyle(THIN, COLOUR.ink, 1);
  g.lineBetween(-14, 2, -10, 34);
  g.lineBetween(0, 2, 0, 34);
  g.lineBetween(14, 2, 10, 34);
  blobs(
    g,
    [
      [-14, -10, 18],
      [14, -10, 18],
      [0, -14, 20],
      [0, -32, 16],
    ],
    COLOUR.grannyPink,
  );
  blobs(g, [[0, -46, 7]], COLOUR.heatOrange);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillRect(-12, -16, 6, 3);
  g.fillRect(8, -24, 6, 3);
  g.fillRect(-2, -34, 6, 3);
}

export function drawPiggyBank(g: Gfx): void {
  const dark = shade(COLOUR.grannyPink, 0.82);
  g.lineStyle(OUTLINE - 1, COLOUR.ink, 1);
  g.beginPath();
  g.moveTo(-42, 2);
  g.lineTo(-54, -8);
  g.lineTo(-48, -16);
  g.strokePath();
  inked(g, COLOUR.grannyPink);
  g.fillRoundedRect(-30, 28, 18, 20, 7);
  g.strokeRoundedRect(-30, 28, 18, 20, 7);
  g.fillRoundedRect(14, 28, 18, 20, 7);
  g.strokeRoundedRect(14, 28, 18, 20, 7);
  g.fillEllipse(0, 6, 88, 66);
  g.strokeEllipse(0, 6, 88, 66);
  g.fillTriangle(16, -22, 30, -44, 38, -18);
  g.strokeTriangle(16, -22, 30, -44, 38, -18);
  inked(g, dark);
  g.fillEllipse(42, 8, 24, 22);
  g.strokeEllipse(42, 8, 24, 22);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(39, 8, 2.5);
  g.fillCircle(46, 8, 2.5);
  g.fillCircle(24, -8, 3.5);
  g.lineStyle(OUTLINE, COLOUR.ink, 1);
  g.lineBetween(-12, -26, 10, -26);
  blobs(g, [[0, -38, 11]], COLOUR.sunnyGold);
}

export function drawCandyfloss(g: Gfx): void {
  inked(g, COLOUR.cloud);
  g.fillRoundedRect(-4, 6, 8, 50, 3);
  g.strokeRoundedRect(-4, 6, 8, 50, 3);
  blobs(
    g,
    [
      [-16, -6, 22],
      [18, -8, 22],
      [0, 2, 24],
    ],
    COLOUR.waterBlue,
  );
  blobs(
    g,
    [
      [-12, -26, 20],
      [14, -28, 20],
      [0, -36, 20],
    ],
    COLOUR.grannyPink,
  );
  g.fillStyle(COLOUR.cloud, 0.6);
  g.fillCircle(-10, -36, 5);
}

export function drawTrophy(g: Gfx): void {
  g.lineStyle(14, COLOUR.ink, 1);
  g.strokeCircle(-34, -18, 12);
  g.strokeCircle(34, -18, 12);
  g.lineStyle(7, COLOUR.sunnyGold, 1);
  g.strokeCircle(-34, -18, 12);
  g.strokeCircle(34, -18, 12);
  inked(g, COLOUR.softSlate);
  g.fillRoundedRect(-24, 34, 48, 14, 5);
  g.strokeRoundedRect(-24, 34, 48, 14, 5);
  inked(g, COLOUR.sunnyGold);
  g.fillRoundedRect(-7, 14, 14, 22, 3);
  g.strokeRoundedRect(-7, 14, 14, 22, 3);
  g.fillRoundedRect(-30, -40, 60, 58, { tl: 6, tr: 6, bl: 28, br: 28 });
  g.strokeRoundedRect(-30, -40, 60, 58, { tl: 6, tr: 6, bl: 28, br: 28 });
  g.fillStyle(COLOUR.cloud, 0.7);
  g.fillRoundedRect(-22, -32, 8, 30, 4);
  g.fillStyle(COLOUR.heatOrange, 1);
  const star: Phaser.Geom.Point[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 12 : 5;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    star.push(new Phaser.Geom.Point(4 + Math.cos(a) * r, -14 + Math.sin(a) * r));
  }
  g.fillPoints(star, true);
}
