/**
 * The first beat of the results screen: the coin total as the hero number,
 * counting up large; the three stars landing one at a time, each as the
 * count passes its target; then the first-time star bonus joining the total,
 * a "NEW BEST!" tag or the best to beat, and one line saying how far the next
 * star is. The whole thing is one panel.
 */

import Phaser from 'phaser';

import { playStarChime } from '../audio/ResultsMusic';
import * as SFX from '../audio/SFX';
import { spawnConfetti } from '../entities/waterParticle/splashVFX';
import { MAX_STARS_PER_GIG } from '../systems/Progress';
import { formatCount } from '../systems/Rewards';
import type { GigResultData } from '../types/sceneData';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { drawCoinIcon, drawStarIcon } from './icons';
import { createPanel } from './Panel';

export interface ResultsScoreConfig {
  /** Centre of the panel. */
  readonly x: number;
  readonly y: number;
  readonly ribbon: string;
  readonly data: GigResultData;
}

export const RESULTS_SCORE_WIDTH = 760;
export const RESULTS_SCORE_HEIGHT = 208;

/** Offsets from the panel's centre. */
const NUMBER_Y = -36;
const COIN_RADIUS = 24;
const COIN_GAP = 30;
const STARS_Y = 36;
const STAR_SPACING = 90;
const STAR_RADIUS = 26;
const STAR_OUTLINE_PX = 5;
const SIDE_TEXT_OFFSET_X = 260;
const MESSAGE_Y = 81;
const TAG_X = 265;
const TAG_WIDTH = 150;
const TAG_HEIGHT = 40;

const FIRST_DELAY_MS = 350;
const COUNT_MS = 1500;
const BONUS_COUNT_MS = 450;
const TICK_EVERY_MS = 90;
const UNEARNED_STAR = 0xd8d4c6;
const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

