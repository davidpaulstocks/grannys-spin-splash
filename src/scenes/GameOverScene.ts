/**
 * Score reveal + Play Again (CLAUDE.md §7.2). Sprint 2 scope only: a big
 * score number and one button — score count-up, level reveal, vault save,
 * and the unlock shop all need UnlockManager, which doesn't exist until
 * Sprint 5. commercialBreak() before restart is Sprint 6 story 6.1; this
 * restarts straight into GameScene.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { showBanner } from '../ui/Banner';
import { createButton } from '../ui/Button';
import { textStyle } from '../utils/typography';

export interface GameOverData {
  readonly score: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.28,
        "TIME'S UP!",
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);

    showBanner(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.46, String(data.score));

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.72,
      label: 'PLAY AGAIN',
      variant: 'primary',
      minWidth: 280,
      onClick: () => this.scene.start('GameScene'),
    });
  }
}
