/**
 * The payoff screen (CLAUDE.md §7.2): score count-up, rank reveal, vault
 * total, Play Again, and the optional double-score reward.
 *
 * The count-up and the rank reveal are the point of this scene. Until
 * 2026-09-12 it showed a bare number and two buttons — `GRANNY_LEVELS` had
 * been extracted from the prototype in Sprint 0 and then never consumed
 * anywhere, so the ladder the whole score economy climbs was invisible. A
 * 30-second game lives or dies on how the last two seconds feel, so the
 * number ticks up rather than appearing, and the rank lands after it with a
 * bounce and its own colour.
 *
 * Play Again returns to SplashScene, not straight into GameScene — the loop
 * is splash → game → game over → splash so newly-earned vault stars are
 * visible before the next run. `commercialBreak()` before restart is
 * SplashScene's job (story 6.1), not this scene's.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { levelForScore } from '../entities/progression/levels';
import { adManager } from '../systems/AdManager';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import * as SFX from '../audio/SFX';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameOverData } from '../types/sceneData';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { showBanner } from '../ui/Banner';
import { createButton } from '../ui/Button';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const TITLE_Y = GAME_HEIGHT * 0.16;
const SCORE_Y = GAME_HEIGHT * 0.31;
const RANK_Y = GAME_HEIGHT * 0.45;
const RANK_DESC_Y = GAME_HEIGHT * 0.53;
const VAULT_Y = GAME_HEIGHT * 0.6;
const PLAY_AGAIN_Y = GAME_HEIGHT * 0.73;
const DOUBLE_SCORE_Y = GAME_HEIGHT * 0.86;

/** How long the score takes to tick up, and how often it ticks audibly on the way. */
const COUNT_UP_MS = 900;
const TICK_EVERY_MS = 90;
/** Beat between the number settling and the rank landing — the pause is what makes the rank feel earned. */
const RANK_DELAY_MS = 260;

export class GameOverScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _scoreBanner!: Phaser.GameObjects.Text;
  private _rankLabel!: Phaser.GameObjects.Text;
  private _rankDesc!: Phaser.GameObjects.Text;
  private _doubleScoreButton: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);

    this.add
      .text(
        GAME_WIDTH / 2,
        TITLE_Y,
        "TIME'S UP!",
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);

    this._scoreBanner = showBanner(this, GAME_WIDTH / 2, SCORE_Y, '0');
    this._rankLabel = this.add
      .text(GAME_WIDTH / 2, RANK_Y, '', textStyle('displayL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5)
      .setAlpha(0);
    this._rankDesc = this.add
      .text(
        GAME_WIDTH / 2,
        RANK_DESC_Y,
        '',
        textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.add
      .text(
        GAME_WIDTH / 2,
        VAULT_Y,
        `${this._unlocks.getVault()} stars in the vault`,
        textStyle('bodyM', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: PLAY_AGAIN_Y,
      label: 'PLAY AGAIN',
      variant: 'primary',
      minWidth: 280,
      onClick: () => this.scene.start('SplashScene'),
    });

    this._buildDoubleScoreButton(data.score);
    this._countUpTo(data.score);
  }

  /**
   * Ticks the number up rather than printing it, with a sound every few
   * frames — the run's whole reward lands in this one beat, and a static
   * number gives the player nothing to watch.
   */
  private _countUpTo(score: number): void {
    if (score <= 0) {
      this._scoreBanner.setText('0');
      this._revealRank(0);
      return;
    }
    const counter = { value: 0 };
    let lastTickAt = 0;
    this.tweens.add({
      targets: counter,
      value: score,
      duration: COUNT_UP_MS,
      ease: EASE.standardOut,
      onUpdate: (tween) => {
        this._scoreBanner.setText(String(Math.round(counter.value)));
        const elapsed = tween.elapsed;
        if (elapsed - lastTickAt >= TICK_EVERY_MS) {
          lastTickAt = elapsed;
          SFX.playTick(false);
        }
      },
      onComplete: () => {
        this._scoreBanner.setText(String(score));
        this.time.delayedCall(RANK_DELAY_MS, () => this._revealRank(score));
      },
    });
  }

  /**
   * Lands the rank this score reached. Icons are deliberately not drawn:
   * `GrannyLevel.iconKey` points into an icon sprite sheet that doesn't
   * exist yet (`ICON_KEYS` is still empty), and a missing-texture box would
   * be worse than the label carrying it alone.
   */
  private _revealRank(score: number): void {
    const level = levelForScore(score);
    this._rankLabel.setText(level.label).setColor(level.col).setScale(0.6);
    this._rankDesc.setText(level.desc);

    this.tweens.add({
      targets: this._rankLabel,
      alpha: 1,
      scale: 1,
      duration: DURATION.celebration,
      ease: EASE.bouncy,
    });
    this.tweens.add({
      targets: this._rankDesc,
      alpha: 1,
      duration: DURATION.stateChange,
      delay: DURATION.stateChange,
    });
    SFX.playUpgrade(level.isTopTier ? 3 : 2);
  }

  /** CLAUDE.md §11.1/§11.3: optional, never gates the standard Play Again; never Mint Green; one reward per ad. */
  private _buildDoubleScoreButton(score: number): void {
    if (score <= 0) return; // nothing worth doubling
    this._doubleScoreButton = createButton(this, {
      x: GAME_WIDTH / 2,
      y: DOUBLE_SCORE_Y,
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
    this._doubleScoreButton?.destroy(); // one reward per ad
    this._doubleScoreButton = null;
    // Re-run the whole beat on the doubled score: the rank can genuinely
    // change, and that jump is the reason to have watched the ad.
    this._countUpTo(score * 2);
  }
}
