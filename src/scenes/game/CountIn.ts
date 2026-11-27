/**
 * How a gig opens: the band counts itself in. "3", "2", "1", "GO!" punch in
 * at the centre of the wall, one per beat at the venue's tempo, each with a
 * pulse from every instrument and a stick click; the music's quiet bed plays
 * underneath from the first count. GO hands over to the gig proper (clock,
 * coins, visitors, Poki's gameplayStart).
 *
 * When the player has just clicked to get here the count starts by itself
 * after a short pause. A launch with no click (a first-ever launch, a review
 * link) cannot play sound or tell Poki gameplay has begun, so it shows a
 * pulsing TAP TO START first, and the tap starts the same count.
 */

import Phaser from 'phaser';

import { audioBus } from '../../audio/AudioBus';
import { audioOrchestra } from '../../audio/AudioOrchestra';
import { GAME_WIDTH, WALL_AREA } from '../../config';
import type { Spinner } from '../../entities/spinner/Spinner';
import { createButton } from '../../ui/Button';
import { COLOUR_HEX } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';
import { stageFor, textBox, visualOf, type StageVisual } from './BigMessageStage';
import { STAGE_PRIORITY } from './stageRules';
import { COUNT_IN_DELAY_MS, COUNT_LABELS, GO_INDEX, beatMs, countInOffsets } from './countInTiming';

/** Centre of the wall, where the numbers and the tap button sit. */
const CENTRE_X = GAME_WIDTH / 2;
const CENTRE_Y = WALL_AREA.y + WALL_AREA.height / 2;
const DEPTH = 400;

/** The numbers are far larger than any other type; they are the screen for a moment. */
const COUNT_FONT_PX = 168;
const COUNT_STROKE_PX = 12;
const GO_FONT_PX = 220;
const GO_STROKE_PX = 14;
/** A count lands this much too big and settles; GO also swells and fades. */
const COUNT_LAND_SCALE = 1.6;
const GO_LAND_SCALE = 1.3;
const GO_FADE_SCALE = 1.5;
/** A count fades over the last part of its beat so the next lands on a clear wall. */
const COUNT_FADE_FRACTION = 0.4;
const GO_HOLD_MS = 320;
const GO_FADE_MS = 360;

/** How hard every instrument kicks on a count, and on GO. */
const COUNT_PULSE = 0.55;
const GO_PULSE = 1;

const TAP_PULSE_SCALE = 1.06;
const TAP_PULSE_MS = 520;
const TAP_LABEL = 'TAP TO START';
const TAP_MIN_WIDTH = 440;

type CountInState = 'waiting' | 'delay' | 'counting' | 'live';

/** What the count-in reads from, and tells, the rest of the scene. */
export interface CountInDeps {
  readonly scene: Phaser.Scene;
  readonly worldId: string;
  /** Beats per minute of the venue's score: the count goes at this tempo. */
  readonly bpm: number;
  /** Where each musician sits across the wall, -1..1, for seating the orchestra. */
  readonly pans: readonly number[];
  readonly spinners: () => readonly Spinner[];
  /** True when a real click led here: count in unprompted. False: ask for a tap first. */
  readonly playerClicked: boolean;
  /** The count has started ("3" is up): first-run hints begin. */
  readonly onBegin: () => void;
  /** GO: the gig starts. */
  readonly onGo: () => void;
}

export class CountIn {
  private _state: CountInState = 'waiting';
  private _musicStarted = false;
  private readonly _timers: Phaser.Time.TimerEvent[] = [];
  private _tapButton: Phaser.GameObjects.Container | null = null;
  private _label: Phaser.GameObjects.Text | null = null;

  constructor(private readonly _d: CountInDeps) {}

  /** True from the first count until GO — the span in which pausing is allowed. */
  get counting(): boolean {
    return this._state === 'counting';
  }

  /** Opens the gig: count in by itself after a click, or ask for a tap. Call once from create(). */
  open(): void {
    if (this._d.playerClicked) {
      this._state = 'delay';
      this._timers.push(this._d.scene.time.delayedCall(COUNT_IN_DELAY_MS, () => this._begin()));
      return;
    }
    this._showTapButton();
  }

  /** The player's first input: starts the count if it was waiting on one. */
  tap(): void {
    if (this._state === 'waiting') this._begin();
  }

