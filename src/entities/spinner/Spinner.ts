/**
 * Procedural spinner — STOPPED/SLOW/MEDIUM/FULL state machine, decay,
 * redraw on state change (CLAUDE.md §2, story 1.2). Drawing itself lives
 * in spinnerRenderers.ts; this class owns the physics + state.
 */

import Phaser from 'phaser';

import { MAX_SPEED_HOLD_MS, MAX_SPINNER_SPEED, SPINNER_STATE_THRESHOLDS } from './spinner.data';
import { SpinnerState, type SpinnerDef } from './spinner.types';
import { drawInstrumentBadge } from './instrumentBadge';
import { InstrumentMount } from './InstrumentMount';
import { drawSpinner } from './spinnerRenderers';
import { COLOUR } from '../../utils/colour';

/** Degrees-per-second-per-speed-unit for the visible spin (prototype: `angle += speed * 0.065 * dt`). */
const SPIN_ROTATION_FACTOR = 0.065;
/** Whirligig-only: chance an incoming hit is deflected instead of landing (prototype `Math.random()<0.38`). */
const WHIRLIGIG_DEFLECT_CHANCE = 0.38;

/** Wobble near max speed (CLAUDE.md §5.6): "6% scale oscillation at 8Hz when speed > 75". */
const WOBBLE_SPEED_THRESHOLD = 75;
const WOBBLE_AMPLITUDE = 0.06;
const WOBBLE_FREQUENCY_HZ = 8;

/**
 * The spinner's reaction to being hit and to its own musician's notes: a
 * quick swell and a flash of light that die away. Both ride one value so a
 * squirt and a note can never fight over the scale.
 */
const PULSE_SCALE = 0.2;
const PULSE_FLASH_ALPHA = 0.5;
/** Seconds for a pulse to fall to about a third — short enough to read as a beat, not a throb. */
const PULSE_DECAY_SECONDS = 0.11;

/**
 * An instrument about to drop out of full speed rocks slowly from side to
 * side, so the player can see which one needs them next. (The "z z z" over a
 * stopped spinner went 2026-11-26 with the wake/sleep framing: a stopped
 * instrument is simply quiet.)
 */
/** Below this speed a spinner at full is on its way out, and nods. */
const DROWSY_SPEED = 90;
const DROWSY_ROCK_DEGREES = 7;
const DROWSY_ROCK_HZ = 2.2;
/** The Heat Orange ring that pulses around it as well, so the danger shows at a glance. */
const WARN_RING_GAP_PX = 6;
const WARN_RING_PX = 5;
const WARN_PULSE_HZ = 4;
const WARN_ALPHA_MIN = 0.45;
const WARN_SCALE_DEPTH = 0.06;

