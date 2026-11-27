/**
 * What a visitor looks like: its painted picture if that has been shipped,
 * otherwise the drawn stand-in. Faces the way it is going and knows how to
 * swell, shrink and fade; all the behaviour is in Visitor.ts.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import type { VisitorDef } from './visitor.types';
import { drawVisitor } from './visitorDrawings';
import { VISITOR_ART_FACES_LEFT, VISITOR_ART_READY } from './visitorArt.data';

export class VisitorBody extends Phaser.GameObjects.Container {
  private readonly _gfx: Phaser.GameObjects.Graphics | null = null;
  private readonly _dir: 1 | -1;
  private readonly _baseScale: number;
  private _shrink = 1;
  private _fit = 1;
  private _swell = 1;
  private _squash = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly _def: VisitorDef,
    dir: 1 | -1,
  ) {
    super(scene, 0, 0);
    this._dir = dir;
    const painted =
      VISITOR_ART_READY.includes(_def.id) && scene.textures.exists(SPRITE_KEYS.visitor(_def.id));
    if (painted) {
      const image = scene.add.image(0, 0, SPRITE_KEYS.visitor(_def.id));
      image.setScale(_def.artPx / Math.max(image.width, image.height));
      // The body is flipped to face the way it travels, which assumes it faces right.
      if (VISITOR_ART_FACES_LEFT.includes(_def.id)) image.setFlipX(true);
      this.add(image);
    } else {
      this._gfx = scene.add.graphics();
      this.add(this._gfx);
    }
    this._baseScale = painted ? 1 : _def.drawScale;
    this._applyScale();
    this.redraw(false, []);
  }

  /** The scale of the whole body, as a multiple of its natural size. */
  get baseScale(): number {
    return this._baseScale;
  }

  /** Redraws the stand-in (a painted picture has nothing to redraw). */
  redraw(leaving: boolean, balloonsAlive: readonly boolean[]): void {
    if (this._gfx) drawVisitor(this._gfx, this._def.id, { leaving, balloonsAlive });
  }

  /** True if this is a drawn stand-in, not a painted picture. */
  get drawn(): boolean {
    return this._gfx !== null;
  }

  /** Swells to `swell` times its size (a pop). */
  swell(swell: number): void {
    this._swell = swell;
    this._applyScale();
  }

  /** Sizes the whole body to `fit` times its natural size (a blocker made to cover a cluster). */
  setFit(fit: number): void {
    this._fit = fit;
    this._applyScale();
  }

  /** Squashes it flat and wide by `amount` (0 is none), the way a shoved blocker gives. */
  squash(amount: number): void {
    if (amount === this._squash) return;
    this._squash = amount;
    this._applyScale();
  }

  /** Gets a tenth smaller — how a painted bunch of balloons shows a pop. */
  shrinkBit(): void {
    this._shrink *= 0.9;
    this._applyScale();
  }

  private _applyScale(): void {
    const s = this._baseScale * this._shrink * this._fit * this._swell;
    this.setScale(this._dir * s * (1 + this._squash), s * (1 - this._squash));
  }
}
