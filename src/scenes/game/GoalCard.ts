/**
 * The goal, stated before the first squirt of every gig: one headline,
 * "Keep the band playing!", on a small Cloud plate on the floor to Granny's
 * left, clear of the wall and the HUD. The coin each star takes is not here:
 * it stands small under that star on the score bar (`ui/ScoreBar.ts`), where
 * it is tracked. The headline leaves on the first input.
 *
 * The round does not begin until the first input, so reading it costs the
 * player no time.
 */

import type Phaser from 'phaser';

import { createPanel } from '../../ui/Panel';
import { COLOUR_HEX } from '../../utils/colour';
import { textStyle } from '../../utils/typography';

/** On the floor to Granny's left: below the wall, above the water bar. */
const PLATE_X = 304;
const PLATE_Y = 576;
const PLATE_WIDTH = 432;
const PLATE_HEIGHT = 64;
const HEADLINE = 'Keep the band playing!';
const DEPTH = 150;
const FADE_MS = 220;

/** The one-line goal shown before a gig's first squirt. */
export class GoalCard {
  private readonly _scene: Phaser.Scene;
  private _parts: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  /** Shows the headline. */
  show(): void {
    const plate = createPanel(this._scene, {
      x: PLATE_X,
      y: PLATE_Y,
      width: PLATE_WIDTH,
      height: PLATE_HEIGHT,
    });
    const headline = this._scene.add
      .text(PLATE_X, PLATE_Y, HEADLINE, textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.ink))
      .setOrigin(0.5);
    this._parts = this._scene.add.container(0, 0, [...plate, headline]).setDepth(DEPTH);
  }

  /** Fades the headline out and removes it. Safe to call when nothing is showing. */
  dismiss(): void {
    const parts = this._parts;
    this._parts = null;
    if (!parts) return;
    this._scene.tweens.add({
      targets: parts,
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => parts.destroy(),
    });
  }
}
