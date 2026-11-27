/**
 * The looks of the stage's messages: a banner that lands and fades by itself
 * (SPLASH FRENZY, BIG FINISH, a star earned) and the count-down number that
 * pops big and shrinks away. Each asks the scene's stage for the spot, so it
 * only appears if it wins it (`BigMessageStage`).
 */

import type Phaser from 'phaser';

import { FINAL_COUNTDOWN_SECONDS } from '../../config';
import { showBanner } from '../../ui/Banner';
import { COLOUR_HEX } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';
import { stageFor, STAGE_X, STAGE_Y, textBox, visualOf } from './BigMessageStage';
import { STAGE_PRIORITY, type StagePriority, type StageTie } from './stageRules';

/** A banner's fade-out once its hold is over, ms. */
const BANNER_FADE_MS = DURATION.stateChange;
/** The banner sits above the vignette flashes and the HUD. */
const MESSAGE_DEPTH = 300;
/** The count-down number pops in at this scale and shrinks to 1 while it fades, over this long. */
const NUMBER_START_SCALE = 2.2;
const NUMBER_MS = 750;
const NUMBER_STROKE_PX = 10;
/** Count-down sizes (px): the final numbers biggest. */
const NUMBER_SIZE_FINAL = 110;
const NUMBER_SIZE_FIVE = 90;
const NUMBER_SIZE_OTHER = 72;
const FIVE_SECONDS = 5;
/** The count-down's final numbers are this red, a fixed alarm colour outside the palette. */
const ALARM_RED = '#FF2200';

export interface StageBannerOptions {
  /** How long it stays after landing before it fades, ms. */
  readonly holdMs: number;
  readonly tie?: StageTie;
  readonly fillHex?: string;
  /** A smaller banner: the Display L tier instead of Display XL. */
  readonly small?: boolean;
}

/** Shows a banner on the stage; it lands, holds, fades, and frees the stage. Returns whether it won the stage. */
export function showStageBanner(
  scene: Phaser.Scene,
  priority: StagePriority,
  text: string,
  options: StageBannerOptions,
): boolean {
  return stageFor(scene).show(priority, options.tie ?? 'replace', (done) => {
    const banner = showBanner(
      scene,
      STAGE_X,
      STAGE_Y,
      text,
      options.fillHex,
      options.small ? 'displayL' : 'displayXL',
    ).setDepth(MESSAGE_DEPTH);
    const fade = scene.time.delayedCall(DURATION.celebration + options.holdMs, () => {
      scene.tweens.add({
        targets: banner,
        alpha: 0,
        duration: BANNER_FADE_MS,
        onComplete: () => {
          banner.destroy();
          done();
        },
      });
    });
    const visual = visualOf(scene, [banner], textBox(banner, STAGE_X, STAGE_Y));
    return {
      bounds: visual.bounds,
      dismiss: () => {
        fade.remove(false);
        visual.dismiss();
      },
    };
  });
}

/**
 * The big count-down number (or "20 SECONDS!") popping over the wall: each one
 * replaces the last, and a Frenzy banner or anything above it wins over it.
 * `seconds` picks the size and the colour (the last three are alarm red).
 */
export function showCountdownNumber(
  scene: Phaser.Scene,
  label: string,
  seconds: number,
  size?: number,
): boolean {
  const final = seconds <= FINAL_COUNTDOWN_SECONDS;
  const fontSize =
    size ??
    (final ? NUMBER_SIZE_FINAL : seconds <= FIVE_SECONDS ? NUMBER_SIZE_FIVE : NUMBER_SIZE_OTHER);
  const colour = final ? ALARM_RED : COLOUR_HEX.heatOrange;
  return stageFor(scene).show(STAGE_PRIORITY.countdown, 'replace', (done) => {
    const text = scene.add
      .text(STAGE_X, STAGE_Y, label, {
        ...textStyle('displayXL', colour, COLOUR_HEX.ink),
        fontSize: `${fontSize}px`,
        strokeThickness: NUMBER_STROKE_PX,
      })
      .setOrigin(0.5)
      .setDepth(MESSAGE_DEPTH)
      .setAlpha(0)
      .setScale(NUMBER_START_SCALE);
    scene.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0 },
      scale: 1,
      duration: NUMBER_MS,
      ease: EASE.standardOut,
      onComplete: () => {
        text.destroy();
        done();
      },
    });
    return visualOf(scene, [text], textBox(text, STAGE_X, STAGE_Y));
  });
}
