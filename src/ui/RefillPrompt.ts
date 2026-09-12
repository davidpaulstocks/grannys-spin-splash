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
  pointerGuard: { claimPointer(id: number): void; releasePointer(id: number): void },
): Phaser.GameObjects.Container {
  const button = createButton(scene, {
    x,
    y: waterBarY - Y_OFFSET_ABOVE_WATER_BAR,
    label: 'Watch an ad to refill now',
    variant: 'secondary',
    minWidth: 260,
    // No adjacent "standard" button to stay under here (CLAUDE.md §11.3's
    // size rule is about a paired continue button, and this solo mid-run
    // prompt has none) — still gets the video icon since that half of the
    // rule ("must include a video icon prominently") applies regardless.
    showPlayIcon: true,
    // Mid-run, so the tap must not double as aim/fire or as the second
    // finger of the pause gesture — see ButtonConfig.pointerGuard.
    pointerGuard,
    onClick: onWatchAd,
  });
  button.setVisible(false);
  return button;
}
