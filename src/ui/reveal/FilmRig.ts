/**
 * The film's rig: the gun picture, the sweep of light over it, the shots it
 * fires and the vignette, all driven every frame from one pure function of the
 * clock (`filmPose`). The camera moves the picture, not the UI: the buttons and
 * text that come later are never touched by the shake or the zoom. When the
 * film is over (or skipped) the gun picture stays where it ends, ready for the
 * demo range, and everything else the film made is destroyed.
 */

import type Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import type { AnchorJSON, GunDef, GunRarity } from '../../entities/gun/gun.types';
import { COLOUR_HEX } from '../../utils/colour';
import { CloseUpFire } from './CloseUpFire';
import {
  filmGeometry,
  filmPose,
  screenPointOf,
  type FilmGeometry,
  type FilmPose,
} from './filmMaths';
import { MuzzleBurst } from './MuzzleBurst';
import { Sheen } from './Sheen';
import { REVEAL_LAYOUT, revealGunScale } from './revealTiming';
import type { RevealCtx } from './RevealTracker';

/** The vignette is painted small and stretched: a soft dark frame, Ink at its corners. */
const VIGNETTE_W = 320;
const VIGNETTE_H = 180;
const VIGNETTE_CLEAR_UNTIL = 0.38;
const VIGNETTE_EDGE_ALPHA = 0.92;
/** The picture's size on screen at its place equals what the demo range used before. */
const MAX_FRAME_MS = 50;

const hexToRgb = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

export class FilmRig {
  readonly image: Phaser.GameObjects.Image;
  readonly geometry: FilmGeometry;
  /** The nozzle in this picture's own pixels (the small picture's anchor, scaled across). */
  readonly anchor: { readonly x: number; readonly y: number };
  private readonly _sheen: Sheen | null;
  private readonly _fire: CloseUpFire;
  private readonly _muzzle: MuzzleBurst;
  private readonly _vignette: Phaser.GameObjects.Image;
  private readonly _vignetteKey: string;
  private readonly _demoScale: number;
  private _last = 0;
  private _pose: FilmPose;
  private _finished = false;

  /**
   * `textureKey` is the picture shown (the hero, or the small one as a fallback); `smallWidth` is the small
   * picture's width, so the anchor (in small-picture pixels) maps across by simple scaling.
   */
  constructor(
    private readonly _ctx: RevealCtx,
    gun: GunDef,
    private readonly _rarity: GunRarity,
    textureKey: string,
    anchor: AnchorJSON,
    smallWidth: number,
  ) {
    const { scene, root } = _ctx;
    this.image = scene.add.image(0, 0, textureKey).setAlpha(0);
    const k = this.image.width / smallWidth;
    this._demoScale = revealGunScale(this.image.width, this.image.height, gun.showScale);
    this.anchor = { x: anchor.x * k, y: anchor.y * k };
    this.geometry = filmGeometry(
      this.image.width,
      this.image.height,
      this.anchor,
      { w: GAME_WIDTH, h: GAME_HEIGHT },
      { x: REVEAL_LAYOUT.gun.x, y: REVEAL_LAYOUT.gun.y },
      this._demoScale,
    );
    root.add(this.image);
    this._sheen = this._makeSheen(textureKey);
    if (this._sheen) root.add(this._sheen.image);
    this._fire = new CloseUpFire(scene, root, gun, GAME_WIDTH);
    this._vignetteKey = `film_vignette_${scene.time.now}`;
    this._vignette = this._makeVignette();
    root.add(this._vignette);
    this._muzzle = new MuzzleBurst(scene, root, gun);
    this._pose = filmPose(_rarity, 0, this.geometry);
    this._apply(0);
  }

  /** The picture's scale when it is in its place (what the demo range works from). */
  get placeScale(): number {
    return this._demoScale;
  }

  /** The current pose of the film. */
  get pose(): FilmPose {
    return this._pose;
  }

  /** Moves everything to where the film is `elapsedMs` in. */
  update(elapsedMs: number): void {
    if (this._finished) return;
    const dt = Math.min(MAX_FRAME_MS, Math.max(0, elapsedMs - this._last));
    this._last = elapsedMs;
    this._pose = filmPose(this._rarity, elapsedMs, this.geometry);
    this._apply(dt);
  }

  /** Ends the film where it ends (the gun in its place) and removes everything the film made but the gun. */
  finish(): void {
    if (this._finished) return;
    this._pose = filmPose(this._rarity, Number.MAX_SAFE_INTEGER, this.geometry);
    this._apply(0);
    this._finished = true;
    this._sheen?.destroy();
    this._fire.gfx.destroy();
    this._muzzle.gfx.destroy();
    this._vignette.destroy();
    if (this._ctx.scene.textures.exists(this._vignetteKey)) {
      this._ctx.scene.textures.remove(this._vignetteKey);
    }
  }

  /** Destroys what is left (the reveal closed before the film was over). */
  destroy(): void {
    this.finish();
  }

  private _apply(dt: number): void {
    const p = this._pose;
    const { image } = this;
    image
      .setPosition(p.x + p.recoil, p.y)
      .setScale(p.zoom)
      .setAlpha(p.imageAlpha);
    if (this._finished) return;
    this._vignette.setAlpha(p.vignette * VIGNETTE_EDGE_ALPHA);
    if (this._sheen) {
      this._sheen.paint(p.sheen);
      this._sheen.image.setPosition(p.x, p.y).setScale(p.zoom).setAlpha(p.imageAlpha);
    }
    const spot = screenPointOf({ ...p, x: p.x + p.recoil }, this.geometry.nozzle);
    this._fire.step(dt, p.streaming, spot);
    this._muzzle.update(p, spot);
  }

  private _makeSheen(textureKey: string): Sheen | null {
    try {
      return new Sheen(this._ctx.scene, textureKey, this.image.width, this.image.height);
    } catch {
      return null;
    }
  }

  private _makeVignette(): Phaser.GameObjects.Image {
    const { scene } = this._ctx;
    const canvas = scene.textures.createCanvas(this._vignetteKey, VIGNETTE_W, VIGNETTE_H);
    if (canvas) {
      const ctx = canvas.getContext();
      const ink = hexToRgb(COLOUR_HEX.ink);
      const grad = ctx.createRadialGradient(
        VIGNETTE_W / 2,
        VIGNETTE_H / 2,
        0,
        VIGNETTE_W / 2,
        VIGNETTE_H / 2,
        Math.hypot(VIGNETTE_W, VIGNETTE_H) / 2,
      );
      grad.addColorStop(0, `rgba(${ink}, 0)`);
      grad.addColorStop(VIGNETTE_CLEAR_UNTIL, `rgba(${ink}, 0)`);
      grad.addColorStop(1, `rgba(${ink}, 1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIGNETTE_W, VIGNETTE_H);
      canvas.refresh();
    }
    return scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this._vignetteKey)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0);
  }
}