const MOUNT_RADIUS_FACTOR = 1.16;
const MOUNT_FILL_ALPHA = 0.42;
const MOUNT_RING_PX = 3;
const MOUNT_RING_ALPHA = 0.45;

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
  /** The state it was in before this change. */
  readonly previous: SpinnerState;
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
  /** How long this spinner holds at top speed before winding down — set per gig, see gigs.data.ts. */
  holdMs = MAX_SPEED_HOLD_MS;
  /** Remaining decay-free grace after being topped right up, ms — see MAX_SPEED_HOLD_MS. */
  private _holdUntilMs = 0;

  private readonly _bladeGfx: Phaser.GameObjects.Graphics;
  private readonly _glowGfx: Phaser.GameObjects.Graphics;
  private readonly _flashGfx: Phaser.GameObjects.Graphics;
  private readonly _warnGfx: Phaser.GameObjects.Graphics;
  private readonly _instrument: InstrumentMount | null = null;
  private _pulse = 0;

  // Funfair-only: side-to-side drift (§1, world.data.ts's `movingTargets`).
  // Unset (null) for every spinner that isn't drifting — the common case.
  private _driftBaseX: number | null = null;
  private _driftRange = 0;
  private _driftSpeed = 0;
  private _driftPhase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: SpinnerDef) {
    super(scene, x, y);
    this.id = _nextId++;
    this.def = def;

    // A pale backing disc, so a stopped spinner still reads as a target
    // against a busy painted wall. Funfair's target boards already do this job.
    const mountGfx = scene.add.graphics();
    if (!def.mount) {
      mountGfx.fillStyle(COLOUR.cloud, MOUNT_FILL_ALPHA);
      mountGfx.fillCircle(0, 0, def.r * MOUNT_RADIUS_FACTOR);
      mountGfx.lineStyle(MOUNT_RING_PX, COLOUR.ink, MOUNT_RING_ALPHA);
      mountGfx.strokeCircle(0, 0, def.r * MOUNT_RADIUS_FACTOR);
    }
    this.add(mountGfx);
    this._glowGfx = scene.add.graphics();
    this._bladeGfx = scene.add.graphics();
    this._flashGfx = scene.add.graphics();
    this._flashGfx.fillStyle(0xffffff, 1);
    this._flashGfx.fillCircle(0, 0, def.r);
    this._flashGfx.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    // The instrument is added after the blades and never rotated: the blades
    // turn under it, so what the spinner *is* can always be read. Painted art
    // when it exists; otherwise the drawn badge for the musician's section.
    const badge = scene.add.graphics();
    if (InstrumentMount.canMount(scene, def.icon) && def.icon) {
      this._instrument = new InstrumentMount(scene, def.icon, def.r, this.id % 2 === 0 ? 1 : -1);
      scene.add.existing(this._instrument);
    } else if (def.family) {
      drawInstrumentBadge(badge, def.family, def.r);
    }
    this.add([this._glowGfx, this._bladeGfx, badge]);
    if (this._instrument) this.add(this._instrument);
    this.add(this._flashGfx);
    this._warnGfx = scene.add.graphics();
    this._warnGfx.lineStyle(WARN_RING_PX, COLOUR.heatOrange, 1);
    this._warnGfx.strokeCircle(0, 0, def.r * MOUNT_RADIUS_FACTOR + WARN_RING_GAP_PX);
    this._warnGfx.setVisible(false);
    this.add(this._warnGfx);
    scene.add.existing(this);

    drawSpinner(this._bladeGfx, this._glowGfx, this.def, this.currentState);
  }

  /**
   * Applies decay, advances rotation, and re-resolves state. Call once per
   * frame. Returns null unless the state just changed — see
   * {@link SpinnerUpdateResult}.
   */
  override update(time: number, deltaMs: number): SpinnerUpdateResult | null {
    const dt = deltaMs / 1000;
    if (this._holdUntilMs > 0) {
      this._holdUntilMs = Math.max(0, this._holdUntilMs - deltaMs);
    } else if (!this.locked) {
      this.currentSpeed = Math.max(0, this.currentSpeed - this.def.decay * dt);
    }
    this._bladeGfx.rotation += this.currentSpeed * SPIN_ROTATION_FACTOR * dt;
    this._pulse *= Math.exp(-dt / PULSE_DECAY_SECONDS);
    this._flashGfx.setAlpha(this._pulse * PULSE_FLASH_ALPHA);
    this._instrument?.sync(this._pulse, this.currentSpeed <= 0);
    this._updateDrowsiness(time);
    this._updateWobble(time);
    this._updateDrift(dt);

    const prevState = this.currentState;
    this.currentState = resolveState(this.currentSpeed);
    if (this.currentState === prevState) return null;

    drawSpinner(this._bladeGfx, this._glowGfx, this.def, this.currentState);
    return {
      state: this.currentState,
      previous: prevState,
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
    // Reaching the very top buys a decay-free grace period — see
    // MAX_SPEED_HOLD_MS for why the wall was otherwise un-completable by hand.
    if (this.currentSpeed >= MAX_SPINNER_SPEED) this._holdUntilMs = this.holdMs;
    return true;
  }

  /** Instantly maxes this spinner out (Golden Splash power-up). */
  maxOut(): void {
    this.currentSpeed = MAX_SPINNER_SPEED;
  }

  /** Funfair-only: starts a sinusoidal side-to-side drift around the spinner's current x (prototype: `driftRange:55`). */
  setDrift(range: number, speedRadPerSec: number): void {
    this._driftBaseX = this.x;
    this._driftRange = range;
    this._driftSpeed = speedRadPerSec;
    this._driftPhase = Math.random() * Math.PI * 2;
  }

  private _updateDrift(dt: number): void {
    if (this._driftBaseX === null) return;
    this._driftPhase += dt * this._driftSpeed;
    this.x = this._driftBaseX + Math.sin(this._driftPhase) * this._driftRange;
  }

  /** An instrument about to drop out of full speed nods and shows a warning ring; everyone else sits straight. */
  private _updateDrowsiness(time: number): void {
    const drowsy =
      this.currentState === SpinnerState.FULL &&
      !this.locked &&
      this._holdUntilMs <= 0 &&
      this.currentSpeed < DROWSY_SPEED;
    if (this._warnGfx.visible !== drowsy) this._warnGfx.setVisible(drowsy);
    if (!drowsy) {
      if (this.angle !== 0) this.setAngle(0);
      return;
    }
    const phase = (time / 1000) * DROWSY_ROCK_HZ * Math.PI * 2;
    this.setAngle(Math.sin(phase) * DROWSY_ROCK_DEGREES);
    const pulse = 0.5 + 0.5 * Math.sin((time / 1000) * WARN_PULSE_HZ * Math.PI * 2);
    this._warnGfx.setAlpha(WARN_ALPHA_MIN + (1 - WARN_ALPHA_MIN) * pulse);
    this._warnGfx.setScale(1 + WARN_SCALE_DEPTH * pulse);
  }

  /** Near-max speed gets a subtle scale wobble (CLAUDE.md §5.6) — settles flat again below the threshold. */
  private _updateWobble(time: number): void {
    const swell = 1 + this._pulse * PULSE_SCALE;
    if (this.currentSpeed <= WOBBLE_SPEED_THRESHOLD) {
      this.setScale(swell);
      return;
    }
    const phase = (time / 1000) * WOBBLE_FREQUENCY_HZ * Math.PI * 2;
    this.setScale(swell * (1 + WOBBLE_AMPLITUDE * Math.sin(phase)));
  }

  /**
   * Kicks the spinner: a swell and a flash that fade on their own. `strength`
   * is 0–1; a stronger pulse already in flight is never cut short by a
   * weaker one.
   */
  pulse(strength: number): void {
    this._pulse = Math.max(this._pulse, Math.min(1, strength));
  }
}
