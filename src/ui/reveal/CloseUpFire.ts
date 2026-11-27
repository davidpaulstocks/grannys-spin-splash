/**
 * The gun's real projectile, streaming from the nozzle once the camera starts
 * to pull back and until the hero shot ends. It uses the same renderer the
 * demo range does (`JET_RENDERERS[gun.projectile]`), on a layer scaled
 * `STREAM_SCALE` times (about twice the game's, where the shots look right),
 * with every shot an offset from the nozzle: the stream is a rigid jet that
 * travels with the gun (never kinked by the camera move) and leaves the nozzle
 * at every frame of the zoom.
 */

import type Phaser from 'phaser';

import { WATER_PARTICLE_SPEED } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { STREAM_SCALE } from './filmMaths';
import { BARREL_SPACING_PX, FIRE_DENSITY_SCALE } from '../../entities/waterParticle/fireDensity';
import { JET_RENDERERS } from '../../entities/waterParticle/projectiles';
import type { JetPoint } from '../../entities/waterParticle/projectiles/projectile.types';

const MAX_SHOTS = 90;
const OFF_SCREEN_MARGIN = 120;

interface Shot {
  active: boolean;
  x: number;
  y: number;
  seq: number;
  stream: number;
}

export class CloseUpFire {
  readonly gfx: Phaser.GameObjects.Graphics;
  private readonly _shots: Shot[] = [];
  private _seq = 0;
  private _clock = 0;
  private _nextAt = 0;

  constructor(
    private readonly _scene: Phaser.Scene,
    root: Phaser.GameObjects.Container,
    private readonly _gun: GunDef,
    private readonly _screenWidth: number,
  ) {
    this.gfx = _scene.add.graphics();
    root.add(this.gfx);
    for (let i = 0; i < MAX_SHOTS; i++) {
      this._shots.push({ active: false, x: 0, y: 0, seq: 0, stream: 0 });
    }
  }

  /**
   * Advances the shots `dtMs` and draws them. `nozzleScreen` is where the nozzle is on screen now;
   * `firing` spawns shots this frame and pins the stream's head to the nozzle.
   */
  step(
    dtMs: number,
    firing: boolean,
    nozzleScreen: { readonly x: number; readonly y: number },
  ): void {
    const dt = Math.min(dtMs, 50);
    this._clock += dt;
    this.gfx.setPosition(0, 0).setScale(STREAM_SCALE);
    const nozzle = { x: nozzleScreen.x / STREAM_SCALE, y: nozzleScreen.y / STREAM_SCALE };
    if (firing && this._clock >= this._nextAt) this._spawn();
    const advance = (WATER_PARTICLE_SPEED * dt) / 1000;
    const edge = (this._screenWidth + OFF_SCREEN_MARGIN) / STREAM_SCALE;
    for (const s of this._shots) {
      if (!s.active) continue;
      s.x += advance;
      if (nozzle.x + s.x > edge) s.active = false;
    }
    this._draw(firing, nozzle);
  }

  /** A shot is born at the nozzle: `x` and `y` are its offset from the nozzle, so the whole stream travels with the gun. */
  private _spawn(): void {
    const streams = this._gun.streams;
    const spacing = this._gun.barrelSpacing ?? BARREL_SPACING_PX;
    for (let i = 0; i < streams; i++) {
      const shot = this._shots.find((s) => !s.active);
      if (!shot) break;
      shot.x = 0;
      shot.y = (i - (streams - 1) / 2) * spacing;
      shot.seq = this._seq++;
      shot.stream = i;
      shot.active = true;
    }
    this._nextAt = this._clock + this._gun.interval / FIRE_DENSITY_SCALE;
  }

  private _draw(firing: boolean, nozzle: { readonly x: number; readonly y: number }): void {
    const gfx = this.gfx;
    gfx.clear();
    const byStream = new Map<number, Shot[]>();
    for (const s of this._shots) {
      if (!s.active) continue;
      const list = byStream.get(s.stream);
      if (list) list.push(s);
      else byStream.set(s.stream, [s]);
    }
    const streams: JetPoint[][] = [];
    const spacing = this._gun.barrelSpacing ?? BARREL_SPACING_PX;
    for (const [stream, list] of byStream) {
      list.sort((a, b) => b.seq - a.seq);
      const points: JetPoint[] = list.map((s) => ({
        x: nozzle.x + s.x,
        y: nozzle.y + s.y,
        seq: s.seq,
      }));
      if (firing) {
        const offset = (stream - (this._gun.streams - 1) / 2) * spacing;
        points.unshift({ x: nozzle.x, y: nozzle.y + offset });
      }
      if (points.length >= 2) streams.push(points);
    }
    if (streams.length === 0) return;
    JET_RENDERERS[this._gun.projectile]({
      gfx,
      time: this._scene.time.now,
      streams,
      colour: this._gun.particleColour,
      accent: this._gun.accentColour,
      size: this._gun.sz,
    });
  }
}
