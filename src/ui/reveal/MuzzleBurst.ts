/**
 * The muzzle moment of the close-up: a glow that swells at the nozzle while
 * the gun holds, then at the shot a flash, a bloom, a flare, a ring, speed
 * lines and a spray of bits racing off the right edge. It is drawn at screen
 * scale (nothing small is scaled up), tinted from the gun's own colours, and
 * every part is a pure function of the film's clock, so a skip or a late frame
 * can never leave it half-drawn. The kinds of bit and their number come from
 * `muzzleStyles.data.ts`.
 */

import type Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { COLOUR } from '../../utils/colour';
import { clamp01, cubicOut, flashAlphaAt, lerp, type FilmPose, type Point } from './filmMaths';
import { drawBit } from './muzzleBits';
import * as M from './muzzleStyles.data';

interface Bit {
  readonly angle: number;
  readonly run: number;
  readonly size: number;
  readonly delay: number;
  readonly seed: number;
}

interface SpeedLine {
  readonly angle: number;
  readonly run: number;
  readonly delay: number;
  readonly colourIndex: number;
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

export class MuzzleBurst {
  readonly gfx: Phaser.GameObjects.Graphics;
  private readonly _style: M.MuzzleStyle;
  private readonly _colours: readonly number[];
  private _bits: Bit[] = [];
  private _lines: SpeedLine[] = [];
  private _origin: Point | null = null;

  constructor(
    scene: Phaser.Scene,
    root: Phaser.GameObjects.Container,
    private readonly _gun: GunDef,
  ) {
    this.gfx = scene.add.graphics();
    root.add(this.gfx);
    this._style = M.MUZZLE_STYLES[_gun.projectile];
    this._colours = [_gun.particleColour, _gun.accentColour, _gun.particleColour];
  }

