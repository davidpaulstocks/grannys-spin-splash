/**
 * The Big Finish: the ending on the wall between the final whistle and the
 * results screen, about three seconds long. A banner lands, then every
 * instrument takes a bow from left to right: one still playing pops, throws
 * its bonus coins to the counter and shows "+N"; a quiet one just dims. Coins
 * go into the gig total before it is banked, so they can tip the player over
 * a star. If the whole band is at full speed it is a FULL BAND FINISH with
 * double the bonus and a gold burst. The last beat slams the stars earned
 * large on the wall, then the results screen takes over. A tap or Space after
 * the first second skips straight to the results. Rules are in
 * `bigFinishRules.ts`.
 */

import Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import type { Spinner } from '../../entities/spinner/Spinner';
import { spawnSparks } from '../../entities/waterParticle/splashVFX';
import { hideBanner, showBanner } from '../../ui/Banner';
import { spawnFloatingText } from '../../ui/FloatingText';
import { drawStarIcon } from '../../ui/icons';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';
import { finishVerdict, planBows, type Bow, type FinishPlan } from './bigFinishRules';
import type { RewardLoop } from './RewardLoop';

/** The banner lands over this long, then the cascade starts. */
const CASCADE_START_MS = 500;
const BANNER_HOLD_MS = 700;
/** A bow's pop lasts this long; the verdict waits for the last one to settle. */
const BOW_POP_MS = 160;
const BOW_POP_SCALE = 1.3;
const BOW_SETTLE_MS = 250;
/** A quiet instrument dims to this opacity. */
const DIM_ALPHA = 0.4;
const DIM_MS = 200;
/** How long the stars stay on the wall before the results screen. */
const VERDICT_HOLD_MS = 800;
/** A tap or Space skips only after this long. */
const SKIP_AFTER_MS = 1000;

const DEPTH = 300;
const BANNER_Y = GAME_HEIGHT * 0.5;
const BOW_TEXT_LIFT_PX = 12;
const BOW_PULSE = 1;
const FULL_BAND_SPARK_BURSTS = 6;
const FULL_BAND_SPARK_MARGIN = 160;

const VERDICT_Y = GAME_HEIGHT * 0.44;
const VERDICT_STAR_SPACING = 168;
const VERDICT_STAR_RADIUS = 64;
const VERDICT_STAR_OUTLINE_PX = 6;
const VERDICT_STAR_SLAM_SCALE = 3;
const VERDICT_STAR_SLAM_MS = 280;
const VERDICT_STAR_STAGGER_MS = 140;
const VERDICT_UNLIT = 0xd8d4c6;
const VERDICT_UNLIT_ALPHA = 0.6;
const VERDICT_WORD_OFFSET_Y = 116;
const SHADE_ALPHA = 0.4;

/** What the finish needs from the scene. */
export interface BigFinishDeps {
  readonly scene: Phaser.Scene;
  readonly spinners: () => readonly Spinner[];
  readonly reward: RewardLoop;
  /** The gun's coin boost, a factor in every bow. */
  readonly coinBoost: number;
  /** Redraws the HUD, so the counter and the star bar follow the bow coins. */
  readonly refreshHud: () => void;
  /** Stops the water: nothing may keep flying while the band bows. */
  readonly quietWater: () => void;
  /** Banks the gig and starts the results screen. */
  readonly bank: () => void;
}

export class BigFinish {
  private _plan: FinishPlan = { bows: [], fullBand: false, cascadeMs: 0 };
  private readonly _bowed = new Set<number>();
  private _startedAt = 0;
  private _chordPlayed = false;
  private _done = false;

  constructor(private readonly _d: BigFinishDeps) {}

  /** Starts the finish at the final whistle. Call once. */
  run(): void {
    const d = this._d;
    const scene = d.scene;
    d.quietWater();
    this._startedAt = scene.time.now;

    const band = d.spinners();
    this._plan = planBows(
      band.map((s) => ({ x: s.x, state: s.playingState })),
      d.reward.groove.level,
      d.coinBoost,
    );

    const banner = showBanner(
      scene,
      GAME_WIDTH / 2,
      BANNER_Y,
      this._plan.fullBand ? 'FULL BAND FINISH!' : 'BIG FINISH!',
    ).setDepth(DEPTH);
    scene.time.delayedCall(BANNER_HOLD_MS, () => hideBanner(scene, banner));
    if (this._plan.fullBand) audioOrchestra.accent('cheer');

    for (const bow of this._plan.bows) {
      scene.time.delayedCall(CASCADE_START_MS + bow.delayMs, () => this._bow(bow));
    }
    const verdictAt = CASCADE_START_MS + this._plan.cascadeMs + BOW_SETTLE_MS;
    scene.time.delayedCall(verdictAt, () => this._showVerdict());

    scene.events.on(Phaser.Scenes.Events.UPDATE, this._onUpdate, this);
    scene.input.on('pointerdown', this._onSkip, this);
    scene.input.keyboard?.on('keydown-SPACE', this._onSkip, this);
  }

  private readonly _onUpdate = (): void => {
    if (!this._done) this._d.refreshHud();
  };

  private readonly _onSkip = (): void => {
    if (this._done || this._d.scene.time.now - this._startedAt < SKIP_AFTER_MS) return;
    // Every bow still owed pays out unseen, so skipping costs the player nothing.
    for (const bow of this._plan.bows) this._bow(bow, false);
    this._complete();
  };

