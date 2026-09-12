/**
 * On-screen ◀ / ▶ hold-to-move buttons, pinned to the bottom screen edges
 * (CLAUDE.md §6.3, story 1.3+). Only created on touch devices — desktop
 * play already has A/D/arrow keys, so these would just be clutter (§6.1:
 * "no chords, no menus during play" applies equally to unnecessary UI).
 * Pinned to the edges, not the centre, so the whole middle of the screen
 * stays free for aim/fire per the §6.3 mockup.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLOUR } from '../utils/colour';
import { pillRadius } from '../utils/math';

/**
 * Sized in logical 1280x720 space, so what matters is what it becomes on a
 * real phone: 96 logical px lands at ~50 CSS px across a 667-wide viewport,
 * clearing both Apple's 44 pt and Android's 48 dp minimum touch target. 72
 * came out at ~37 px — reachable with a thumb, but under both. The bottom
 * margin keeps them clear of the water bar at WATER_BAR_Y, and the alpha is
 * high enough to read over a busy illustrated background without the button
 * competing with the spinners for attention.
 */
const BUTTON_SIZE = 96;
const MARGIN_X = 40;
const MARGIN_BOTTOM = 120;
const BUTTON_ALPHA = 0.7;

function buildButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  direction: -1 | 1,
  onMove: (direction: -1 | 1, down: boolean) => void,
): void {
  const bg = scene.add.graphics();
  const radius = pillRadius(BUTTON_SIZE, BUTTON_SIZE);
  bg.fillStyle(COLOUR.cloud, BUTTON_ALPHA);
  bg.fillRoundedRect(-BUTTON_SIZE / 2, -BUTTON_SIZE / 2, BUTTON_SIZE, BUTTON_SIZE, radius);
  bg.lineStyle(3, COLOUR.ink, BUTTON_ALPHA);
  bg.strokeRoundedRect(-BUTTON_SIZE / 2, -BUTTON_SIZE / 2, BUTTON_SIZE, BUTTON_SIZE, radius);

  const arrow = scene.add.graphics();
  arrow.fillStyle(COLOUR.ink, Math.min(1, BUTTON_ALPHA + 0.3));
  const tipX = direction * 13;
  arrow.fillTriangle(-tipX, -18, -tipX, 18, tipX, 0);

  scene.add.container(x, y, [bg, arrow]);

  const zone = scene.add
    .zone(x, y, BUTTON_SIZE, BUTTON_SIZE)
    .setInteractive({ useHandCursor: true });
  const stop = (): void => onMove(direction, false);
  zone.on('pointerdown', () => onMove(direction, true));
  zone.on('pointerup', stop);
  zone.on('pointerout', stop);
  // Safety net: a release anywhere on screen (finger slid off, or lifted
  // outside the zone entirely) still stops this button's hold state.
  scene.input.on('pointerup', stop);
}

/**
 * Adds the two edge move buttons to `scene`, wired to `onMove`, but only
 * on a device that reports touch support. Callers pass their
 * `InputManager.setMobileMove` bound as `onMove`.
 */
export function createMobileMoveButtons(
  scene: Phaser.Scene,
  onMove: (direction: -1 | 1, down: boolean) => void,
): void {
  if (!scene.sys.game.device.input.touch) return;

  const y = GAME_HEIGHT - MARGIN_BOTTOM;
  buildButton(scene, MARGIN_X + BUTTON_SIZE / 2, y, -1, onMove);
  buildButton(scene, GAME_WIDTH - MARGIN_X - BUTTON_SIZE / 2, y, 1, onMove);
}