  /** Draws this frame: `nozzle` is where the nozzle is on screen now. */
  update(pose: FilmPose, nozzle: Point): void {
    const g = this.gfx;
    g.clear();
    const t = pose.sinceFire;
    if (t < 0) {
      if (pose.charge > 0) this._drawCharge(pose.charge, nozzle);
      return;
    }
    const flash = flashAlphaAt(t);
    if (flash > 0) {
      g.fillStyle(COLOUR.cloud, flash);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    if (t >= M.MUZZLE_END_MS) return;
    if (!this._origin) this._spawn(nozzle);
    const o = this._origin ?? nozzle;
    this._drawBloom(t, o);
    this._drawRings(t, o);
    this._drawLines(t, o);
    this._drawBits(t, o);
  }

  private _spawn(nozzle: Point): void {
    this._origin = { x: nozzle.x, y: nozzle.y };
    const counts = M.MUZZLE_COUNTS[this._gun.rarity];
    const half = M.FAN_HALF_ANGLE;
    this._lines = Array.from({ length: counts.lines }, (_, i) => ({
      angle: lerp(-half, half, (i + 0.5) / counts.lines) + rand(-0.05, 0.05),
      run: M.LINE_RUN_PX * rand(0.65, 1.1) * this._style.speed,
      delay: rand(0, M.LAUNCH_SPREAD_MS),
      colourIndex: i,
    }));
    this._bits = Array.from({ length: Math.round(counts.bits * this._style.count) }, (_, i) => ({
      angle: rand(-half * 1.25, half * 1.25),
      run: M.BIT_RUN_PX * rand(0.4, 1.15) * this._style.speed,
      size: M.BIT_SIZE_PX * this._style.size * rand(0.7, 1.3),
      delay: rand(0, M.LAUNCH_SPREAD_MS),
      seed: i + 1,
    }));
  }

  /** The charge: a glow in the gun's colour swells at the nozzle while sparks run in to it. */
  private _drawCharge(charge: number, at: Point): void {
    const g = this.gfx;
    const r = lerp(M.CHARGE_RADIUS_FROM, M.CHARGE_RADIUS_TO, charge * charge);
    for (let layer = 3; layer >= 1; layer--) {
      g.fillStyle(this._gun.particleColour, 0.13 * charge);
      g.fillCircle(at.x, at.y, r * (0.6 + layer * 0.4));
    }
    g.fillStyle(this._gun.accentColour, 0.5 * charge);
    g.fillCircle(at.x, at.y, r * 0.4);
    g.fillStyle(COLOUR.cloud, 0.7 * charge);
    g.fillCircle(at.x, at.y, r * 0.18);
    const spin = charge * 1.4;
    for (let i = 0; i < M.CHARGE_SPARKS; i++) {
      const a = spin + (i / M.CHARGE_SPARKS) * Math.PI * 2;
      const far = lerp(M.CHARGE_SPARK_FAR, M.CHARGE_SPARK_NEAR, charge);
      const near = far - 34;
      g.lineStyle(5, this._colours[i % 3] ?? COLOUR.cloud, clamp01(charge * 1.4));
      g.lineBetween(
        at.x + Math.cos(a) * far,
        at.y + Math.sin(a) * far,
        at.x + Math.cos(a) * near,
        at.y + Math.sin(a) * near,
      );
    }
  }

  private _drawBloom(t: number, o: Point): void {
    const g = this.gfx;
    const p = t / M.BLOOM_MS;
    if (t < M.FLARE_MS) {
      const q = clamp01(t / M.FLARE_MS);
      g.fillStyle(COLOUR.cloud, 1 - q);
      g.fillEllipse(
        o.x + (M.FLARE_LENGTH * cubicOut(q)) / 2,
        o.y,
        M.FLARE_LENGTH * cubicOut(q),
        M.FLARE_THICKNESS * (1 - q),
      );
      g.fillStyle(this._gun.particleColour, (1 - q) * 0.6);
      g.fillEllipse(
        o.x + (M.FLARE_LENGTH * cubicOut(q)) / 3,
        o.y,
        M.FLARE_LENGTH * 0.66 * cubicOut(q),
        M.FLARE_THICKNESS * 2.4 * (1 - q),
      );
    }
    if (p >= 1) return;
    const grow = cubicOut(p);
    for (let layer = 4; layer >= 1; layer--) {
      g.fillStyle(this._gun.particleColour, 0.2 * (1 - p));
      g.fillCircle(o.x, o.y, M.BLOOM_HALO_RADIUS * (0.4 + 0.6 * grow) * (layer / 4));
    }
    g.fillStyle(this._gun.accentColour, 0.7 * (1 - p));
    g.fillCircle(o.x, o.y, M.BLOOM_CORE_RADIUS * (0.5 + 0.5 * grow));
    g.fillStyle(COLOUR.cloud, 1 - p);
    g.fillCircle(o.x, o.y, M.BLOOM_CORE_RADIUS * 0.55 * (0.6 + 0.4 * grow));
  }

  private _drawRings(t: number, o: Point): void {
    const g = this.gfx;
    const rings = [
      { delay: 0, colour: this._gun.particleColour, scale: 1 },
      { delay: 70, colour: this._gun.accentColour, scale: 0.6 },
    ];
    for (const ring of rings) {
      const p = (t - ring.delay) / M.RING_MS;
      if (p < 0 || p >= 1) continue;
      g.lineStyle(M.RING_WIDTH * (1 - p) + 1, ring.colour, (1 - p) ** 1.5);
      g.strokeCircle(o.x, o.y, lerp(M.RING_FROM, M.RING_TO * ring.scale, cubicOut(p)));
    }
  }

  private _drawLines(t: number, o: Point): void {
    const g = this.gfx;
    for (const line of this._lines) {
      const q = (t - line.delay) / M.LINE_MS;
      if (q < 0 || q >= 1) continue;
      const d = line.run * cubicOut(q);
      const len = M.LINE_LENGTH_PX * (1 - q * 0.5);
      const dx = Math.cos(line.angle);
      const dy = Math.sin(line.angle);
      const tail = Math.max(0, d - len);
      g.lineStyle(
        M.LINE_WIDTH_PX * (1 - q * 0.6),
        [COLOUR.cloud, this._gun.particleColour, this._gun.accentColour][line.colourIndex % 3] ??
          COLOUR.cloud,
        (1 - q) ** 1.4,
      );
      g.lineBetween(o.x + dx * tail, o.y + dy * tail, o.x + dx * d, o.y + dy * d);
    }
  }

  private _drawBits(t: number, o: Point): void {
    const palette = this._style.palette ?? [];
    for (const bit of this._bits) {
      const local = t - bit.delay;
      const q = local / M.BIT_MS;
      if (q < 0 || q >= 1) continue;
      const d = bit.run * cubicOut(q);
      const sag = 0.5 * this._style.gravity * (local / 1000) ** 2;
      const colourPick =
        palette.length > 0 ? palette[bit.seed % palette.length] : this._colours[bit.seed % 3];
      drawBit(this.gfx, {
        shape: this._style.shape,
        x: o.x + Math.cos(bit.angle) * d,
        y: o.y + Math.sin(bit.angle) * d + sag,
        size: bit.size * (1 - q * 0.45),
        rot: bit.angle + (this._style.shape === 'star' ? local * 0.012 : 0),
        alpha: Math.min(1, (1 - q) * 1.8),
        colour: colourPick ?? this._gun.particleColour,
        accent: this._gun.accentColour,
        seed: bit.seed,
        palette,
      });
    }
  }
}
