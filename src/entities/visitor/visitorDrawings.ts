/**
 * Stand-in drawings for every visitor, used until its painted picture is
 * shipped (visitorArt.data.ts). Round, friendly, house palette, ink outline,
 * all drawn facing right around the origin; the visitor flips them to face
 * the way it is going. The cat, umbrella and duck are the originals.
 */

import { COLOUR } from '../../utils/colour';
import { inked, THIN, type Gfx } from './drawKit';
import { drawCat, drawDuck, drawUmbrella } from './classicDrawings';
import {
  drawCandyfloss,
  drawCupcake,
  drawPiggyBank,
  drawTrophy,
  drawWateringCan,
} from './treatDrawings';
import {
  drawCrab,
  drawFishingNet,
  drawGoldenCompass,
  drawParrot,
  drawShipSail,
  drawTreasureChest,
} from './pirateDrawings';
import { BALLOON_KNOT, BALLOON_LAYOUT } from './visitorTuning.data';
import type { VisitorId } from './visitor.types';

/** What can change about a drawing while it is on screen. */
export interface DrawState {
  /** A sitter that has been shooed and is on its way out. */
  readonly leaving: boolean;
  /** Which balloons of the bunch are still there. */
  readonly balloonsAlive: readonly boolean[];
}

/** A union of discs with one ink outline around the lot, so a cloud reads as one shape. */
function drawBloomers(g: Gfx): void {
  // The washing line, sagging a little, between two pegs.
  g.lineStyle(THIN + 1, COLOUR.ink, 1);
  g.beginPath();
  g.moveTo(-110, -50);
  g.lineTo(-30, -42);
  g.lineTo(30, -42);
  g.lineTo(110, -50);
  g.strokePath();
  g.fillStyle(COLOUR.softSlate, 1);
  g.fillCircle(-110, -50, 6);
  g.fillCircle(110, -50, 6);
  // The bloomers: a waistband, a round seat and two frilly legs.
  inked(g, COLOUR.grannyPink);
  g.fillRoundedRect(-36, -30, 72, 40, 16);
  g.strokeRoundedRect(-36, -30, 72, 40, 16);
  g.fillEllipse(-18, 22, 32, 44);
  g.strokeEllipse(-18, 22, 32, 44);
  g.fillEllipse(18, 22, 32, 44);
  g.strokeEllipse(18, 22, 32, 44);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillRoundedRect(-38, -44, 76, 14, 7);
  g.strokeRoundedRect(-38, -44, 76, 14, 7);
  g.fillEllipse(-18, 42, 36, 10);
  g.fillEllipse(18, 42, 36, 10);
  for (const [x, y] of [
    [-22, -12],
    [0, -4],
    [22, -14],
    [-18, 18],
    [-14, 32],
    [18, 24],
    [20, 36],
    [4, 10],
  ] as const) {
    g.fillCircle(x, y, 5);
  }
}

function drawFlamingoRing(g: Gfx): void {
  // The inflatable ring: a fat pink tube with a pale stripe.
  g.lineStyle(38, COLOUR.ink, 1);
  g.strokeEllipse(0, 20, 120, 46);
  g.lineStyle(30, COLOUR.grannyPink, 1);
  g.strokeEllipse(0, 20, 120, 46);
  g.lineStyle(7, COLOUR.cloud, 0.8);
  g.beginPath();
  g.arc(0, 20, 60, Math.PI * 1.1, Math.PI * 1.45, false);
  g.strokePath();
  // Neck and head of the flamingo, rising from the right of the ring.
  g.lineStyle(20, COLOUR.ink, 1);
  g.lineBetween(52, 8, 58, -34);
  g.lineStyle(13, COLOUR.grannyPink, 1);
  g.lineBetween(52, 8, 58, -34);
  inked(g, COLOUR.grannyPink);
  g.fillCircle(62, -44, 13);
  g.strokeCircle(62, -44, 13);
  g.fillStyle(COLOUR.ink, 1);
  g.fillTriangle(70, -52, 92, -42, 72, -34);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillCircle(64, -48, 3);
}

