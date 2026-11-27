/**
 * The hero shot's words: when the camera has pulled back to the whole gun, its
 * name slams in very large beneath it with a short underline in the rarity
 * colour, then the rarity tag. When the film moves on, the name slides and
 * shrinks to its place in the numbers' layout; the underline and the big tag
 * go. The gun, the rays and the rings are the film's, not this file's.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { COLOUR_HEX } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';
import { addPowerPill, rarityColour, rarityLabel } from '../gunRarity';
import { SHRINK_MS, cubicInOut } from './filmMaths';
import type { RevealCtx } from './RevealTracker';
import { REVEAL_LAYOUT } from './revealTiming';

const CENTRE_X = GAME_WIDTH / 2;
/** The name is Display XL at the hero shot, up to this much bigger, and never wider than the max below. */
const HERO_NAME_SCALE = 1.5;
const HERO_NAME_MAX_WIDTH = 1100;
/** In the numbers' layout it is Display L (48 of 64 px), never wider than this. */
const SLOT_NAME_SCALE = 0.75;
const SLOT_NAME_MAX_WIDTH = 900;
const SLAM_FROM = 2.4;
const SLAM_MS = 200;
const UNDERLINE_SHARE = 0.5;
const UNDERLINE_HEIGHT = 8;
const UNDERLINE_MS = 260;
const TAG_SCALE = 2.2;
const TAG_MS = DURATION.stateChange;

export class HeroShot {
  readonly name: Phaser.GameObjects.Text;
  private readonly _underline: Phaser.GameObjects.Rectangle;
  private readonly _pill: Phaser.GameObjects.Container;
  private readonly _heroScale: number;
  private readonly _slotScale: number;

  constructor(
    private readonly _ctx: RevealCtx,
    gun: GunDef,
  ) {
    const { scene, root } = _ctx;
    this.name = scene.add
      .text(
        CENTRE_X,
        REVEAL_LAYOUT.hero.nameY,
        gun.name,
        textStyle('displayXL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
      )
      .setOrigin(0.5)
      .setAlpha(0);
    this._heroScale = Math.min(HERO_NAME_SCALE, HERO_NAME_MAX_WIDTH / this.name.width);
    this._slotScale = Math.min(SLOT_NAME_SCALE, SLOT_NAME_MAX_WIDTH / this.name.width);
    this.name.setScale(this._heroScale);
    this._underline = scene.add
      .rectangle(
        CENTRE_X,
        REVEAL_LAYOUT.hero.underlineY,
        this.name.width * this._heroScale * UNDERLINE_SHARE,
        UNDERLINE_HEIGHT,
        rarityColour(gun.rarity),
      )
      .setScale(0, 1);
    this._pill = addPowerPill(
      scene,
      CENTRE_X,
      REVEAL_LAYOUT.hero.tagY,
      rarityLabel(gun.rarity),
      gun.rarity,
    ).setScale(0);
    root.add([this.name, this._underline, this._pill]);
  }

  /** The name slams in, big, and the underline draws itself under it. */
  landName(instant: boolean): void {
    if (instant) {
      this.name.setAlpha(1).setScale(this._heroScale);
      this._underline.setScale(1, 1);
      return;
    }
    const { tracker } = this._ctx;
    this.name.setAlpha(0).setScale(this._heroScale * SLAM_FROM);
    tracker.tween({
      targets: this.name,
      alpha: 1,
      scale: this._heroScale,
      duration: SLAM_MS,
      ease: EASE.standardOut,
    });
    tracker.tween({
      targets: this._underline,
      scaleX: 1,
      delay: SLAM_MS,
      duration: UNDERLINE_MS,
      ease: EASE.standardOut,
    });
  }

  /** The rarity tag pops in under the name. */
  landTag(instant: boolean): void {
    if (instant) {
      this._pill.setScale(TAG_SCALE);
      return;
    }
    this._ctx.tracker.tween({
      targets: this._pill,
      scale: TAG_SCALE,
      duration: TAG_MS,
      ease: EASE.bouncy,
    });
  }

  /** The film moves on: the name slides and shrinks to its place, the underline and the big tag go. */
  leave(instant: boolean): void {
    const slot = { y: REVEAL_LAYOUT.nameY, scale: this._slotScale };
    if (instant) {
      this.name.setAlpha(1).setPosition(CENTRE_X, slot.y).setScale(slot.scale);
      this._underline.destroy();
      this._pill.destroy();
      return;
    }
    const { tracker } = this._ctx;
    const from = { y: this.name.y, scale: this.name.scaleX };
    tracker.counter({
      from: 0,
      to: 1,
      duration: SHRINK_MS,
      onUpdate: (tween) => {
        const e = cubicInOut(tween.getValue() ?? 1);
        this.name.setY(from.y + (slot.y - from.y) * e);
        this.name.setScale(from.scale + (slot.scale - from.scale) * e);
      },
    });
    tracker.tween({
      targets: [this._underline, this._pill],
      alpha: 0,
      duration: DURATION.stateChange,
      ease: EASE.standardIn,
      onComplete: () => {
        this._underline.destroy();
        this._pill.destroy();
      },
    });
  }
}
