/**
 * The first beat of the results screen, said once and quickly: the coin total
 * counting up (about 0.6 s) on the left, the three stars landing one after
 * another on the right, and one line underneath about what the next star
 * needs. A missed gig is "Almost!" with empty stars, never a red screen. The
 * Big Finish has already shown the stars on the wall, so this is not a show.
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
import { nextStarLine } from './resultsLines';

export interface ResultsScoreConfig {
  /** Centre of the panel. */
  readonly x: number;
  readonly y: number;
  readonly ribbon: string;
  readonly data: GigResultData;
  /** The gig's best stars now that this play is banked: at 3 the line says it is finished. */
  readonly bestStars: number;
}

export const RESULTS_SCORE_WIDTH = 760;
export const RESULTS_SCORE_HEIGHT = 176;

/** Offsets from the panel's centre (the ribbon takes the top 27 px of its middle). */
const MAIN_ROW_Y = -4;
const MESSAGE_Y = 62;
const LEFT_COLUMN_X = -170;
const STARS_CENTRE_X = 205;
const NUMBER_MAX_WIDTH = 330;
const COIN_RADIUS = 22;
const COIN_GAP = 26;
const STAR_SPACING = 72;
const STAR_RADIUS = 22;
const STAR_OUTLINE_PX = 4;
const SLOT_X = 185;
const SLOT_MAX_WIDTH = 340;
const TAG_X = -250;
const TAG_Y = -62;
const TAG_WIDTH = 130;
const TAG_HEIGHT = 32;
const TAG_OUTLINE_PX = 4;

const FIRST_DELAY_MS = 150;
const COUNT_MS = 600;
const STAR_STAGGER_MS = 130;
const BONUS_COUNT_MS = 300;
const TICK_EVERY_MS = 90;
const UNEARNED_STAR = 0xd8d4c6;
const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

