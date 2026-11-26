/**
 * One live visitor: a blocker that drifts across and stops water, a sitter
 * that lands on an instrument and silences it, or a treat that flies across
 * and pops. It owns its own movement, drawing and the state of its visit;
 * the director decides when it comes and what its outcome pays.
 */

import Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';
import type { Spinner } from '../spinner/Spinner';
import type { WaterParticle } from '../waterParticle/WaterParticle';
import { BALLOON_LAYOUT, VISIT_MOTION as M } from './visitor.data';
import type { VisitorDef, VisitorHit, VisitorPhase } from './visitor.types';
import { drawSitterShadow } from './sitterShadow';
import { VisitorBody } from './VisitorBody';

const { Back, Quadratic } = Phaser.Math.Easing;

/** What the director hands a visitor when it is sent out. */
export interface VisitorSpec {
  readonly def: VisitorDef;
  /** Which way it travels (and, for a sitter, leaves). */
  readonly dir: 1 | -1;
  /** A mover's height. */
  readonly y: number;
  /** The instrument a sitter lands on. */
  readonly host: Spinner | null;
  /** Hits that shoo a sitter. */
  readonly hitsNeeded: number;
}

/** Somewhere the player can point at: where it is and how generous the target is. */
export interface VisitorAimPoint {
  readonly x: number;
  readonly y: number;
  readonly aimRadius: number;
}

export class Visitor extends Phaser.GameObjects.Container {
  readonly def: VisitorDef;
  private readonly _dir: 1 | -1;
  private readonly _host: Spinner | null;
  private readonly _hitsNeeded: number;
  private readonly _body: VisitorBody;
  private readonly _shadow: Phaser.GameObjects.Graphics | null = null;
  private readonly _baseY: number;
  private readonly _startX: number;
  private readonly _peekX: number;
  private readonly _endX: number;
  private readonly _balloons: boolean[] = BALLOON_LAYOUT.map(() => true);
  private _phase: VisitorPhase = 'telegraph';
  private _phaseMs = 0;
  private _x = 0;
  private _boost = 0;
  private _kick = 0;
  private _hits = 0;
  private _leaveBaseY = 0;

  constructor(scene: Phaser.Scene, spec: VisitorSpec) {
    super(scene, 0, 0);
    this.def = spec.def;
    this._dir = spec.dir;
    this._host = spec.host;
    this._hitsNeeded = spec.hitsNeeded;
    this._baseY = spec.y;
    const half = spec.def.artPx * M.offscreenFraction;
    this._startX = spec.dir > 0 ? -half : GAME_WIDTH + half;
    this._endX = spec.dir > 0 ? GAME_WIDTH + half : -half;
    this._peekX = this._startX + spec.dir * spec.def.artPx * M.peekFraction;
    this._x = this._startX;

    this._body = new VisitorBody(scene, spec.def, spec.dir);
    this.add(this._body);
    this.setDepth(M.depth);
    scene.add.existing(this);

    if (spec.def.kind === 'sitter' && spec.host) {
      this._body.setAlpha(0);
      this._shadow = scene.add.graphics().setDepth(M.depth - 1);
      this.setPosition(spec.host.x, spec.host.y);
    } else {
      this.setPosition(this._x, this._baseY);
    }
  }

  /** True once the visit is over and the director can drop it. */
  get done(): boolean {
    return this._phase === 'done';
  }

  /** The instrument a sitter is on or heading for, so the director never sends two to one. */
  get host(): Spinner | null {
    return this._host;
  }

  /** Where the player can aim at it — only movers that are on the wall, never a sitter (that is its instrument). */
  get aimPoint(): VisitorAimPoint | null {
    if (this._phase !== 'active' || this.def.kind === 'sitter') return null;
    const radius =
      this.def.id === 'balloons'
        ? this.def.artPx * M.balloonAimFraction
        : Math.max(this.def.hitRx, this.def.hitRy);
    return { x: this.x, y: this.y + this.def.hitOffsetY, aimRadius: radius };
  }

  /** Advances the visit one frame; `time` is the scene clock in ms. */
  override update(time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    this._phaseMs += deltaMs;
    this._kick = Math.max(0, this._kick - M.kickDecayPerS * dt);
    this._boost = Math.max(0, this._boost - M.boostDecayPerS * dt);
    const rock = Math.sin(time * M.rockRadPerMs) * this._kick * M.kickRockRadians;
    const sway =
      this.def.kind === 'treat'
        ? Math.sin((time / 1000) * M.treatSpinHz * Math.PI * 2) *
          Phaser.Math.DegToRad(M.treatSpinDegrees)
        : 0;
    this._body.setRotation(rock + sway);
    if (this.def.kind === 'sitter') this._updateSitter(time, dt);
    else if (this.def.kind === 'treat') this._updateTreat();
    else this._updateBlocker(time, dt);
  }

  /**
   * Tests one water particle against this visitor. Returns null if it
   * misses (the particle flies on); otherwise recycles it and says what the
   * hit meant.
   */
  tryBlock(particle: WaterParticle): VisitorHit | null {
    if (this._phase !== 'active') return null;
    if (this.def.kind === 'sitter') return this._hitSitter(particle);
    if (this.def.id === 'balloons') return this._hitBalloons(particle);
    if (!this._insideHitArea(particle.x, particle.y)) return null;
    particle.blockAndRecycle();
    if (this.def.kind === 'treat') {
      this._beginLeaving();
      return 'treat';
    }
    this._boost = Math.min(M.boostMax, this._boost + M.nudgePerHit);
    this._kick = Math.min(1, this._kick + M.kickPerHit);
    return 'absorbed';
  }