export class ResultsScore {
  private readonly _scene: Phaser.Scene;
  private readonly _data: GigResultData;
  private readonly _x: number;
  private readonly _y: number;
  private readonly _number: Phaser.GameObjects.Text;
  private readonly _coin: Phaser.GameObjects.Graphics;
  private readonly _landed = new Set<number>();
  private readonly _slots: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: ResultsScoreConfig) {
    this._scene = scene;
    this._data = config.data;
    this._x = config.x;
    this._y = config.y;
    createPanel(scene, {
      x: config.x,
      y: config.y,
      width: RESULTS_SCORE_WIDTH,
      height: RESULTS_SCORE_HEIGHT,
      ribbon: config.ribbon,
    });
    this._number = scene.add
      .text(
        config.x,
        config.y + NUMBER_Y,
        '0',
        textStyle('displayXL', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
      )
      .setOrigin(0.5);
    this._coin = scene.add.graphics();
    drawCoinIcon(this._coin, COIN_RADIUS + 4, COLOUR.ink, COLOUR.ink);
    drawCoinIcon(this._coin, COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, 0.72));
    this._setNumber(0);
    this._buildStarSlots();
    this._buildBestLabel();
  }

  /** Runs the sequence; `onDone` fires once the number is final and the message is up. */
  start(onDone: () => void): void {
    const { score, starCoins } = this._data;
    const afterCount = (): void => {
      for (let i = 0; i < this._data.stars; i++) this._landStar(i);
      this._joinBonus(starCoins, () => {
        this._showTagAndMessage();
        onDone();
      });
    };
    this._scene.time.delayedCall(FIRST_DELAY_MS, () => {
      if (score <= 0) return afterCount();
      this.countTo(0, score, COUNT_MS, (value) => this._landPassedStars(value), afterCount);
    });
  }

  /** Counts the big number from one total to another, with ticks; used for the opening count and for doubling. */
  countTo(
    from: number,
    to: number,
    durationMs: number,
    onValue?: (value: number) => void,
    onDone?: () => void,
  ): void {
    const counter = { value: from };
    let lastTickAt = 0;
    this._scene.tweens.add({
      targets: counter,
      value: to,
      duration: to > from ? durationMs : 0,
      ease: EASE.standardOut,
      onUpdate: (tween) => {
        this._setNumber(counter.value);
        onValue?.(counter.value);
        if (tween.elapsed - lastTickAt >= TICK_EVERY_MS) {
          lastTickAt = tween.elapsed;
          SFX.playTick(false);
        }
      },
      onComplete: () => {
        this._setNumber(to);
        onDone?.();
      },
    });
  }

  private _setNumber(value: number): void {
    this._number.setText(formatCount(value));
    this._coin.setPosition(this._x - this._number.width / 2 - COIN_GAP, this._y + NUMBER_Y);
  }

  private _starX(i: number): number {
    return this._x + (i - 1) * STAR_SPACING;
  }

  private _buildStarSlots(): void {
    for (let i = 0; i < MAX_STARS_PER_GIG; i++) {
      const slot = this._scene.add.graphics({ x: this._starX(i), y: this._y + STARS_Y });
      drawStarIcon(slot, STAR_RADIUS + STAR_OUTLINE_PX, shade(UNEARNED_STAR, 0.8));
      drawStarIcon(slot, STAR_RADIUS, UNEARNED_STAR);
      this._slots.push(slot);
    }
  }

  private _landPassedStars(value: number): void {
    for (let i = 0; i < this._data.stars; i++) {
      if ((this._data.targets[i] ?? 0) <= value) this._landStar(i);
    }
  }

  private _landStar(i: number): void {
    if (this._landed.has(i) || i >= MAX_STARS_PER_GIG) return;
    this._landed.add(i);
    const star = this._scene.add.graphics({ x: this._starX(i), y: this._y + STARS_Y }).setScale(0);
    drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
    drawStarIcon(star, STAR_RADIUS, COLOUR.sunnyGold);
    playStarChime(i);
    this._scene.tweens.add({
      targets: star,
      scale: 1,
      duration: DURATION.celebration,
      ease: EASE.bouncy,
    });
    if (i === MAX_STARS_PER_GIG - 1) {
      this._scene.cameras.main.shake(160, 0.006);
      spawnConfetti(this._scene, this._starX(1), this._y + STARS_Y, CONFETTI_COLOURS);
    }
  }

  /** "Best 2,340" to the left of the stars, for a returning player who did not beat it. */
  private _buildBestLabel(): void {
    const { previousBest, isNewBest } = this._data;
    if (previousBest <= 0 || isNewBest) return;
    this._scene.add
      .text(
        this._x - SIDE_TEXT_OFFSET_X,
        this._y + STARS_Y,
        `Best ${formatCount(previousBest)}`,
        textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
  }

  /** The first-time star bonus pops in to the right of the stars and the total grows to include it. */
  private _joinBonus(starCoins: number, onDone: () => void): void {
    if (starCoins <= 0) return onDone();
    const bonus = this._scene.add
      .text(
        this._x + SIDE_TEXT_OFFSET_X - 120,
        this._y + STARS_Y,
        `+${formatCount(starCoins)} star bonus`,
        textStyle('bodyL', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
      )
      .setOrigin(0, 0.5)
      .setScale(0);
    this._scene.tweens.add({
      targets: bonus,
      scale: 1,
      duration: DURATION.stateChange,
      ease: EASE.bouncy,
    });
    this.countTo(this._data.score, this._data.score + starCoins, BONUS_COUNT_MS, undefined, onDone);
  }

  /** "NEW BEST!" beside the number for a returning player, and the one line about what is next. */
  private _showTagAndMessage(): void {
    const { previousBest, isNewBest, stars, score, targets } = this._data;
    if (isNewBest && previousBest > 0) this._popTag();
    const missing = stars < MAX_STARS_PER_GIG ? Math.max(1, (targets[stars] ?? 0) - score) : 0;
    const text =
      missing > 0 ? `${formatCount(missing)} more for the next star` : 'All three stars!';
    const message = this._scene.add
      .text(
        this._x,
        this._y + MESSAGE_Y,
        text,
        textStyle('bodyL', missing > 0 ? COLOUR_HEX.grannyPink : COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5)
      .setAlpha(0);
    this._scene.tweens.add({
      targets: message,
      alpha: 1,
      duration: DURATION.stateChange,
      ease: EASE.standardOut,
    });
  }

  private _popTag(): void {
    const tag = this._scene.add.container(this._x + TAG_X, this._y + NUMBER_Y);
    const body = this._scene.add.graphics();
    body.fillStyle(COLOUR.grannyPink, 1);
    body.fillRoundedRect(
      -TAG_WIDTH / 2,
      -TAG_HEIGHT / 2,
      TAG_WIDTH,
      TAG_HEIGHT,
      pillRadius(TAG_WIDTH, TAG_HEIGHT),
    );
    body.lineStyle(4, COLOUR.ink, 1);
    body.strokeRoundedRect(
      -TAG_WIDTH / 2,
      -TAG_HEIGHT / 2,
      TAG_WIDTH,
      TAG_HEIGHT,
      pillRadius(TAG_WIDTH, TAG_HEIGHT),
    );
    const label = this._scene.add
      .text(0, 0, 'NEW BEST!', textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0.5);
    tag.add([body, label]);
    tag.setScale(0);
    this._scene.tweens.add({
      targets: tag,
      scale: 1,
      duration: DURATION.celebration,
      ease: EASE.bouncy,
    });
    playStarChime(1);
  }
}
