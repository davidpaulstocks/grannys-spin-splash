/**
 * "Watch an ad to refill instantly" — shown only while the water tank is
 * pumping (CLAUDE.md story 6.3: player-initiated, only when water = 0).
 * A thin factory like Button.ts; GameScene owns toggling its visibility
 * and what "refill" actually means (that's gameplay state, not UI).
 */

import Phaser from 'phaser';

import { createButton } from './Button';

const Y_OFFSET_ABOVE_WATER_BAR = 40;

/** Builds the prompt, hidden by default — caller toggles `.setVisible()` based on pump state. */
export function createRefillPrompt(
  scene: Phaser.Scene,
  x: number,
  waterBarY: number,
  onWatchAd: () => void,
): Phaser.GameObjects.Container {
  const button = createButton(scene, {
    x,
    y: waterBarY - Y_OFFSET_ABOVE_WATER_BAR,
    label: 'Watch an ad to refill now',
    variant: 'secondary',
    minWidth: 260,
    onClick: onWatchAd,
  });
  button.setVisible(false);
  return button;
}
