/**
 * On-screen ◀ / ▶ hold-to-move buttons, pinned to the bottom screen edges
 * (CLAUDE.md §6.3, story 1.3+). Only created on touch devices — desktop
 * play already has A/D/arrow keys, so these would just be clutter (§6.1:
 * "no chords, no menus during play" applies equally to unnecessary UI).
 * Pinned to the edges, not the centre, so the whole middle of the screen
 * stays free for aim/fire per the §6.3 mockup.
 *
 * Bigger and bolder (2026-09-12, direct user feedback: "make sure the
 * gameplay buttons are big and chunky and present for mobile and tablet.
 * So it's easy for a seven-year-old to play"). A pressed state (Granny
 * Pink art + a slight squash) gives the tactile "yes, that registered"
 * feedback a young player needs, since there's no physical click.
 *
 * Now drawn from hand-painted sprites rather than Phaser Graphics
 * (2026-09-12, user-supplied art per BUTTON_ART_BRIEF.md): the procedural
 * version was a flat Mint Green rounded square, correct on palette but
 * visibly the one piece of UI that didn't share the watercolour language
 * of the grannies, guns and worlds around it.
 *
 * Every touch here is claimed on `InputManager` (2026-09-12, found live
 * while verifying mobile controls): Phaser's scene-wide pointer events fire
 * for every touch regardless of what it landed on, so without this, pressing
 * a move button also fired the water cannon, and holding fire with one
 * finger while pressing a move button with the other was read as the
 * two-finger pause gesture. Tracking each button's own pointer id (not just
 * "some pointer is up") also stops one finger's release from cancelling the
 * OTHER hand's held move button or held fire.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS, type MoveButtonDirection } from '../assets/keys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { InputManager } from '../systems/InputManager';
import { usesTouchControls } from './touchControls';

/**
 * Sized in logical 1280x720 space, so what matters is what it becomes on a
 * real phone: 116 logical px lands at ~60 CSS px across a 667-wide
 * viewport — comfortably past both Apple's 44pt and Android's 48dp minimum
 * touch target, with real margin for a smaller child's less precise tap.
 */
const BUTTON_SIZE = 116;
const MARGIN_X = 36;
const MARGIN_BOTTOM = 128;
const PRESSED_SCALE = 0.9;

/**
 * The painted button occupies a 244px box centred in each 256px PNG (the
 * rest is transparent margin), so the sprite is drawn slightly larger than
 * BUTTON_SIZE to make the *visible* button exactly BUTTON_SIZE — matching
 * the touch target the size above was tuned against, rather than rendering
 * ~5% smaller than it.
 */
const SPRITE_CANVAS_PX = 256;
const SPRITE_ART_BOX_PX = 244;
const SPRITE_DISPLAY_SIZE = (BUTTON_SIZE * SPRITE_CANVAS_PX) / SPRITE_ART_BOX_PX;

function buildButton(
  scene: Phaser.Scene,
  input: InputManager,
  x: number,
  y: number,
  direction: -1 | 1,
): void {
  const art: MoveButtonDirection = direction === -1 ? 'left' : 'right';
  const face = (pressed: boolean): Phaser.GameObjects.Image =>
    scene.add
      .image(0, 0, SPRITE_KEYS.moveButton(art, pressed))
      .setDisplaySize(SPRITE_DISPLAY_SIZE, SPRITE_DISPLAY_SIZE);

  const restFace = face(false);
  const pressedFace = face(true).setVisible(false);

  const group = scene.add.container(x, y, [restFace, pressedFace]);

  const zone = scene.add
    .zone(x, y, BUTTON_SIZE, BUTTON_SIZE)
    .setInteractive({ useHandCursor: true });

  // Tracks WHICH pointer pressed this button, so a different finger
  // lifting elsewhere on screen can never be mistaken for this button's
  // own release (and vice versa, for a held fire on the other hand).
  let heldPointerId: number | null = null;

  const setPressed = (pressed: boolean): void => {
    restFace.setVisible(!pressed);
    pressedFace.setVisible(pressed);
    group.setScale(pressed ? PRESSED_SCALE : 1);
  };
  // Deliberately does NOT call `input.releasePointer` — a genuine lift is
  // cleared by InputManager's own scene-wide `pointerup` (see its comment
  // for why releasing here first would race that check). This only resets
  // this button's own visuals and the held-move state.
  const stop = (): void => {
    heldPointerId = null;
    setPressed(false);
    input.setMobileMove(direction, false);
  };
  zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    heldPointerId = pointer.id;
    input.claimPointer(pointer.id);
    setPressed(true);
    input.setMobileMove(direction, true);
  });
  zone.on('pointerup', stop);
  // A finger dragged off the button without lifting: reset this button's
  // visuals AND actually release the exclusion here (there is no future
  // pointerup-on-this-id guaranteed to do it, since the touch keeps going
  // elsewhere on screen).
  zone.on('pointerout', (pointer: Phaser.Input.Pointer) => {
    input.releasePointer(pointer.id);
    stop();
  });
  // Safety net: a release anywhere on screen (finger slid off, or lifted
  // outside the zone entirely) still stops this button's hold state — but
  // only for the SAME pointer that pressed it, not just any pointer.
  scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (pointer.id === heldPointerId) stop();
  });
}

/**
 * Adds the two edge move buttons to `scene`, wired to `input`, but only on
 * a device that reports touch support.
 */
export function createMobileMoveButtons(scene: Phaser.Scene, input: InputManager): void {
  if (!usesTouchControls(scene.sys.game)) return;

  const y = GAME_HEIGHT - MARGIN_BOTTOM;
  buildButton(scene, input, MARGIN_X + BUTTON_SIZE / 2, y, -1);
  buildButton(scene, input, GAME_WIDTH - MARGIN_X - BUTTON_SIZE / 2, y, 1);
}
