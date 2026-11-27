/** Stand-in drawings for the Pirate Ship's six visitors (see visitorDrawings.ts), facing right around the origin. */

import Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import { blobs, inked, THIN, type Gfx } from './drawKit';

const WOOD = 0xaa6622;

/** A big cloth sail on a mast, with two patches. */
export function drawShipSail(g: Gfx): void {
  g.lineStyle(10, COLOUR.ink, 1);
  g.lineBetween(0, -70, 0, 70);
  g.lineStyle(5, WOOD, 1);
  g.lineBetween(0, -70, 0, 70);
  inked(g, COLOUR.cloud);
  const sail = [
    new Phaser.Geom.Point(-84, -58),
    new Phaser.Geom.Point(84, -58),
    new Phaser.Geom.Point(98, 34),
    new Phaser.Geom.Point(0, 52),
    new Phaser.Geom.Point(-98, 34),
  ];
  g.fillPoints(sail, true);
  g.strokePoints(sail, true);
  g.fillStyle(COLOUR.grannyPink, 1);
  g.fillRoundedRect(-62, -34, 34, 30, 5);
  g.fillStyle(COLOUR.waterBlue, 1);
  g.fillRoundedRect(28, 0, 38, 30, 5);
  g.lineStyle(THIN, COLOUR.ink, 1);
  g.strokeRoundedRect(-62, -34, 34, 30, 5);
  g.strokeRoundedRect(28, 0, 38, 30, 5);
}

/** A round net with a few fish caught in it. */
export function drawFishingNet(g: Gfx): void {
  g.fillStyle(COLOUR.waterBlue, 0.22);
  g.fillEllipse(0, 0, 190, 110);
  g.lineStyle(THIN + 1, COLOUR.ink, 1);
  g.strokeEllipse(0, 0, 190, 110);
  for (let x = -76; x <= 76; x += 38)
    g.lineBetween(x, -Math.sqrt(1 - (x / 95) ** 2) * 55, x, Math.sqrt(1 - (x / 95) ** 2) * 55);
  for (let y = -36; y <= 36; y += 24) {
    const half = Math.sqrt(1 - (y / 55) ** 2) * 95;
    g.lineBetween(-half, y, half, y);
  }
  for (const [x, y, colour] of [
    [-34, -10, COLOUR.heatOrange],
    [22, 8, COLOUR.sunnyGold],
    [-4, 26, COLOUR.grannyPink],
  ] as const) {
    inked(g, colour);
    g.fillEllipse(x, y, 40, 22);
    g.strokeEllipse(x, y, 40, 22);
    g.fillTriangle(x - 18, y, x - 32, y - 10, x - 32, y + 10);
    g.fillStyle(COLOUR.ink, 1);
    g.fillCircle(x + 11, y - 3, 2.5);
  }
}

/** A round green-and-pink parrot on a perch, with a hooked beak. */
export function drawParrot(g: Gfx, leaving: boolean): void {
  g.lineStyle(THIN + 1, COLOUR.heatOrange, 1);
  if (!leaving) {
    g.lineBetween(-6, 20, -6, 34);
    g.lineBetween(8, 20, 8, 34);
  }
  inked(g, COLOUR.waterBlue);
  g.fillTriangle(-26, 6, -58, 20, -24, 22);
  g.strokeTriangle(-26, 6, -58, 20, -24, 22);
  g.fillStyle(COLOUR.mintGreen, 1);
  g.fillEllipse(0, 0, 62, 48);
  g.strokeEllipse(0, 0, 62, 48);
  g.fillStyle(COLOUR.grannyPink, 1);
  g.fillEllipse(-4, 4, 40, 24);
  g.fillStyle(COLOUR.mintGreen, 1);
  g.fillCircle(26, -22, 15);
  g.strokeCircle(26, -22, 15);
  g.fillStyle(COLOUR.sunnyGold, 1);
  g.fillTriangle(34, -30, 54, -20, 38, -10);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(28, -26, 2.5);
}

/** A round orange crab: two raised claws and little legs. */
export function drawCrab(g: Gfx): void {
  g.lineStyle(THIN + 2, COLOUR.ink, 1);
  for (const side of [-1, 1]) {
    g.lineBetween(side * 20, 10, side * 38, 26);
    g.lineBetween(side * 14, 16, side * 28, 34);
    g.lineBetween(side * 26, -4, side * 46, -22);
  }
  blobs(
    g,
    [
      [-50, -34, 12],
      [50, -34, 12],
    ],
    COLOUR.heatOrange,
  );
  inked(g, COLOUR.heatOrange);
  g.fillEllipse(0, 0, 70, 46);
  g.strokeEllipse(0, 0, 70, 46);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillCircle(-10, -18, 7);
  g.fillCircle(10, -18, 7);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(-10, -18, 3);
  g.fillCircle(10, -18, 3);
}

/** A wooden chest with gold bands and a lock. */
export function drawTreasureChest(g: Gfx): void {
  g.fillStyle(COLOUR.sunnyGold, 0.28);
  g.fillCircle(0, 0, 58);
  inked(g, WOOD);
  g.fillRoundedRect(-44, -4, 88, 46, 6);
  g.strokeRoundedRect(-44, -4, 88, 46, 6);
  g.fillRoundedRect(-44, -36, 88, 36, { tl: 30, tr: 30, bl: 4, br: 4 });
  g.strokeRoundedRect(-44, -36, 88, 36, { tl: 30, tr: 30, bl: 4, br: 4 });
  g.fillStyle(COLOUR.sunnyGold, 1);
  g.fillRect(-24, -34, 10, 74);
  g.fillRect(14, -34, 10, 74);
  g.fillRoundedRect(-9, -8, 18, 18, 4);
  g.lineStyle(THIN, COLOUR.ink, 1);
  g.strokeRoundedRect(-9, -8, 18, 18, 4);
  blobs(
    g,
    [
      [-14, -40, 6],
      [0, -44, 7],
      [14, -40, 6],
    ],
    COLOUR.sunnyGold,
  );
}

/** A gold compass: a ring, a face and a red-and-cloud needle. */
export function drawGoldenCompass(g: Gfx): void {
  g.fillStyle(COLOUR.sunnyGold, 0.28);
  g.fillCircle(0, 0, 58);
  blobs(g, [[0, -46, 7]], COLOUR.sunnyGold);
  blobs(g, [[0, 0, 40]], COLOUR.sunnyGold);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillCircle(0, 0, 30);
  g.lineStyle(THIN, COLOUR.ink, 1);
  g.strokeCircle(0, 0, 30);
  g.fillStyle(COLOUR.heatOrange, 1);
  g.fillTriangle(-7, 0, 7, 0, 12, -24);
  g.fillStyle(COLOUR.softSlate, 1);
  g.fillTriangle(-7, 0, 7, 0, -12, 24);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(0, 0, 3.5);
}
