/**
 * A blocker: drifts in (with the short peek-in warning), then parks over a
 * cluster of two or three instruments. While it is parked those instruments
 * are silenced and frozen — no sound, no coins — and the wind-down is counted
 * for them, so falling out of full speed under it still costs groove; and any water heading for them
 * or for it is absorbed by it and counts as a hit. Enough hits and it spins
 * off; ignored, it leaves by itself.
 */

import Phaser from 'phaser';

import type { Spinner } from '../spinner/Spinner';
import { SpinnerState } from '../spinner/spinner.types';
import type { WaterParticle } from '../waterParticle/WaterParticle';
import { BlockerMeter } from './BlockerMeter';
import { BLOCKER, VISIT_MOTION as M } from './visitorTuning.data';
import type { VisitorHit } from './visitor.types';
import { Visitor, type VisitorAimPoint, type VisitorSpec } from './Visitor';

const { Quadratic } = Phaser.Math.Easing;

/** Where a blocker parks and what it covers. */
export interface BlockerSpec extends Omit<VisitorSpec, 'y' | 'widthPx'> {
  /** The middle of the cluster and the radius that holds it, px. */
  readonly park: { readonly x: number; readonly y: number; readonly radius: number };
  /** The instruments it silences while parked (none for a bunch of balloons). */
  readonly covered: readonly Spinner[];
  /** Hits that send it away. */
  readonly hitsNeeded: number;
  /** Size the picture to cover the cluster; false leaves it at its own size. */
  readonly fitToCluster: boolean;
}

export class BlockerVisitor extends Visitor {
  protected readonly _park: BlockerSpec['park'];
  protected readonly _covered: readonly Spinner[];
  protected readonly _needed: number;
  protected readonly _meter: BlockerMeter;
  protected _hits = 0;
  protected _parked = false;
  private _parkedMs = 0;
  private _shove = 0;
  private _spin = 0;
  private _cleared = false;
  private _covering = false;
  /** Covered instruments that were at full speed: each falls out of it, one after another, while the blocker sits. */
  private _dropsLeft: Spinner[] = [];
  private _dropsDue: Spinner[] = [];
  private _dropsTaken = 0;

  constructor(scene: Phaser.Scene, spec: BlockerSpec) {
    const width = spec.fitToCluster ? spec.park.radius * 2 * BLOCKER.coverFactor : spec.def.artPx;
    super(scene, { def: spec.def, dir: spec.dir, y: spec.park.y, widthPx: width });
    this._park = spec.park;
    this._covered = spec.covered;
    this._needed = spec.hitsNeeded;
    if (spec.fitToCluster) this._body.setFit(width / spec.def.artPx);
    this._meter = new BlockerMeter(scene, this, spec.park.radius + BLOCKER.meterGapPx);
  }

  override get occupied(): readonly Spinner[] {
    return this._covered;
  }

  /**
   * Covered instruments that have just fallen out of full speed. A silenced
   * instrument is frozen, so the blocker counts the wind-down for it: the
   * director charges each one as a drop-out, which costs groove.
   */
  consumeDropOuts(): Spinner[] {
    const due = this._dropsDue;
    this._dropsDue = [];
    return due;
  }

  override get aimPoint(): VisitorAimPoint | null {
    if (this._phase !== 'active') return null;
    return { x: this._park.x, y: this._park.y, aimRadius: this._park.radius + BLOCKER.aimPadPx };
  }

  override tryBlock(particle: WaterParticle): VisitorHit | null {
    if (this._phase !== 'active' || !this._absorbs(particle.x, particle.y)) return null;
    particle.blockAndRecycle();
    this._hits++;
    this._kick = Math.min(1, this._kick + M.kickPerHit);
    this._shove = Math.sign(this.x - particle.x || 1) * BLOCKER.shovePx;
    if (this._hits < this._needed) return 'absorbed';
    this._cleared = true;
    this._beginLeaving();
    return 'shoo';
  }

  /** True if water at this point would reach the blocker or an instrument it covers. */
  protected _absorbs(px: number, py: number): boolean {
    if (Math.hypot(px - this.x, py - this.y) < this._park.radius * BLOCKER.coverFactor) return true;
    return (
      this._parked &&
      this._covered.some(
        (s) => Math.hypot(px - s.x, py - s.y) < s.def.r * s.scaleX + BLOCKER.coverPadPx,
      )
    );
  }

  /** Whether each hit slides it a little closer to the exit and the ring drains. */
  protected readonly _givesWay: boolean = true;

  protected override _extraRotation(): number {
    return this._spin;
  }

  protected override _release(): void {
    if (!this._covering) return;
    this._covering = false;
    for (const s of this._covered) {
      s.silenced = false;
    }
  }

  protected _beginLeaving(): void {
    if (this._phase === 'leaving' || this._phase === 'done') return;
    this._phase = 'leaving';
    this._phaseMs = 0;
    this._release();
    this._meter.draw(null);
  }

  protected override _step(time: number, dt: number): void {
    this._shove *= Math.exp(-BLOCKER.shoveDecayPerS * dt);
    this._body.squash(this._kick * BLOCKER.squashDepth);
    const bob = Math.sin((time / 1000) * M.blockerBobHz * Math.PI * 2) * M.blockerBobPx;
    if (this._phase === 'telegraph') {
      this._peek(this._phaseMs);
    } else if (this._phase === 'active') {
      this._stepActive(dt);
    } else if (this._phase === 'leaving') {
      this._x += this._dir * M.sitterExitPxPerS * dt;
      if (this._cleared) this._spin += this._dir * BLOCKER.spinOffTurnsPerS * Math.PI * 2 * dt;
      this._body.setAlpha(Math.max(0, 1 - this._phaseMs / M.sitterExitMs));
      if (this._phaseMs >= M.sitterExitMs) this._finish();
    }
    this.setPosition(this._x, this._baseY + bob);
  }

  private _stepActive(dt: number): void {
    if (!this._parked) {
      const t = Math.min(1, this._phaseMs / BLOCKER.glideMs);
      this._x = this._peekX + (this._park.x - this._peekX) * Quadratic.Out(t);
      if (t >= 1) this._arrive();
      return;
    }
    this._parkedMs += dt * 1000;
    const left = 1 - this._hits / this._needed;
    const slide = this._givesWay ? (1 - left) * BLOCKER.slideMaxPx * this._dir : 0;
    this._x = this._park.x + slide + this._shove;
    this._meter.draw(this._givesWay ? left : null);
    while (
      this._dropsLeft.length > 0 &&
      this._parkedMs >= BLOCKER.coverDropMs + this._dropsTaken * BLOCKER.dropStaggerMs
    ) {
      const next = this._dropsLeft.shift();
      this._dropsTaken++;
      if (next) this._dropsDue.push(next);
    }
    if (this._parkedMs >= BLOCKER.stayMs) this._beginLeaving();
  }

  /** It has arrived: the instruments under it go quiet but keep running down. */
  private _arrive(): void {
    this._parked = true;
    this._parkedMs = 0;
    this._covering = true;
    for (const s of this._covered) {
      s.silenced = true;
      s.pulse(1);
    }
    this._dropsLeft = this._covered.filter((s) => s.currentState === SpinnerState.FULL);
    this._kick = 1;
  }
}
