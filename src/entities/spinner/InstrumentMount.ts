/**
 * A painted instrument mounted in the hub of a spinning disc. The blades turn
 * behind it; the instrument itself never rotates (a spinning violin is an
 * unreadable blur). It bounces on its notes, slumps to one side when its
 * musician is asleep and straightens, with a bounce, when woken.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import type { InstrumentIconId } from '../../audio/orchestra/icons';
import { COLOUR } from '../../utils/colour';
import { BOUNCE_OVERSHOOT, EASE } from '../../utils/tween';
import { mountBounce, mountSizes, mountTilt, mountTint } from './mountGeometry';
import { INSTRUMENT_MOUNT } from './spinner.data';

export class InstrumentMount extends Phaser.GameObjects.Container {
  private readonly _image: Phaser.GameObjects.Image;
  private readonly _radius: number;
  private readonly _baseScale: number;
  private readonly _side: 1 | -1;
  private _asleep = true;

  /** True if the art for `icon` has been loaded, so a mount can be drawn for it. */
  static canMount(scene: Phaser.Scene, icon: InstrumentIconId | undefined): boolean {
    return icon !== undefined && scene.textures.exists(SPRITE_KEYS.instrumentIcon(icon));
  }

  /**
   * @param radius the spinner's radius in px
   * @param side which way the instrument slumps when asleep
   */
  constructor(scene: Phaser.Scene, icon: InstrumentIconId, radius: number, side: 1 | -1) {
    super(scene, 0, 0);
    this._radius = radius;
    this._side = side;
    const sizes = mountSizes(radius);

    const disc = scene.add.graphics();
    disc.fillStyle(COLOUR.cloud, INSTRUMENT_MOUNT.discAlpha);
    disc.fillCircle(0, 0, sizes.disc);
    disc.lineStyle(INSTRUMENT_MOUNT.discRingPx, COLOUR.ink, 1);
    disc.strokeCircle(0, 0, sizes.disc);

    this._image = scene.add.image(0, 0, SPRITE_KEYS.instrumentIcon(icon));
    this._baseScale = sizes.picture / Math.max(this._image.width, this._image.height);
    this._image.setScale(this._baseScale);
    this.add([disc, this._image]);
    this._applyPose(true);
  }

  /**
   * Call once per frame with the spinner's pulse (0-1) and whether its
   * musician is asleep. Changes of sleep state animate on their own.
   */
  sync(pulse: number, asleep: boolean): void {
    if (asleep !== this._asleep) {
      this._asleep = asleep;
      this.scene.tweens.killTweensOf(this._image);
      if (asleep) {
        this._applyPose(true);
      } else {
        this._image.setTint(mountTint(false));
        this.scene.tweens.add({
          targets: this._image,
          angle: mountTilt(false, this._side),
          duration: INSTRUMENT_MOUNT.wakeMs,
          ease: EASE.bouncy,
          easeParams: [BOUNCE_OVERSHOOT],
        });
      }
    }
    const bounce = mountBounce(pulse, this._radius);
    this._image.setScale(this._baseScale * bounce.scale);
    this._image.y = -bounce.lift;
  }

  private _applyPose(asleep: boolean): void {
    this._image.setAngle(mountTilt(asleep, this._side));
    this._image.setTint(mountTint(asleep));
  }
}
