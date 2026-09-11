/**
 * Procedural spinner — STOPPED/SLOW/MEDIUM/FULL state machine, decay,
 * redraw on state change (CLAUDE.md §2, story 1.2). Drawing itself lives
 * in spinnerRenderers.ts; this class owns the physics + state.
 */

import Phaser from 'phaser';

import { MAX_SPINNER_SPEED, SPINNER_STATE_THRESHOLDS } from './spinner.data';
import { SpinnerState, type SpinnerDef } from './spinner.types';
import { drawSpinner } from './spinnerRenderers';

/** Degrees-per-second-per-speed-unit for the visible spin (prototype: `angle += speed * 0.065 * dt`). */
const SPIN_ROTATION_FACTOR = 0.065;
/** Whirligig-only: chance an incoming hit is deflected instead of landing (prototype `Math.random()<0.38`). */
const WHIRLIGIG_DEFLECT_CHANCE = 0.38;

let _nextId = 1;

/** STOPPED < SLOW < MEDIUM < FULL — lets callers tell an upward transition from a downward (decay) one. */
export const STATE_ORDINAL: Readonly<Record<SpinnerState, number>> = {
  [SpinnerState.STOPPED]: 0,
  [SpinnerState.SLOW]: 1,
  [SpinnerState.MEDIUM]: 2,
  [SpinnerState.FULL]: 3,
};

function resolveState(speed: number): SpinnerState {
  if (speed <= 0) return SpinnerState.STOPPED;
  if (speed < SPINNER_STATE_THRESHOLDS.medium) return SpinnerState.SLOW;
  if (speed < SPINNER_STATE_THRESHOLDS.full) return SpinnerState.MEDIUM;
  return SpinnerState.FULL;
}

/**
 * Result of a per-frame update — only non-null when the state actually
 * changed this frame. `leveledUp` is what GameScene checks before awarding
 * stars: the prototype only pays out on an *upward* transition (levelling
 * up), never on a hit that doesn't change state and never on decay
 * dropping a spinner back down a tier.
 */
export interface SpinnerUpdateResult {
  readonly state: SpinnerState;
  readonly leveledUp: boolean;
}

export class Spinner extends Phaser.GameObjects.Container {
  /** Stable identity for ComboTracker's "same spinner vs different spinner" check. */
  readonly id: number;
  readonly def: SpinnerDef;

  currentSpeed = 0;
  /**
   * Named `currentState`, not `state` — Phaser.GameObjects.GameObject
   * already declares a generic `state: string | number` field and
   * shadowing it under `noImplicitOverride` invites confusion for no
   * benefit here.
   */
  currentState: SpinnerState = SpinnerState.STOPPED;
  /** While true (SPLASH FRENZY's bonus window), decay is suspended. */
  locked = false;

  private readonly _bladeGfx: Phaser.GameObjects.Graphics;
  private readonly _glowGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, def: SpinnerDef) {
    super(scene, x, y);
    this.id = _nextId++;
    this.def = def;

    this._glowGfx = scene.add.graphics();
    this._bladeGfx = scene.add.graphics();
    this.add([this._glowGfx, this._bladeGfx]);
    scene.add.existing(this);

    drawSpinner(this._bladeGfx, this._glowGfx, this.def, this.currentState);
  }

  /**
   * Applies decay, advances rotation, and re-resolves state. Call once per
   * frame. Returns null unless the state just changed — see
   * {@link SpinnerUpdateResult}.
   */
  override update(_time: number, deltaMs: number): SpinnerUpdateResult | null {
    const dt = deltaMs / 1000;
    if (!this.locked) {
      this.currentSpeed = Math.max(0, this.currentSpeed - this.def.decay * dt);
    }
    this._bladeGfx.rotation += this.currentSpeed * SPIN_ROTATION_FACTOR * dt;

    const prevState = this.currentState;
    this.currentState = resolveState(this.currentSpeed);
    if (this.currentState === prevState) return null;

    drawSpinner(this._bladeGfx, this._glowGfx, this.def, this.currentState);
    return {
      state: this.currentState,
      leveledUp: STATE_ORDINAL[this.currentState] > STATE_ORDINAL[prevState],
    };
  }

  /**
   * Applies a water hit. Whirligigs have a chance to deflect it entirely
   * (no speed gained). Returns whether the hit actually landed, so
   * GameScene knows whether to play a deflect vs. a hit reaction.
   */
  hit(power: number = this.def.power): boolean {
    if (this.def.deflects && Math.random() < WHIRLIGIG_DEFLECT_CHANCE) {
      return false;
    }
    this.currentSpeed = Math.min(MAX_SPINNER_SPEED, this.currentSpeed + power);
    return true;
  }

  /** Instantly maxes this spinner out (Golden Splash power-up). */
  maxOut(): void {
    this.currentSpeed = MAX_SPINNER_SPEED;
  }
}
