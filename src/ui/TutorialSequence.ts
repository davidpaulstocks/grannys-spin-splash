/**
 * The "mini scripted moments" tutorial layer (2026-09-12, direct user
 * request: "add a tutorial for first-time players... gives them a mini
 * scripted moments, so they know what to do and how to play and the
 * purpose of the game"). CLAUDE.md §6.5 still rules out a tutorial
 * SCREEN — this doesn't add one. It's two short captions layered over
 * live gameplay on a player's very first-ever run, each tied to something
 * that just happened rather than dumped up front: how to play, at round
 * start (paired with the existing ghost-finger demo), and the purpose of
 * the game, the moment they see it start to pay off — their first spinner
 * ever reaching FULL. Never blocks input, never repeats after this run.
 *
 * A caller owns the `!hasPlayed` gate and constructs this once per round;
 * this class only owns sequencing so it fires each beat at most once.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { showTutorialCaption } from './TutorialCaption';

/** Above the encouragement/mini-frenzy toast bands (0.24/0.30) so a coincidental overlap never stacks text. */
const CAPTION_Y = GAME_HEIGHT * 0.16;

export class TutorialSequence {
  private _shownPurpose = false;

  /** Round start: the "how to play" beat. */
  playHowToPlay(scene: Phaser.Scene): void {
    showTutorialCaption(
      scene,
      GAME_WIDTH / 2,
      CAPTION_Y,
      'Squirt the spinners to make them spin faster!',
    );
  }

  /** First spinner this run to reach FULL: the "purpose of the game" beat. Fires once per round, ever. */
  maybeShowPurpose(scene: Phaser.Scene): void {
    if (this._shownPurpose) return;
    this._shownPurpose = true;
    showTutorialCaption(
      scene,
      GAME_WIDTH / 2,
      CAPTION_Y,
      'Get every spinner to FULL for SPLASH FRENZY!',
    );
  }
}
