/** A treat: flies across in an arc, and pops into coins when water hits it. */

import Phaser from 'phaser';

import type { WaterParticle } from '../waterParticle/WaterParticle';
import { VISIT_MOTION as M } from './visitorTuning.data';
import type { VisitorHit } from './visitor.types';
import { Visitor, type VisitorAimPoint } from './Visitor';

export class TreatVisitor extends Visitor {
  override get aimPoint(): VisitorAimPoint | null {
    if (this._phase !== 'active') return null;
    const radius = Math.max(this.def.hitRx, this.def.hitRy);
    return { x: this.x, y: this.y + this.def.hitOffsetY, aimRadius: radius };
  }

  override tryBlock(particle: WaterParticle): VisitorHit | null {
    if (this._phase !== 'active') return null;
    const dx = (particle.x - this.x) / this.def.hitRx;
    const dy = (particle.y - (this.y + this.def.hitOffsetY)) / this.def.hitRy;
    if (dx * dx + dy * dy >= 1) return null;
    particle.blockAndRecycle();
    this._phase = 'leaving';
    this._phaseMs = 0;
    return 'treat';
  }

  protected override _extraRotation(time: number): number {
    return (
      Math.sin((time / 1000) * M.treatSpinHz * Math.PI * 2) *
      Phaser.Math.DegToRad(M.treatSpinDegrees)
    );
  }

  protected override _step(): void {
    if (this._phase === 'telegraph') {
      this._peek(this._phaseMs);
      this.setPosition(this._x, this._baseY);
      return;
    }
    if (this._phase === 'active') {
      const p = Math.min(1, this._phaseMs / (M.treatCrossSeconds * 1000));
      this._x = this._peekX + (this._endX - this._peekX) * p;
      this.setPosition(this._x, this._baseY - Math.sin(Math.PI * p) * M.treatArcPx);
      if (p >= 1) this._finish();
      return;
    }
    const t = Math.min(1, this._phaseMs / M.popMs);
    this._body.swell(1 + (M.popSwell - 1) * t);
    this._body.setAlpha(1 - t);
    if (t >= 1) this._finish();
  }
}
