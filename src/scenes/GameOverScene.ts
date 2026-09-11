/**
 * Score reveal + Play Again + "double your score" (CLAUDE.md §7.2, story
 * 6.2). Still a lean first pass beyond that: score count-up and level
 * reveal need GRANNY_LEVELS wiring (`entities/progression/levels.ts`,
 * not yet consumed anywhere) and are a later polish pass. Play Again
 * returns to SplashScene, not straight into GameScene — the exit
 * criteria is the full loop (splash → game → game over → splash) so
 * newly-earned vault stars are visible before the next run.
 * commercialBreak() before restart is SplashScene's job (story 6.1),
 * not this scene's.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { adManager } from '../systems/AdManager';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameOverData } from '../types/sceneData';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { showBanner } from '../ui/Banner';
import { createButton } from '../ui/Button';
import { textStyle } from '../utils/typography';

const DOUBLE_SCORE_BUTTON_Y_RATIO = 0.82;

export class GameOverScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _scoreBanner!: Phaser.GameObjects.Text;
  private _doubleScoreButton: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.22,
        "TIME'S UP!",
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);

    this._scoreBanner = showBanner(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.4, String(data.score));

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.64,
      label: 'PLAY AGAIN',
      variant: 'primary',
      minWidth: 280,
      onClick: () => this.scene.start('SplashScene'),
    });

    this._buildDoubleScoreButton(data.score);
  }

  /** CLAUDE.md §11.1/§11.3: optional, never gates the standard Play Again; never Mint Green; one reward per ad. */
  private _buildDoubleScoreButton(score: number): void {
    if (score <= 0) return; // nothing worth doubling
    this._doubleScoreButton = createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * DOUBLE_SCORE_BUTTON_Y_RATIO,
      label: 'Watch an ad to double your score',
      variant: 'secondary',
      minWidth: 340,
      onClick: () => void this._onDoubleScore(score),
    });
  }

  private async _onDoubleScore(score: number): Promise<void> {
    const watched = await adManager.playRewarded('medium', AD_MUTE_HOOKS);
    if (!watched) return;

    this._unlocks.addStars(score); // the base score is already banked by GameScene — this tops it up to 2×
    this._scoreBanner.setText(String(score * 2));
    this._doubleScoreButton?.destroy(); // one reward per ad
    this._doubleScoreButton = null;
  }
}
