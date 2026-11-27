/**
 * Shows a child where free-aimed water is going (2026-11-27). Owner, watching
 * a trackpad: "where the end of the projectile hits the cursor, there's a
 * bigger visual impact, so that it is clear that the player needs to scroll
 * down a little bit." Two things: a clear reticle (a Cloud ring with an Ink
 * outline and a centre dot, readable on the light Garden and the dark Disco)
 * and, while water flows at a free point, a pulsing ring plus the gun's own
 * landing splash there. All the splash pieces come from the scene's one
 * impact pool, so the cap of 120 holds.
 */

import type Phaser from 'phaser';

import {
  AIM_LANDING_RING_GROWTH,
  AIM_LANDING_RING_MS,
  AIM_LANDING_RING_RADIUS,
  AIM_LANDING_RING_STROKE,
  AIM_LANDING_SPLASH_MS,
  AIM_RETICLE_DEPTH,
  AIM_RETICLE_DOT_RADIUS,
  AIM_RETICLE_OUTLINE,
  AIM_RETICLE_RADIUS,
  AIM_RETICLE_STROKE,
} from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { impactPoolFor } from '../../entities/waterParticle/impactPool';
import { spawnImpact } from '../../entities/waterParticle/projectiles/impacts';
import { COLOUR } from '../../utils/colour';
import { EASE } from '../../utils/tween';

export class FreeAimMarker {
  private readonly _reticle: Phaser.GameObjects.Graphics;
  private _lastSplashAt = -Infinity;

  constructor(private readonly _scene: Phaser.Scene) {
    const g = _scene.add.graphics().setDepth(AIM_RETICLE_DEPTH).setVisible(false);
    // Ink outline first, then the Cloud ring and dot on top of it.
    g.lineStyle(AIM_RETICLE_STROKE + AIM_RETICLE_OUTLINE * 2, COLOUR.ink, 1);
    g.strokeCircle(0, 0, AIM_RETICLE_RADIUS);
    g.fillStyle(COLOUR.ink, 1);
    g.fillCircle(0, 0, AIM_RETICLE_DOT_RADIUS + AIM_RETICLE_OUTLINE);
    g.lineStyle(AIM_RETICLE_STROKE, COLOUR.cloud, 1);
    g.strokeCircle(0, 0, AIM_RETICLE_RADIUS);
    g.fillStyle(COLOUR.cloud, 1);
    g.fillCircle(0, 0, AIM_RETICLE_DOT_RADIUS);
    this._reticle = g;
  }

  /**
   * One frame. `free` is true while the aim is on bare wall (not snapped to
   * an instrument or on a visitor); `flowing` while water is leaving the gun.
   */
  update(
    time: number,
    point: { readonly x: number; readonly y: number },
    free: boolean,
    flowing: boolean,
    gun: GunDef,
  ): void {
    this._reticle.setVisible(free).setPosition(point.x, point.y);
    if (!free || !flowing || time - this._lastSplashAt < AIM_LANDING_SPLASH_MS) return;
    this._lastSplashAt = time;
    spawnImpact(this._scene, point.x, point.y, gun);
    impactPoolFor(this._scene).play({
      kind: 'hit',
      shape: 'ring',
      size: AIM_LANDING_RING_RADIUS,
      thickness: AIM_LANDING_RING_STROKE,
      x: point.x,
      y: point.y,
      colour: gun.particleColour,
      strokeColour: gun.particleColour,
      alpha: 0.9,
      depth: AIM_RETICLE_DEPTH - 1,
      to: { scale: AIM_LANDING_RING_GROWTH },
      duration: AIM_LANDING_RING_MS,
      ease: EASE.standardOut,
    });
  }

  /** Hides the reticle (a visitor has the aim, or the gig is over). */
  hide(): void {
    this._reticle.setVisible(false);
  }
}