  /** Frees whatever the visit was holding — the instrument a sitter silenced. */
  override destroy(fromScene?: boolean): void {
    if (this._host) this._host.silenced = false;
    this._shadow?.destroy();
    super.destroy(fromScene);
  }

  private _insideHitArea(px: number, py: number): boolean {
    const dx = (px - this.x) / this.def.hitRx;
    const dy = (py - (this.y + this.def.hitOffsetY)) / this.def.hitRy;
    return dx * dx + dy * dy < 1;
  }

  private _hitBalloons(particle: WaterParticle): VisitorHit | null {
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

  private _hitSitter(particle: WaterParticle): VisitorHit | null {
    const host = this._host;
    if (!host) return null;
    const reach = host.def.r * host.scaleX + M.sitterHitPadPx;
    if (Math.hypot(particle.x - host.x, particle.y - host.y) >= reach) return null;
    particle.blockAndRecycle();
    this._hits++;
    this._kick = Math.min(1, this._kick + M.kickPerHit);
    if (this._hits < this._hitsNeeded) return 'absorbed';
    this._beginLeaving();
    return 'shoo';
  }

  private _beginLeaving(): void {
    if (this._phase === 'leaving' || this._phase === 'done') return;
    this._phase = 'leaving';
    this._phaseMs = 0;
    this._leaveBaseY = this.y;
    if (this._host) this._host.silenced = false;
    if (this.def.kind === 'sitter') this._body.redraw(true, this._balloons);
  }

  private _finish(): void {
    this._phase = 'done';
    this.setVisible(false);
  }

  private _updateBlocker(time: number, dt: number): void {
    if (this._phase === 'telegraph') {
      this._peek(this._phaseMs);
    } else if (this._phase === 'active') {
      const speed =
        (Math.abs(this._endX - this._peekX) / M.blockerCrossSeconds) * (1 + this._boost);
      this._x += this._dir * speed * dt;
      if ((this._x - this._endX) * this._dir >= 0) this._finish();
    } else if (this._phase === 'leaving') {
      this._leaveFast(dt);
    }
    this.x = this._x;
    this.y = this._baseY + Math.sin((time / 1000) * M.blockerBobHz * Math.PI * 2) * M.blockerBobPx;
  }

  private _updateTreat(): void {
    if (this._phase === 'telegraph') {
      this._peek(this._phaseMs);
      this.x = this._x;
      this.y = this._baseY;
      return;
    }
    if (this._phase === 'active') {
      const p = Math.min(1, this._phaseMs / (M.treatCrossSeconds * 1000));
      this._x = this._peekX + (this._endX - this._peekX) * p;
      this.x = this._x;
      this.y = this._baseY - Math.sin(Math.PI * p) * M.treatArcPx;
      if (p >= 1) this._finish();
      return;
    }
    const t = Math.min(1, this._phaseMs / M.popMs);
    this._body.swell(1 + (M.popSwell - 1) * t);
    this._body.setAlpha(1 - t);
    if (t >= 1) this._finish();
  }

  private _updateSitter(time: number, dt: number): void {
    const host = this._host;
    if (!host) return this._finish();
    const perchY = host.y - host.def.r * M.sitterPerchFraction;
    if (this._phase === 'telegraph') {
      if (this._shadow) drawSitterShadow(this._shadow, host, this._phaseMs);
      if (this._phaseMs >= M.telegraphMs) {
        this._phase = 'drop';
        this._phaseMs = 0;
        this._body.setAlpha(1);
      }
      return;
    }
    if (this._phase === 'drop') {
      const t = Math.min(1, this._phaseMs / M.sitterDropMs);
      this.setPosition(host.x, perchY - M.sitterDropHeightPx * (1 - Quadratic.In(t)));
      if (t >= 1) {
        this._shadow?.clear();
        host.silenced = true;
        host.pulse(1);
        this._kick = 1;
        this._phase = 'active';
        this._phaseMs = 0;
      }
      return;
    }
    if (this._phase === 'active') {
      this.setPosition(host.x, perchY + Math.sin(time * M.perchSwayRadPerMs) * M.perchSwayPx);
      if (this._phaseMs >= M.sitterStayMs) this._beginLeaving();
      return;
    }
    const t = Math.min(1, this._phaseMs / M.sitterExitMs);
    this.x += this._dir * M.sitterExitPxPerS * dt;
    const hop =
      Math.abs(Math.sin((this._phaseMs / 1000) * M.sitterHopHz * Math.PI)) * M.sitterHopPx;
    this.y = this._leaveBaseY - hop - this.def.exitRisePxPerS * (this._phaseMs / 1000);
    this._body.setAlpha(1 - Quadratic.In(t));
    if (t >= 1) this._finish();
  }

  /** Slides a mover in from its edge during the warning, with a little overshoot. */
  private _peek(ms: number): void {
    const t = Math.min(1, ms / M.telegraphMs);
    this._x = this._startX + (this._peekX - this._startX) * Back.Out(t, M.backOvershoot);
    if (t >= 1) {
      this._phase = 'active';
      this._phaseMs = 0;
      this._x = this._peekX;
    }
  }

  /** A blocker whose balloons are all gone floats off quickly. */
  private _leaveFast(dt: number): void {
    this._x += this._dir * M.sitterExitPxPerS * dt;
    this._body.setAlpha(Math.max(0, 1 - this._phaseMs / M.sitterExitMs));
    if (this._phaseMs >= M.sitterExitMs) this._finish();
  }
}
