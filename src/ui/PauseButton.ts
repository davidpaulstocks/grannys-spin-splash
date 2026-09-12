/**
 * A visible pause control for touch devices (2026-09-12, direct user
 * request). CLAUDE.md §6.3 specs pause as a two-finger tap and §6.1 rule 5
 * says "no menus during play" — but a two-finger tap is an invisible
 * gesture, and the audience is seven-year-olds who will never discover it.
 * Desktop players have ESC and the on-splash controls legend; touch players
 * had nothing, so this fills a gap that only exists on touch rather than
 * adding UI everywhere. The gesture still works; this is a second door to
 * the same room.
 *
 * Deliberately NOT styled like the move buttons. Those are saturated Mint
 * Green gameplay controls; this is system UI, so it borrows the Cloud/Ink
 * language of the score and timer pills it sits beside — which also keeps
 * it from competing with the spinner wall (§5.7) and stops a child reading
 * it as a third movement control.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import { GAME_WIDTH } from '../config';
import type { InputManager } from '../systems/InputManager';
import { usesTouchControls } from './touchControls';

/**
 * 96 logical px keeps the touch target at or above the 44pt/48dp minimum
 * everywhere it can be tapped: 48 CSS px at Poki's smallest canonical size
 * (640x360, scale 0.5) and 50 on a 667-wide landscape phone. Smaller would
 * pass on a phone and fail at 640x360.
 */
const BUTTON_SIZE = 96;
const MARGIN = 16;
/** Above the spinner wall and every transient overlay, so the corner is always tappable. */
const DEPTH = 400;
const PRESSED_SCALE = 0.92;

/** Matches MobileMoveButtons: the painted art fills 244px of each 256px PNG. */
const SPRITE_CANVAS_PX = 256;
const SPRITE_ART_BOX_PX = 244;
const SPRITE_DISPLAY_SIZE = (BUTTON_SIZE * SPRITE_CANVAS_PX) / SPRITE_ART_BOX_PX;

/**
 * Adds the touch-only pause button to the top-right corner, calling
 * `onPause` on release. No-op on non-touch devices.
 */
export function createPauseButton(
  scene: Phaser.Scene,
  input: InputManager,
  onPause: () => void,
): void {
  if (!usesTouchControls(scene.sys.game)) return;

  const x = GAME_WIDTH - MARGIN - BUTTON_SIZE / 2;
  const y = MARGIN + BUTTON_SIZE / 2;

  const image = scene.add
    .image(x, y, SPRITE_KEYS.pauseButton)
    .setDisplaySize(SPRITE_DISPLAY_SIZE, SPRITE_DISPLAY_SIZE)
    .setDepth(DEPTH);
  // Captured after setDisplaySize so press/release are absolute scales —
  // multiplying the *current* scale would compound on a repeated pointerdown.
  const baseScale = image.scaleX;

  const zone = scene.add
    .zone(x, y, BUTTON_SIZE, BUTTON_SIZE)
    .setDepth(DEPTH)
    .setInteractive({ useHandCursor: true });

  zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    // Without this the same tap also fires the water cannon, since
    // InputManager listens scene-wide for every pointer (see its own
    // comment, and MobileMoveButtons for the same claim on the move keys).
    input.claimPointer(pointer.id);
    image.setScale(baseScale * PRESSED_SCALE);
  });

  const release = (pointer: Phaser.Input.Pointer): void => {
    input.releasePointer(pointer.id);
    image.setScale(baseScale);
  };

  zone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    // Unlike the move buttons, this releases its own claim rather than
    // leaving it to InputManager's scene-wide pointerup: pausing stops that
    // scene's input plugin, so the scene-wide handler may never run for this
    // event and the id would stay excluded for the rest of the round —
    // permanently deadening whichever finger happened to tap pause.
    release(pointer);
    onPause();
  });
  zone.on('pointerout', release);
}
