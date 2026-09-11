/**
 * Procedural world backdrops (CLAUDE.md §5.7) — muted, low-saturation,
 * never animated. A ground plane band grounds Granny in the scene; a
 * couple of large, very-low-opacity shapes suggest depth without
 * competing with the spinner wall. One draw function per world id;
 * Garden is the only one that exists for v1 (entities/world/world.data.ts).
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

const BACKGROUND_DRAWERS: Readonly<Record<string, (scene: Phaser.Scene) => void>> = {
  garden: drawGarden,
};

/** Draws the named world's backdrop. No-ops (transparent Cloud only) for an unrecognised id. */
export function drawWorldBackground(scene: Phaser.Scene, worldId: string): void {
  BACKGROUND_DRAWERS[worldId]?.(scene);
}