  /** Straight to GO with no count — the balance bot's way in. Safe from any state. */
  skipToGo(): void {
    if (this._state === 'live') return;
    this._clear();
    this._startMusic();
    this._go();
  }

  private _begin(): void {
    if (this._state === 'counting' || this._state === 'live') return;
    this._state = 'counting';
    this._clear();
    this._startMusic();
    this._d.onBegin();
    countInOffsets(this._d.bpm).forEach((offset, i) => {
      if (i === 0) this._count(0);
      else this._timers.push(this._d.scene.time.delayedCall(offset, () => this._count(i)));
    });
  }

  /** One beat of the count: the word, the click and the band's pulse. */
  private _count(index: number): void {
    const isGo = index === GO_INDEX;
    audioOrchestra.tick(isGo);
    for (const spinner of this._d.spinners()) spinner.pulse(isGo ? GO_PULSE : COUNT_PULSE);
    this._showWord(COUNT_LABELS[index] ?? '', isGo);
    if (isGo) this._go();
  }

  private _go(): void {
    this._state = 'live';
    this._d.onGo();
  }

  /** The AudioContext needs a gesture (the click that brought us here); the bed plays under the counts. */
  private _startMusic(): void {
    if (this._musicStarted) return;
    this._musicStarted = true;
    audioBus.init();
    audioBus.resume();
    audioBus.fadeIn(0);
    audioOrchestra.start(this._d.worldId, this._d.pans);
  }

  private _showWord(word: string, isGo: boolean): void {
    const scene = this._d.scene;
    this._label?.destroy();
    // The count is a stage message (count-in priority), so nothing else is printed over it.
    stageFor(scene).show(STAGE_PRIORITY.countIn, 'replace', (done) =>
      this._presentWord(word, isGo, done),
    );
  }

  private _presentWord(word: string, isGo: boolean, done: () => void): StageVisual {
    const scene = this._d.scene;
    const style = textStyle(
      'displayXL',
      isGo ? COLOUR_HEX.sunnyGold : COLOUR_HEX.cloud,
      COLOUR_HEX.ink,
    );
    const label = scene.add
      .text(CENTRE_X, CENTRE_Y, word, {
        ...style,
        fontSize: `${isGo ? GO_FONT_PX : COUNT_FONT_PX}px`,
        strokeThickness: isGo ? GO_STROKE_PX : COUNT_STROKE_PX,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH)
      .setScale(isGo ? GO_LAND_SCALE : COUNT_LAND_SCALE);
    this._label = label;
    scene.tweens.add({
      targets: label,
      scale: 1,
      duration: DURATION.stateChange,
      ease: EASE.bouncy,
    });
    const beat = beatMs(this._d.bpm);
    scene.tweens.add({
      targets: label,
      alpha: 0,
      ...(isGo ? { scale: GO_FADE_SCALE } : {}),
      delay: isGo ? GO_HOLD_MS : beat * (1 - COUNT_FADE_FRACTION),
      duration: isGo ? GO_FADE_MS : beat * COUNT_FADE_FRACTION,
      onComplete: () => {
        if (this._label === label) this._label = null;
        label.destroy();
        done();
      },
    });
    return visualOf(scene, [label], textBox(label, CENTRE_X, CENTRE_Y));
  }

  private _showTapButton(): void {
    const scene = this._d.scene;
    const button = createButton(scene, {
      x: CENTRE_X,
      y: CENTRE_Y,
      label: TAP_LABEL,
      variant: 'primary',
      size: 'lg',
      minWidth: TAP_MIN_WIDTH,
      onClick: () => this.tap(),
    }).setDepth(DEPTH);
    scene.tweens.add({
      targets: button,
      scale: TAP_PULSE_SCALE,
      duration: TAP_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: EASE.standardOut,
    });
    this._tapButton = button;
  }

  /** Drops the tap button and any pending count timers. */
  private _clear(): void {
    for (const timer of this._timers) timer.remove();
    this._timers.length = 0;
    const button = this._tapButton;
    this._tapButton = null;
    if (button) {
      this._d.scene.tweens.killTweensOf(button);
      button.destroy();
    }
    if (this._state !== 'counting') {
      this._label?.destroy();
      this._label = null;
    }
  }
}
