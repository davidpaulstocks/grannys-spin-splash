/**
 * Aim, fire and the water jet — everything between the pointer and the
 * cannon. Resolves the crosshair against the wall, aims the gun, and drives
 * the cannon, its pump cycle and the hiss of the jet each frame.
 */

import type Phaser from 'phaser';

import { waterSound } from '../../audio/WaterSound';
import {
  AIM_MAGNET_MARGIN,
  AIM_PICKUP_MARGIN,
  AIM_PICKUP_RADIUS,
  AIM_REACH_GAIN,
  AIM_REACH_PIVOT,
  AIM_RETICLE_RADIUS,
  AIM_RETICLE_STROKE,
  AIM_RING_PADDING,
  AIM_RING_POP_FROM,
  AIM_RING_POP_MS,
  AIM_RING_STROKE,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRANNY_Y_FROM_BOTTOM,
} from '../../config';
import type { Granny } from '../../entities/granny/Granny';
import type { Gun } from '../../entities/gun/Gun';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Spinner } from '../../entities/spinner/Spinner';
import type { PumpEvent, WaterCannon } from '../../entities/waterParticle/WaterCannon';
import type { WaterJet } from '../../entities/waterParticle/WaterJet';
import type { InputManager } from '../../systems/InputManager';
import { spawnFloatingText } from '../../ui/FloatingText';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import type { AimResult } from '../../types/input';
import { distance, resolveMagneticAim, scaleAboutPivot } from '../../utils/math';
import type { PowerUpEffects } from './PowerUpEffects';

/** What the firing line reads from the rest of the scene. */
export interface FireControlDeps {
  readonly scene: Phaser.Scene;
  readonly input: InputManager;
  readonly granny: Granny;
  readonly gunSprite: Gun;
  readonly cannon: WaterCannon;
  readonly jet: WaterJet;
  readonly gun: GunDef;
  readonly powerups: PowerUpEffects;
  /** The fixed grid plus a live Golden Spinner, if any — for aim/fire only. */
  readonly activeSpinners: () => readonly Spinner[];
  /**
   * Live power-up pickups, so aim can go to one the pointer is on instead of
   * the magnet pulling to the nearest spinner. Optional: without it pickups
   * are only collected by shots passing through them.
   */
  readonly pickupPoints?: () => readonly { readonly x: number; readonly y: number }[];
}

export class FireControl {
  /** One ring, moved between targets. */
  private readonly _ring: Phaser.GameObjects.Arc;
  /** Mouse-only dot at the effective aim point (the OS cursor is hidden). */
  private readonly _reticle: Phaser.GameObjects.Arc;
  private _targetId: number | null = null;
  private _cursorHidden: boolean | null = null;

  constructor(private readonly _d: FireControlDeps) {
    this._ring = _d.scene.add
      .circle(0, 0, 1, COLOUR.mintGreen, 0)
      .setStrokeStyle(AIM_RING_STROKE, COLOUR.mintGreen)
      .setVisible(false);
    this._reticle = _d.scene.add
      .circle(0, 0, AIM_RETICLE_RADIUS, COLOUR.cloud)
      .setStrokeStyle(AIM_RETICLE_STROKE, COLOUR.ink)
      .setVisible(false);
  }

  /** Gives the OS cursor back — call on pause and when the scene shuts down. */
  showCursor(): void {
    this._d.scene.input.setDefaultCursor('');
    this._cursorHidden = null;
  }

  /**
   * One frame of aiming and firing. `started` gates the water on a real first
   * input; `introPlaying` freezes her mid-turn.
   */
  update(time: number, started: boolean, introPlaying: boolean): void {
    const d = this._d;
    const aim = this._updateAim();
    const grip = d.granny.getGunGripOrigin();
    d.gunSprite.updateAim(grip.x, grip.y, aim.x, aim.y);
    // Aim-to-fire (2026-09-12, direct user request: "if that's best, remove
    // the need to shoot and just have aim via mouse or trackpad"). The player
    // only ever steers; the water is always on once the round has started.
    //
    // It fires unconditionally rather than only when the crosshair is snapped
    // to a spinner. The snapped-only version was gated to avoid wasting tank
    // on bare wall — but that reason died when the tank was resized to last
    // the whole round (gun.data.ts), and measuring the geometry showed what
    // it actually cost: only 67% of Garden's wall is inside the 96px snap
    // radius, with 73px-wide dead columns between spinner columns, so roughly
    // a third of the time a player was sweeping the wall the cannon silently
    // produced nothing at all. That is a large part of why Splash Frenzy felt
    // out of reach (direct user feedback: "I seem to be nowhere near getting
    // a splash frenzy going... it feels like I don't have the power").
    //
    // Still gated on `started` so the round clock and gameplayStart() begin
    // on a real first input (§3), not on an idle mouse drifting over the wall.
    const firing = !introPlaying && started;
    d.granny.setFiring(firing);
    d.cannon.update(time, {
      firing,
      origin: d.gunSprite.getNozzleWorldPosition(),
      aimX: aim.x,
      aimY: aim.y,
      target: aim.target
        ? (d.activeSpinners().find((sp) => sp.id === aim.target?.id) ?? null)
        : null,
      soakerActive: d.powerups.soakerActive(time),
    });
    // The hiss of the jet: on only while water is actually leaving the gun.
    waterSound.setFiring(firing && !d.cannon.isPumping && d.cannon.tank > 0);
    this._onPumpEvent(d.cannon.updatePump(time));
    d.jet.update(
      time,
      d.gunSprite.getNozzleWorldPosition(),
      firing && !d.cannon.isPumping && d.cannon.tank > 0,
      d.gun.particleColour,
      d.gun.sz,
    );
  }

