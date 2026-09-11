/**
 * Procedural world backdrops (CLAUDE.md §5.7) — muted, low-saturation,
 * never animated. A ground plane band grounds Granny in the scene; a
 * couple of large, very-low-opacity shapes suggest depth without
 * competing with the spinner wall. One draw function per world id
 * (entities/world/world.data.ts).
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { COLOUR, shade } from '../../utils/colour';

/** Ground plane occupies the bottom slice of the canvas — where Granny stands. */
const GROUND_HEIGHT_RATIO = 0.24;

function drawGarden(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Two large, soft "hedge" shapes in the back corners — depth cue only,
  // never animated (§5.7), low enough opacity to stay out of the way.
  g.fillStyle(shade(COLOUR.mintGreen, 0.75), 0.1);
  g.fillCircle(-40, GAME_HEIGHT * 0.15, 260);
  g.fillCircle(GAME_WIDTH + 40, GAME_HEIGHT * 0.1, 220);

  // Ground plane: warm muted grass green (CLAUDE.md §5.7 — "warm wood tone or grass").
  g.fillStyle(shade(COLOUR.mintGreen, 0.55), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);

  // A soft seam so the ground reads as a plane, not a hard-edged rectangle.
  g.fillStyle(shade(COLOUR.mintGreen, 0.4), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawWorkshop(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Pegboard wall — a faint dot grid, low enough opacity to read as texture, not detail.
  g.fillStyle(shade(COLOUR.softSlate, 1.3), 0.08);
  for (let x = 40; x < GAME_WIDTH; x += 56) {
    for (let y = 30; y < groundY; y += 56) {
      g.fillCircle(x, y, 3);
    }
  }

  // Workbench ground — warm wood tone (§5.7).
  g.fillStyle(shade(COLOUR.heatOrange, 0.5), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.heatOrange, 0.38), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawKitchen(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Soft tile checker on the back wall.
  const tile = 64;
  for (let x = 0; x < GAME_WIDTH; x += tile) {
    for (let y = 0; y < groundY; y += tile) {
      const even = (Math.round(x / tile) + Math.round(y / tile)) % 2 === 0;
      g.fillStyle(shade(COLOUR.sunnyGold, even ? 1.25 : 1.15), 0.06);
      g.fillRect(x, y, tile, tile);
    }
  }

  // Countertop ground — warm cream tone.
  g.fillStyle(shade(COLOUR.sunnyGold, 0.65), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.sunnyGold, 0.5), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawFunfair(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Big-top tent stripes — alternating muted pink/cloud wedges from a peak above the wall.
  const peakX = GAME_WIDTH / 2;
  const peakY = -80;
  const stripes = 12;
  for (let i = 0; i < stripes; i++) {
    const a0 = (i / stripes) * Math.PI - Math.PI / 2 - Math.PI / 2;
    const a1 = ((i + 1) / stripes) * Math.PI - Math.PI / 2 - Math.PI / 2;
    const reach = 1400;
    g.fillStyle(i % 2 === 0 ? shade(COLOUR.grannyPink, 1.5) : COLOUR.cloud, i % 2 === 0 ? 0.1 : 1);
    g.beginPath();
    g.moveTo(peakX, peakY);
    g.lineTo(peakX + Math.cos(a0) * reach, peakY + Math.sin(a0) * reach);
    g.lineTo(peakX + Math.cos(a1) * reach, peakY + Math.sin(a1) * reach);
    g.closePath();
    g.fillPath();
  }

  // Sawdust-ring ground.
  g.fillStyle(shade(COLOUR.heatOrange, 0.7), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.heatOrange, 0.55), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawDisco(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Dance-floor dark backdrop (Ink is a neutral, not a saturated hero colour — stays within §5.1's rules).
  g.fillStyle(shade(COLOUR.ink, 1.15), 1);
  g.fillRect(0, 0, GAME_WIDTH, groundY);

  // Soft mirror-ball glow pools — low opacity, never animated (§5.7).
  const glowSpots: readonly (readonly [number, number, number])[] = [
    [GAME_WIDTH * 0.2, GAME_HEIGHT * 0.15, 180],
    [GAME_WIDTH * 0.8, GAME_HEIGHT * 0.1, 150],
    [GAME_WIDTH * 0.5, GAME_HEIGHT * 0.3, 220],
  ];
  const glowColours = [COLOUR.sunnyGold, COLOUR.grannyPink, COLOUR.waterBlue];
  glowSpots.forEach(([x, y, r], i) => {
    g.fillStyle(glowColours[i % glowColours.length], 0.08);
    g.fillCircle(x, y, r);
  });

  // Tiny sparkle dots — a still starfield, not a twinkle animation.
  g.fillStyle(COLOUR.cloud, 0.15);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * groundY;
    g.fillCircle(x, y, Math.random() * 1.5 + 0.5);
  }

  // Chequered dance floor.
  g.fillStyle(shade(COLOUR.ink, 1.35), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(COLOUR.sunnyGold, 0.12);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

const BACKGROUND_DRAWERS: Readonly<Record<string, (scene: Phaser.Scene) => void>> = {
  garden: drawGarden,
  workshop: drawWorkshop,
  kitchen: drawKitchen,
  funfair: drawFunfair,
  disco: drawDisco,
};

/** Draws the named world's backdrop. No-ops (transparent Cloud only) for an unrecognised id. */
export function drawWorldBackground(scene: Phaser.Scene, worldId: string): void {
  BACKGROUND_DRAWERS[worldId]?.(scene);
}
