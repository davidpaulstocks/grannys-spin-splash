/**
 * What every visitor shares: a container that slides in from an edge with a
 * short warning peek, wobbles when hit and is dropped once its visit is
 * over. The three kinds are subclasses — `BlockerVisitor` (parks over a
 * cluster of instruments and takes water), `ThiefVisitor` (sits on one and
 * steals coins), `TreatVisitor` (flies across and pops) — and the director
 * decides when each comes and what its outcome pays.
 */

import Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';
import type { Spinner } from '../spinner/Spinner';
import type { WaterParticle } from '../waterParticle/WaterParticle';
import { VISIT_MOTION as M } from './visitorTuning.data';
import type { VisitorDef, VisitorHit, VisitorPhase } from './visitor.types';
import { VisitorBody } from './VisitorBody';

const { Back } = Phaser.Math.Easing;
const NO_SPINNERS: readonly Spinner[] = [];
const NO_AIM = null as VisitorAimPoint | null;

/** What every visitor is sent out with. */
export interface VisitorSpec {
  readonly def: VisitorDef;
  /** Which way it travels (and, for a sitter, leaves). */
  readonly dir: 1 | -1;
  /** A mover's height. */
  readonly y: number;
  /** Width of the picture on screen, px, if it is not the def's own (a blocker sized to its cluster). */
  readonly widthPx?: number;
}

/** Somewhere the player can point at: where it is and how generous the target is. */
export interface VisitorAimPoint {
  readonly x: number;
  readonly y: number;
  readonly aimRadius: number;
}

export abstract class Visitor extends Phaser.GameObjects.Container {
  readonly def: VisitorDef;
  protected readonly _dir: 1 | -1;
  protected readonly _body: VisitorBody;
  protected readonly _baseY: number;
  protected readonly _startX: number;
  protected readonly _peekX: number;
  protected readonly _endX: number;
  protected _phase: VisitorPhase = 'telegraph';
  protected _phaseMs = 0;
  protected _x = 0;
  protected _kick = 0;

  constructor(scene: Phaser.Scene, spec: VisitorSpec) {
    super(scene, 0, 0);
    this.def = spec.def;
    this._dir = spec.dir;
    this._baseY = spec.y;
    const width = spec.widthPx ?? spec.def.artPx;
    const half = width * M.offscreenFraction;
    this._startX = spec.dir > 0 ? -half : GAME_WIDTH + half;
    this._endX = spec.dir > 0 ? GAME_WIDTH + half : -half;
    this._peekX = this._startX + spec.dir * width * M.peekFraction;
    this._x = this._startX;
    this._body = new VisitorBody(scene, spec.def, spec.dir);
    this.add(this._body);
    this.setDepth(M.depth);
    scene.add.existing(this);
    this.setPosition(this._x, this._baseY);
  }

  /** True once the visit is over and the director can drop it. */
  get done(): boolean {
    return this._phase === 'done';
  }

  /** The instruments this visitor sits on or covers, so the director never sends two to one. */
  get occupied(): readonly Spinner[] {
    return NO_SPINNERS;
  }

  /** Where the player can aim at it, or null (a sitter is aimed at through its instrument). */
  get aimPoint(): VisitorAimPoint | null {
    return NO_AIM;
  }

  /** Advances the visit one frame; `time` is the scene clock in ms. */
  override update(time: number, deltaMs: number): void {
    this._phaseMs += deltaMs;
    this._kick = Math.max(0, this._kick - M.kickDecayPerS * (deltaMs / 1000));
    const rock = Math.sin(time * M.rockRadPerMs) * this._kick * M.kickRockRadians;
    this._body.setRotation(rock + this._extraRotation(time));
    this._step(time, deltaMs / 1000);
  }

  /**
   * Tests one water particle against this visitor. Returns null if it
   * misses (the particle flies on); otherwise recycles it and says what the
   * hit meant.
   */
  abstract tryBlock(particle: WaterParticle): VisitorHit | null;

  /** One frame of this kind's own movement. */
  protected abstract _step(time: number, dt: number): void;

  /** A turn added to the wobble (a treat's sway, a cleared blocker's spin). */
  protected _extraRotation(_time: number): number {
    return 0;
  }

  /** Frees whatever the visit was holding. */
  protected _release(): void {
    // Nothing held by default.
  }

  /** Ends the visit for good and frees what it held. */
  protected _finish(): void {
    this._release();
    this._phase = 'done';
    this.setVisible(false);
  }

  /** Slides a mover in from its edge during the warning, with a little overshoot. */
  protected _peek(ms: number): void {
    const t = Math.min(1, ms / M.telegraphMs);
    this._x = this._startX + (this._peekX - this._startX) * Back.Out(t, M.backOvershoot);
    if (t >= 1) {
      this._phase = 'active';
      this._phaseMs = 0;
      this._x = this._peekX;
    }
  }

  override destroy(fromScene?: boolean): void {
    this._release();
    super.destroy(fromScene);
  }
}
