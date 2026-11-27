/**
 * The soft diagonal band of light that sweeps across the gun's paintwork in the
 * close-up. It is a canvas texture the size of the gun picture: each frame the
 * gun is drawn onto it, then a Cloud-coloured gradient band is laid over it only
 * where the gun is (`source-in`), so the light follows the gun's own shape and
 * never spills onto the dark screen. Works in WebGL and Canvas alike.
 */

import type Phaser from 'phaser';

import { COLOUR_HEX } from '../../utils/colour';
import { clamp01 } from './filmMaths';

/** The band's tilt from vertical (radians), its width as a share of the picture's width, and its peak opacity. */
const BAND_TILT = 0.38;
const BAND_WIDTH_SHARE = 0.22;
const BAND_ALPHA = 0.45;
/** The band enters and leaves this far beyond the picture's ends (share of its width). */
const BAND_OVERSHOOT = 0.3;

const hexToRgb = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};
const CLOUD_RGB = hexToRgb(COLOUR_HEX.cloud);

export class Sheen {
  private readonly _canvas: Phaser.Textures.CanvasTexture;
  private readonly _ctx: CanvasRenderingContext2D;
  private readonly _source: CanvasImageSource;
  private readonly _key: string;
  readonly image: Phaser.GameObjects.Image;

  constructor(
    private readonly _scene: Phaser.Scene,
    gunKey: string,
    private readonly _width: number,
    private readonly _height: number,
  ) {
    this._key = `film_sheen_${gunKey}_${_scene.time.now}`;
    const canvas = _scene.textures.createCanvas(this._key, _width, _height);
    if (!canvas) throw new Error('Sheen: could not create the canvas texture');
    this._canvas = canvas;
    this._ctx = canvas.getContext();
    this._source = _scene.textures.get(gunKey).getSourceImage() as CanvasImageSource;
    this.image = _scene.add.image(0, 0, this._key).setAlpha(0);
  }

  /** Paints the band at `progress` (0 to 1 across the picture); null hides it. */
  paint(progress: number | null): void {
    if (progress === null) {
      this.image.setVisible(false);
      return;
    }
    const w = this._width;
    const h = this._height;
    const ctx = this._ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this._source, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-in';
    const bandW = w * BAND_WIDTH_SHARE;
    const centre = (-BAND_OVERSHOOT + (1 + 2 * BAND_OVERSHOOT) * clamp01(progress)) * w;
    const dx = Math.cos(BAND_TILT) * bandW;
    const dy = -Math.sin(BAND_TILT) * bandW;
    // The gradient runs across the band, perpendicular to its length.
    const grad = ctx.createLinearGradient(
      centre - dx / 2,
      h / 2 - dy / 2,
      centre + dx / 2,
      h / 2 + dy / 2,
    );
    grad.addColorStop(0, `rgba(${CLOUD_RGB}, 0)`);
    grad.addColorStop(0.5, `rgba(${CLOUD_RGB}, ${BAND_ALPHA})`);
    grad.addColorStop(1, `rgba(${CLOUD_RGB}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    this._canvas.refresh();
    this.image.setVisible(true);
  }

  /** Removes the texture and the image. */
  destroy(): void {
    this.image.destroy();
    if (this._scene.textures.exists(this._key)) this._scene.textures.remove(this._key);
  }
}
