/**
 * Draws the cannon's shots in flight, in the gun's own projectile style.
 *
 * The particles are still the simulation: they carry the physics and the
 * hits. Each stream's particles are gathered nozzle to tip and handed to the
 * renderer for the gun's `projectile` style (water ribbon, bubbles, slime,
 * laser, flame and so on, in `projectiles/`), which draws them into one shared
 * Graphics. Because the picture follows the particles actually in flight, it
 * bends and whips when the aim moves, for free.
 */

import Phaser from 'phaser';

import type { GunDef } from '../gun/gun.types';
import { JET_RENDERERS } from './projectiles';
import type { JetPoint } from './projectiles/projectile.types';
import type { WaterParticle } from './WaterParticle';

interface Point {
  x: number;
  y: number;
}

export class WaterJet {
  private readonly _gfx: Phaser.GameObjects.Graphics;
  private readonly _pool: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, pool: Phaser.GameObjects.Group) {
    this._pool = pool;
    this._gfx = scene.add.graphics();
  }

  setDepth(depth: number): void {
    this._gfx.setDepth(depth);
  }

  /**
   * Puts the jet just behind `object` in the scene's drawing order. The jet is
   * drawn from the nozzle, so in front of the gun its squared-off start shows
   * across the muzzle; just behind the gun it appears to come out of it. It
   * stays in front of Granny: she holds the gun, so the water passes over her.
   */
  drawBehind(object: Phaser.GameObjects.GameObject): void {
    this._gfx.scene.children.moveBelow(this._gfx, object);
  }

  /**
   * Redraws the jet: call once per frame after the particles have moved.
   * `nozzle` anchors it to the gun while `firing`; without it the last of the
   * shots simply fly on and thin out.
   */
  update(time: number, nozzle: Point, firing: boolean, gun: GunDef): void {
    const gfx = this._gfx;
    gfx.clear();

    const streams = new Map<number, WaterParticle[]>();
    for (const child of this._pool.getChildren() as WaterParticle[]) {
      if (!child.active || child.stream < 0) continue;
      const list = streams.get(child.stream);
      if (list) list.push(child);
      else streams.set(child.stream, [child]);
    }

    const drawn: JetPoint[][] = [];
    for (const particles of streams.values()) {
      // Newest first: the jet runs from the gun outward.
      particles.sort((a, b) => b.seq - a.seq);
      const points: JetPoint[] = particles.map((p) => ({ x: p.x, y: p.y, seq: p.seq }));
      if (firing) points.unshift({ x: nozzle.x, y: nozzle.y });
      if (points.length >= 2) drawn.push(points);
    }
    if (drawn.length === 0) return;
    JET_RENDERERS[gun.projectile]({
      gfx,
      time,
      streams: drawn,
      colour: gun.particleColour,
      accent: gun.accentColour,
      size: gun.sz,
    });
  }

  destroy(): void {
    this._gfx.destroy();
  }
}