export class ResultsScore {
  private readonly _scene: Phaser.Scene;
  private readonly _data: GigResultData;
  private readonly _x: number;
  private readonly _y: number;
  private readonly _missed: boolean;
  private readonly _bestStars: number;
  private readonly _number: Phaser.GameObjects.Text;
  private readonly _coin: Phaser.GameObjects.Graphics;
  private readonly _slots: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: ResultsScoreConfig) {
    this._scene = scene;
    this._data = config.data;
    this._x = config.x;
    this._y = config.y;
    this._missed = config.data.stars <= 0;
    this._bestStars = config.bestStars;
    createPanel(scene, {
      x: config.x,
      y: config.y,
      width: RESULTS_SCORE_WIDTH,
      height: RESULTS_SCORE_HEIGHT,
      ribbon: config.ribbon,
    });
    this._number = scene.add
      .text(
        config.x + LEFT_COLUMN_X,
        config.y + MAIN_ROW_Y,
        this._missed ? 'Almost!' : '0',
        textStyle(
          'displayXL',
          this._missed ? COLOUR_HEX.grannyPink : COLOUR_HEX.sunnyGold,
          COLOUR_HEX.ink,
        ),
      )
      .setOrigin(0.5);
    this._coin = scene.add.graphics();
    drawCoinIcon(this._coin, COIN_RADIUS + 4, COLOUR.ink, COLOUR.ink);
    drawCoinIcon(this._coin, COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, 0.72));
    this._coin.setVisible(!this._missed);
    if (!this._missed) this._setNumber(0);
    this._buildStarSlots();
  }

  /** Runs the sequence; `onDone` fires once the stars have landed and the line is up. */
  start(onDone: () => void): void {
    const { score, starCoins, stars } = this._data;
    const finish = (): void => {
      this._showLine();
      onDone();
    };
    const afterCount = (): void => {
      for (let i = 0; i < stars; i++) {
        this._scene.time.delayedCall(i * STAR_STAGGER_MS, () => this._landStar(i));
      }
      this._scene.time.delayedCall(stars * STAR_STAGGER_MS, () =>
        this._joinBonus(starCoins, finish),
      );
    };
    this._scene.time.delayedCall(FIRST_DELAY_MS, () => {
      if (this._missed || score <= 0) return afterCount();
      this._countTo(0, score, COUNT_MS, afterCount);
    });
  }

  private _countTo(from: number, to: number, durationMs: number, onDone: () => void): void {
    const counter = { value: from };
    let lastTickAt = 0;
    this._scene.tweens.add({
      targets: counter,
      value: to,
      duration: durationMs,
      ease: EASE.standardOut,
      onUpdate: (tween) => {
        this._setNumber(counter.value);
        if (tween.elapsed - lastTickAt >= TICK_EVERY_MS) {
          lastTickAt = tween.elapsed;
          SFX.playTick(false);
        }
      },
      onComplete: () => {
        this._setNumber(to);
        onDone();
      },
    });
  }

  private _setNumber(value: number): void {
    this._number.setText(formatCount(value));
    this._number.setScale(1);
    if (this._number.width > NUMBER_MAX_WIDTH)
      this._number.setScale(NUMBER_MAX_WIDTH / this._number.width);
    this._coin.setPosition(
      this._number.x - this._number.displayWidth / 2 - COIN_GAP,
      this._number.y,
    );
  }

  private _starX(i: number): number {
    return this._x + STARS_CENTRE_X + (i - 1) * STAR_SPACING;
  }

  private _starY(): number {
    return this._y + MAIN_ROW_Y;
  }

  private _buildStarSlots(): void {
    for (let i = 0; i < MAX_STARS_PER_GIG; i++) {
      const slot = this._scene.add.graphics({ x: this._starX(i), y: this._starY() });
      drawStarIcon(slot, STAR_RADIUS + STAR_OUTLINE_PX, shade(UNEARNED_STAR, 0.8));
      drawStarIcon(slot, STAR_RADIUS, UNEARNED_STAR);
      this._slots.push(slot);
    }
  }

  private _landStar(i: number): void {
    const star = this._scene.add.graphics({ x: this._starX(i), y: this._starY() }).setScale(0);
    drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
    drawStarIcon(star, STAR_RADIUS, COLOUR.sunnyGold);
    playStarChime(i);
    this._scene.tweens.add({
      targets: star,
      scale: 1,
      duration: DURATION.stateChange * 2,
      ease: EASE.bouncy,
    });
    if (i === MAX_STARS_PER_GIG - 1) {
      this._scene.cameras.main.shake(160, 0.006);
      spawnConfetti(this._scene, this._starX(1), this._starY(), CONFETTI_COLOURS);
    }
  }

  /** The first-time star bonus joins the total; its words go in the line below. */
  private _joinBonus(starCoins: number, onDone: () => void): void {
    if (starCoins <= 0) return onDone();
    this._countTo(this._data.score, this._data.score + starCoins, BONUS_COUNT_MS, onDone);
  }

  /** One line under the main row: what was earned or beaten on the left, what the next star needs on the right. */
  private _showLine(): void {
    const { previousBest, isNewBest, score, starCoins } = this._data;
    if (isNewBest && previousBest > 0) this._popTag();
    const next = nextStarLine(this._data, formatCount);
    // Only after a pass: after a miss the line says what the first star needs.
    const done =
      !this._missed && this._bestStars >= MAX_STARS_PER_GIG ? 'All three stars here!' : null;
    const left = this._missed
      ? { text: `You still earned ${formatCount(score)} coins`, hex: COLOUR_HEX.ink }
      : starCoins > 0
        ? { text: `+${formatCount(starCoins)} star bonus`, hex: COLOUR_HEX.sunnyGold }
        : previousBest > 0 && !isNewBest
          ? { text: `Best ${formatCount(previousBest)}`, hex: COLOUR_HEX.softSlate }
          : null;
    const right = done
      ? { text: done, hex: COLOUR_HEX.ink }
      : next
        ? { text: next, hex: COLOUR_HEX.grannyPink }
        : null;
    if (left && right) {
      this._line(left.text, left.hex, -SLOT_X);
      this._line(right.text, right.hex, SLOT_X);
    } else if (right ?? left) {
      const only = right ?? left;
      if (only) this._line(only.text, only.hex, 0);
    }
  }

  private _line(text: string, hex: string, offsetX: number): void {
    const label = this._scene.add
      .text(this._x + offsetX, this._y + MESSAGE_Y, text, textStyle('bodyL', hex, COLOUR_HEX.cloud))
      .setOrigin(0.5)
      .setAlpha(0);
    if (label.width > SLOT_MAX_WIDTH) label.setScale(SLOT_MAX_WIDTH / label.width);
    this._scene.tweens.add({
      targets: label,
      alpha: 1,
      duration: DURATION.stateChange,
      ease: EASE.standardOut,
    });
  }

  private _popTag(): void {
    const tag = this._scene.add.container(this._x + TAG_X, this._y + TAG_Y);
    const body = this._scene.add.graphics();
    const radius = pillRadius(TAG_WIDTH, TAG_HEIGHT);
    body.fillStyle(COLOUR.grannyPink, 1);
    body.fillRoundedRect(-TAG_WIDTH / 2, -TAG_HEIGHT / 2, TAG_WIDTH, TAG_HEIGHT, radius);
    body.lineStyle(TAG_OUTLINE_PX, COLOUR.ink, 1);
    body.strokeRoundedRect(-TAG_WIDTH / 2, -TAG_HEIGHT / 2, TAG_WIDTH, TAG_HEIGHT, radius);
    const label = this._scene.add
      .text(0, 0, 'NEW BEST!', textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
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
