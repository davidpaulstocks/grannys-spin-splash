/**
 * The single source of truth for "does this device get on-screen touch
 * controls?" (CLAUDE.md §6.3's move buttons, and the pause button that
 * covers what ESC does on desktop).
 *
 * Shared rather than re-tested per component because BootScene gates
 * *preloading* their art on the same answer: two independent copies of this
 * check would eventually drift, and the failure mode is a touch device
 * building a button whose texture was never downloaded — a missing-texture
 * box in the corner of a shipped game.
 */

import Phaser from 'phaser';

/** True on devices that report touch support — the only ones that get on-screen controls. */
export function usesTouchControls(game: Phaser.Game): boolean {
  return game.device.input.touch;
}
