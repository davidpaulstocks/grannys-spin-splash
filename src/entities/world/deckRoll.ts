/**
 * The Pirate Ship's one trick: from its fourth gig the deck rolls, and the
 * whole wall sways gently together, a few pixels, slowly, like a ship at sea.
 *
 * It moves the spinners themselves (their x and y), so the aim, the snap, the
 * water's hit tests and the coin and note fountains all follow the
 * instruments with no changes of their own: the same way the Funfair's
 * drifting targets work. Because the whole wall moves as one, no instrument
 * is harder to reach than another; the player simply keeps aiming at a
 * moving wall.
 */

import type Phaser from 'phaser';

import type { Spinner } from '../spinner/Spinner';

/** Gig index (0-based) from which the deck rolls: the fourth gig. */
export const DECK_ROLL_FROM_GIG = 3;
/** How far the wall swings sideways and up and down, px. */
export const DECK_ROLL_RANGE_X = 9;
export const DECK_ROLL_RANGE_Y = 4;
/** Phaser's scene event names, written out so this file (imported by the gig data and its tests) needs no Phaser at run time. */
const SCENE_UPDATE = 'update';
const SCENE_SHUTDOWN = 'shutdown';
/** One full roll, ms. */
export const DECK_ROLL_PERIOD_MS = 7000;

export interface DeckOffset {
  readonly x: number;
  readonly y: number;
}

/** Where the wall is, relative to its resting place, `timeMs` into the roll. The up-and-down runs a quarter roll behind the sway, so the wall traces a lazy oval. */
export function deckRollOffset(timeMs: number): DeckOffset {
  const phase = (timeMs / DECK_ROLL_PERIOD_MS) * Math.PI * 2;
  return {
    x: Math.sin(phase) * DECK_ROLL_RANGE_X,
    y: Math.cos(phase) * DECK_ROLL_RANGE_Y,
  };
}

/**
 * Starts the roll on `spinners` for as long as `scene` runs: remembers where
 * each one rests and moves it round that spot every frame. Stops itself when
 * the scene shuts down.
 */
export function startDeckRoll(scene: Phaser.Scene, spinners: readonly Spinner[]): void {
  const rests = spinners.map((spinner) => ({ spinner, x: spinner.x, y: spinner.y }));
  const origin = scene.time.now;
  const roll = (): void => {
    const offset = deckRollOffset(scene.time.now - origin);
    for (const rest of rests) {
      rest.spinner.setPosition(rest.x + offset.x, rest.y + offset.y);
    }
  };
  scene.events.on(SCENE_UPDATE, roll);
  scene.events.once(SCENE_SHUTDOWN, () => {
    scene.events.off(SCENE_UPDATE, roll);
  });
}