  /**
   * Resolves the aim point: the pointer (pushed outward for mouse/trackpad),
   * then pulled to the nearest spinner, or left on a pickup it is over.
   * Also moves the targeting ring and the mouse reticle.
   */
  private _updateAim(): AimResult {
    const d = this._d;
    const touch = d.input.isTouchAim();
    const raw = d.input.getPointer();
    const point = touch
      ? raw
      : scaleAboutPivot(raw, AIM_REACH_PIVOT, AIM_REACH_GAIN, GAME_WIDTH, GAME_HEIGHT);
    this._setCursorHidden(!touch);
    this._reticle.setVisible(!touch).setPosition(point.x, point.y);

    const onPickup = (d.pickupPoints?.() ?? []).some(
      (p) => distance(point.x, point.y, p.x, p.y) < AIM_PICKUP_RADIUS + AIM_PICKUP_MARGIN,
    );
    const spinners = d.activeSpinners();
    const targets = spinners.map((s) => ({ id: s.id, x: s.x, y: s.y }));
    const aim = onPickup
      ? { x: point.x, y: point.y, target: null, snapped: false }
      : resolveMagneticAim(point, targets, this._targetId, AIM_MAGNET_MARGIN);
    this._showRing(aim.target ? (spinners.find((s) => s.id === aim.target?.id) ?? null) : null);
    return aim;
  }

  /** Keeps the ring on the targeted spinner, popping it in when the target changes. */
  private _showRing(spinner: Spinner | null): void {
    const ring = this._ring;
    if (!spinner) {
      this._targetId = null;
      ring.setVisible(false);
      return;
    }
    if (spinner.id !== this._targetId) {
      this._targetId = spinner.id;
      this._d.scene.tweens.killTweensOf(ring);
      ring.setScale(AIM_RING_POP_FROM);
      this._d.scene.tweens.add({
        targets: ring,
        scale: 1,
        duration: AIM_RING_POP_MS,
        ease: 'Quad.easeOut',
      });
    }
    ring
      .setVisible(true)
      .setPosition(spinner.x, spinner.y)
      .setRadius(spinner.def.r * spinner.scaleX + AIM_RING_PADDING);
  }

  /** Hides the OS cursor while a mouse is steering (the reticle replaces it); only touches the DOM on a change. */
  private _setCursorHidden(hidden: boolean): void {
    if (hidden === this._cursorHidden) return;
    this._cursorHidden = hidden;
    this._d.scene.input.setDefaultCursor(hidden ? 'none' : '');
  }

  /**
   * The REFILLED! flourish, off the cannon's own pump cycle.
   *
   * The mid-run "watch an ad to refill now" prompt that used to ride along
   * here was removed 2026-09-12 on direct user feedback ("annoying, very
   * interruptive"). CLAUDE.md §11.1 lists it as a placement, but the pump
   * only takes PUMP_REFILL_MS (2s): it offered a full-screen rewarded ad to
   * skip a two-second wait, roughly twice per 30-second round. That is a bad
   * trade for a seven-year-old and barely monetises. The other three §11.1
   * placements — the between-runs commercial break, double-score at game
   * over, and the free-gun offer on the splash — are all at natural breaks
   * and are untouched.
   */
  private _onPumpEvent(event: PumpEvent): void {
    if (event === 'completed') {
      spawnFloatingText(
        this._d.scene,
        this._d.granny.x,
        this._d.granny.y - GRANNY_Y_FROM_BOTTOM,
        'REFILLED!',
        COLOUR_HEX.waterBlue,
      );
    }
  }
}