function drawBalloons(g: Gfx, alive: readonly boolean[]): void {
  g.lineStyle(THIN, COLOUR.ink, 1);
  BALLOON_LAYOUT.forEach((b, i) => {
    if (alive[i] === false) return;
    g.lineBetween(b.x, b.y + 28, BALLOON_KNOT.x, BALLOON_KNOT.y);
  });
  BALLOON_LAYOUT.forEach((b, i) => {
    if (alive[i] === false) return;
    inked(g, b.colour);
    g.fillEllipse(b.x, b.y, 50, 58);
    g.strokeEllipse(b.x, b.y, 50, 58);
    g.fillTriangle(b.x - 5, b.y + 33, b.x + 5, b.y + 33, b.x, b.y + 26);
    g.fillStyle(COLOUR.cloud, 0.7);
    g.fillEllipse(b.x - 10, b.y - 12, 10, 16);
  });
}

function drawSeagull(g: Gfx, leaving: boolean): void {
  g.lineStyle(THIN + 1, COLOUR.heatOrange, 1);
  if (!leaving) {
    g.lineBetween(-6, 18, -6, 34);
    g.lineBetween(8, 18, 8, 34);
  }
  inked(g, COLOUR.cloud);
  g.fillTriangle(-30, 4, -52, -4, -30, 14);
  g.strokeTriangle(-30, 4, -52, -4, -30, 14);
  g.fillEllipse(0, 0, 66, 42);
  g.strokeEllipse(0, 0, 66, 42);
  g.fillCircle(28, -20, 14);
  g.strokeCircle(28, -20, 14);
  g.fillStyle(COLOUR.softSlate, 1);
  if (leaving) {
    g.fillEllipse(-8, -30, 24, 54);
    g.strokeEllipse(-8, -30, 24, 54);
  } else {
    g.fillEllipse(-6, 0, 44, 22);
    g.strokeEllipse(-6, 0, 44, 22);
  }
  g.fillStyle(COLOUR.heatOrange, 1);
  g.fillTriangle(38, -23, 54, -18, 38, -13);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(30, -23, 2.5);
}

/**
 * Redraws visitor `id` into `g` (cleared first) at its natural size, facing
 * right. The six visitors of the third art sheet borrow the nearest
 * drawing (they ship painted); the Pirate Ship's six have their own
 * stand-ins (pirateDrawings.ts), now only a fallback since sheet 4 is painted.
 */
export function drawVisitor(g: Gfx, id: VisitorId, state: DrawState): void {
  g.clear();
  switch (id) {
    case 'bloomers':
    case 'dust_sheet':
    case 'tea_towel':
      return drawBloomers(g);
    case 'umbrella':
    case 'gnome':
      return drawUmbrella(g, true);
    case 'balloons':
      return drawBalloons(g, state.balloonsAlive);
    case 'flamingo':
    case 'dodgem':
      return drawFlamingoRing(g);
    case 'cat':
    case 'squirrel':
      return drawCat(g, state.leaving);
    case 'seagull':
    case 'pigeon':
      return drawSeagull(g, state.leaving);
    case 'rubber_duck':
      return drawDuck(g, true);
    case 'watering_can':
      return drawWateringCan(g);
    case 'cupcake':
      return drawCupcake(g);
    case 'piggy_bank':
      return drawPiggyBank(g);
    case 'candyfloss':
      return drawCandyfloss(g);
    case 'trophy':
      return drawTrophy(g);
    case 'ship_sail':
      return drawShipSail(g);
    case 'fishing_net':
      return drawFishingNet(g);
    case 'parrot':
      return drawParrot(g, state.leaving);
    case 'crab':
      return drawCrab(g);
    case 'treasure_chest':
      return drawTreasureChest(g);
    case 'golden_compass':
      return drawGoldenCompass(g);
  }
}
