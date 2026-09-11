/**
 * Score reveal + Play Again (CLAUDE.md §7.2). Still a lean first pass: a
 * big score number and one button — score count-up and level reveal need
 * GRANNY_LEVELS wiring (CLAUDE.md §7.2's `entities/progression/levels.ts`,
 * not yet consumed anywhere) and are a later polish pass, not Sprint 5
 * scope. Play Again returns to SplashScene, not straight into GameScene —
 * Sprint 5's exit criteria is the full loop (splash → game → game over →
 * splash) so newly-earned vault stars are visible before the next run.
 * commercialBreak() before restart is Sprint 6 story 6.1.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { GameOverData } from '../types/sceneData';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { showBanner } from '../ui/Banner';
import { createButton } from '../ui/Button';
import { textStyle } from '../utils/typography';

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
      onClick: () => this.scene.start('SplashScene'),
    });
  }
}
