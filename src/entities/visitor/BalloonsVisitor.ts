/**
 * A bunch of balloons: parks over the wall like any blocker, but each
 * balloon is popped one at a time for coins; the whole bunch drifts off once
 * the last is gone, or after its time. It covers no instrument.
 */

import type Phaser from 'phaser';

import type { WaterParticle } from '../waterParticle/WaterParticle';
import { BlockerVisitor, type BlockerSpec } from './BlockerVisitor';
import { BALLOON_LAYOUT, VISIT_MOTION as M } from './visitorTuning.data';
import type { VisitorHit } from './visitor.types';
import type { VisitorAimPoint } from './Visitor';

export class BalloonsVisitor extends BlockerVisitor {
  private readonly _balloons: boolean[] = BALLOON_LAYOUT.map(() => true);

  constructor(scene: Phaser.Scene, spec: BlockerSpec) {
    super(scene, { ...spec, covered: [], fitToCluster: false });
  }

  override get aimPoint(): VisitorAimPoint | null {
    if (this._phase !== 'active') return null;
    return { x: this.x, y: this.y, aimRadius: this.def.artPx * M.balloonAimFraction };
  }

  override tryBlock(particle: WaterParticle): VisitorHit | null {
    if (this._phase !== 'active') return null;
    const scale = this._body.baseScale;
    const index = BALLOON_LAYOUT.findIndex((b, i) => {
      if (!this._balloons[i]) return false;
      const bx = this.x + b.x * this._dir * scale;
      const by = this.y + b.y * scale;
      return Math.hypot(particle.x - bx, particle.y - by) < M.balloonRadiusPx * scale;
    });
    if (index < 0) return null;
    particle.blockAndRecycle();
    this._balloons[index] = false;
    this._kick = 1;
    if (this._body.drawn) this._body.redraw(false, this._balloons);
    else this._body.shrinkBit();
    if (!this._balloons.includes(true)) this._beginLeaving();
    return 'balloon';
  }

  protected override readonly _givesWay: boolean = false;
}