  /** One instrument's bow: pop, coins and chime if it is still playing; a dim if it is quiet. */
  private _bow(bow: Bow, show = true): void {
    if (this._bowed.has(bow.index)) return;
    this._bowed.add(bow.index);
    const spinner = this._d.spinners()[bow.index];
    if (!spinner) return;
    const scene = this._d.scene;

    if (!bow.spinning) {
      if (show) scene.tweens.add({ targets: spinner, alpha: DIM_ALPHA, duration: DIM_MS });
      else spinner.setAlpha(DIM_ALPHA);
      return;
    }
    if (!show) {
      this._d.reward.addCoins(bow.bonus);
      return;
    }
    this._d.reward.payBurst([{ x: spinner.x, y: spinner.y }], bow.bonus);
    spinner.pulse(BOW_PULSE);
    scene.tweens.add({
      targets: spinner,
      scale: BOW_POP_SCALE,
      duration: BOW_POP_MS,
      ease: EASE.standardOut,
      yoyo: true,
    });
    spawnFloatingText(
      scene,
      spinner.x,
      spinner.y - spinner.def.r - BOW_TEXT_LIFT_PX,
      `+${bow.bonus}`,
      COLOUR_HEX.sunnyGold,
    );
    audioOrchestra.accent('combo', bow.chimeLevel);
    if (this._plan.fullBand) {
      spawnSparks(scene, spinner.x, spinner.y, COLOUR.sunnyGold);
      this._confetti(bow.index);
    }
  }

  /** A gold burst somewhere across the wall now and then through a full-band cascade. */
  private _confetti(place: number): void {
    const bows = this._plan.bows.length;
    if (bows === 0 || place % Math.max(1, Math.ceil(bows / FULL_BAND_SPARK_BURSTS)) !== 0) return;
    const x = Phaser.Math.Between(FULL_BAND_SPARK_MARGIN, GAME_WIDTH - FULL_BAND_SPARK_MARGIN);
    const y = Phaser.Math.Between(FULL_BAND_SPARK_MARGIN, GAME_HEIGHT / 2);
    spawnSparks(this._d.scene, x, y, COLOUR.sunnyGold);
  }

  /** The last beat: the stars earned slam in large on the wall, with their word, then the results. */
  private _showVerdict(): void {
    if (this._done) return;
    const scene = this._d.scene;
    const stars = this._d.reward.stars;
    this._playClosingChord();

    const shade = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.ink, 0)
      .setOrigin(0)
      .setDepth(DEPTH - 1);
    scene.tweens.add({ targets: shade, alpha: SHADE_ALPHA, duration: DURATION.stateChange });

    for (let i = 0; i < 3; i++) {
      const lit = i < stars;
      const star = scene.add
        .graphics({ x: GAME_WIDTH / 2 + (i - 1) * VERDICT_STAR_SPACING, y: VERDICT_Y })
        .setDepth(DEPTH);
      drawStarIcon(star, VERDICT_STAR_RADIUS + VERDICT_STAR_OUTLINE_PX, COLOUR.ink);
      drawStarIcon(star, VERDICT_STAR_RADIUS, lit ? COLOUR.sunnyGold : VERDICT_UNLIT);
      if (!lit) {
        star.setAlpha(VERDICT_UNLIT_ALPHA);
        continue;
      }
      star.setScale(VERDICT_STAR_SLAM_SCALE).setAlpha(0);
      scene.tweens.add({
        targets: star,
        scale: 1,
        alpha: 1,
        delay: i * VERDICT_STAR_STAGGER_MS,
        duration: VERDICT_STAR_SLAM_MS,
        ease: EASE.standardIn,
      });
    }
    const word = scene.add
      .text(
        GAME_WIDTH / 2,
        VERDICT_Y + VERDICT_WORD_OFFSET_Y,
        finishVerdict(stars),
        textStyle('displayXL', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
      )
      .setOrigin(0.5)
      .setDepth(DEPTH)
      .setScale(VERDICT_STAR_SLAM_SCALE)
      .setAlpha(0);
    scene.tweens.add({
      targets: word,
      scale: 1,
      alpha: 1,
      duration: VERDICT_STAR_SLAM_MS,
      ease: EASE.standardIn,
    });

    const landed = Math.max(0, stars - 1) * VERDICT_STAR_STAGGER_MS + VERDICT_STAR_SLAM_MS;
    scene.time.delayedCall(landed + VERDICT_HOLD_MS, () => this._complete());
  }

  /** The closing chord lands with the stars, once. */
  private _playClosingChord(): void {
    if (this._chordPlayed) return;
    this._chordPlayed = true;
    audioOrchestra.finish();
  }

  /** Banks the gig, with every bow in its total, and hands over to the results screen. */
  private _complete(): void {
    if (this._done) return;
    this._done = true;
    const scene = this._d.scene;
    scene.events.off(Phaser.Scenes.Events.UPDATE, this._onUpdate, this);
    scene.input.off('pointerdown', this._onSkip, this);
    scene.input.keyboard?.off('keydown-SPACE', this._onSkip, this);
    this._playClosingChord();
    this._d.bank();
  }
}
