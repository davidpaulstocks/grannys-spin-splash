/**
 * The gun's real projectile in the extreme close-up. It uses the same
 * renderers the demo range does (`JET_RENDERERS[gun.projectile]`), fed shots in
 * "demo pixels" (the units the range draws in), on a layer scaled so that one
 * demo pixel is the right size next to the huge gun picture: the shots look
 * exactly like the demo's, only as big as the gun now is. The shots live in the
 * picture's own space, so when the camera pulls back they pull back with it.
 */

import type Phaser from 'phaser';

import { WATER_PARTICLE_SPEED } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { BARREL_SPACING_PX, FIRE_DENSITY_SCALE } from '../../entities/waterParticle/fireDensity';
import { JET_RENDERERS } from '../../entities/waterParticle/projectiles';
import type { JetPoint } from '../../entities/waterParticle/projectiles/projectile.types';

const MAX_SHOTS = 90;
/** The close-up's shots fly this share of the demo's speed, so the stream is seen forming. */
const SPEED_SHARE = 0.25;
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
   * Advances the shots `dtMs` and draws them. `layer` is where the layer sits and its scale (screen px per
   * demo px); `nozzle` is the nozzle in the layer's own units; `firing` spawns shots this frame.
   */
  step(
    dtMs: number,
    firing: boolean,
    layer: { readonly x: number; readonly y: number; readonly scale: number },
    nozzle: { readonly x: number; readonly y: number },
  ): void {
    const dt = Math.min(dtMs, 50);
    this._clock += dt;
    this.gfx.setPosition(layer.x, layer.y).setScale(layer.scale);
    if (firing && this._clock >= this._nextAt) this._spawn(nozzle);
    const advance = (WATER_PARTICLE_SPEED * SPEED_SHARE * dt) / 1000;
    const edge = (this._screenWidth + OFF_SCREEN_MARGIN - layer.x) / layer.scale;
    for (const s of this._shots) {
      if (!s.active) continue;
      s.x += advance;
      if (s.x > edge) s.active = false;
    }
    this._draw(firing, nozzle);
  }

  private _spawn(nozzle: { readonly x: number; readonly y: number }): void {
    const streams = this._gun.streams;
    const spacing = this._gun.barrelSpacing ?? BARREL_SPACING_PX;
    for (let i = 0; i < streams; i++) {
      const shot = this._shots.find((s) => !s.active);
      if (!shot) break;
      shot.x = nozzle.x;
      shot.y = nozzle.y + (i - (streams - 1) / 2) * spacing;
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
      const points: JetPoint[] = list.map((s) => ({ x: s.x, y: s.y, seq: s.seq }));
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
