/**
 * Aim, fire and the water jet — everything between the pointer and the
 * cannon. Resolves the crosshair against the wall, aims the gun, and drives
 * the cannon, its pump cycle and the hiss of the jet each frame.
 */

import type Phaser from 'phaser';

import { waterSound } from '../../audio/WaterSound';
import {
  AIM_BOX_GROW,
  AIM_CAPTURE_EXTRA,
  AIM_CAPTURE_SCALE,
  AIM_MAGNET_MARGIN,
  AIM_PICKUP_MARGIN,
  AIM_PICKUP_RADIUS,
  AIM_REACH_GAIN,
  AIM_REACH_PIVOT,
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
import { pickVisitorLock } from '../../utils/shotLock';
import { aimBox, clampToBox, resolveSoftAim } from '../../utils/softAim';
import { FreeAimMarker } from './FreeAimMarker';
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
  /** Power-up windows (the Soaker's wider fire). Absent where there are no pickups (Jam). */
  readonly powerups?: PowerUpEffects;
  /** The fixed grid plus a live Golden Spinner, if any — for aim/fire only. */
  readonly activeSpinners: () => readonly Spinner[];
  /**
   * Live power-up pickups, so aim can go to one the pointer is on instead of
   * the magnet pulling to the nearest spinner — power-ups and visitors alike
   * (a visitor brings its own `aimRadius`). Optional: without it pickups are
   * only collected by shots passing through them.
   */
  readonly pickupPoints?: () => readonly {
    readonly x: number;
    readonly y: number;
    readonly aimRadius?: number;
  }[];
  /**
   * Visitors the player can aim at (a blocker, a treat, balloons). Aim on one
   * locks the shots onto it: they fly over the instruments in the way.
   */
  readonly visitorPoints?: () => readonly {
    readonly x: number;
    readonly y: number;
    readonly aimRadius: number;
  }[];
}

export class FireControl {
  /** One ring, moved between targets. */
  private readonly _ring: Phaser.GameObjects.Arc;
  /** Reticle and landing splash where free-aimed water ends; hidden while snapped or on a visitor. */
  private readonly _marker: FreeAimMarker;
  /** True for the frame the aim is on bare wall: not snapped to an instrument and not on a visitor. */
  private _free = false;
  private _targetId: number | null = null;
  /** True for the frame the aim sits on a visitor. */
  private _visitorLock = false;
  private _cursorHidden: boolean | null = null;

  constructor(private _d: FireControlDeps) {
    this._ring = _d.scene.add
      .circle(0, 0, 1, COLOUR.mintGreen, 0)
      .setStrokeStyle(AIM_RING_STROKE, COLOUR.mintGreen)
      .setVisible(false);
    this._marker = new FreeAimMarker(_d.scene);
  }

  /** Puts a different gun in her hands (Jam's gun button): the sprite, the cannon behind it and the gun's numbers. */
  swapGun(next: Pick<FireControlDeps, 'gunSprite' | 'cannon' | 'gun'>): void {
    this._d = { ...this._d, ...next };
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
    const input = d.input;
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
    // Still gated on `started` (GO of the count-in, see CountIn.ts). There is
    // no off switch: Space used to toggle the jet and children kept pressing
    // it by accident (owner, 2026-11-27), so the water is always on.
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
      soakerActive: d.powerups?.soakerActive(time) ?? false,
      visitorLock: this._visitorLock,
    });
    // The hiss of the jet: on only while water is actually leaving the gun.
    waterSound.setFiring(firing && !d.cannon.isPumping && d.cannon.tank > 0);
    this._onPumpEvent(d.cannon.updatePump(time));
    const flowing = firing && !d.cannon.isPumping && d.cannon.tank > 0;
    d.jet.update(time, d.gunSprite.getNozzleWorldPosition(), flowing, d.gun);
    this._marker.update(time, aim, this._free && input.hasAimed(), flowing, d.gun);
  }

  /**
   * Resolves the aim point. Free aim with a soft snap (2026-11-27). Owner:
   * "you kind of aim and they seem to just get stuck on one predetermined
   * point of each of the spinners rather than giving you free aim, which
   * makes it harder to hit the treats or hit the barriers". The water goes
   * where the pointer is (a mouse pushed outward by the reach boost), and
   * only inside an instrument's capture radius does it snap to its centre
   * with the ring. A visitor or pickup under the pointer takes it first.
   * Before the pointer has moved it starts on the instrument nearest the
   * wall's bottom-centre. Also moves the ring; the free point is marked by FreeAimMarker.
   */
  private _updateAim(): AimResult {
    const d = this._d;
    const touch = d.input.isTouchAim();
    const aimed = d.input.hasAimed();
    const raw = aimed ? d.input.getPointer() : AIM_REACH_PIVOT;
    const point = touch
      ? raw
      : scaleAboutPivot(raw, AIM_REACH_PIVOT, AIM_REACH_GAIN, GAME_WIDTH, GAME_HEIGHT);
    this._setCursorHidden(!touch);

    const visitor = pickVisitorLock(point.x, point.y, d.visitorPoints?.() ?? [], AIM_PICKUP_MARGIN);
    this._visitorLock = visitor !== null;
    if (visitor) {
      // Dead-centre on the visitor, whatever the instruments in between.
      this._showRing(null);
      this._free = false;
      return { x: visitor.x, y: visitor.y, target: null, snapped: false };
    }
    const onPickup = (d.pickupPoints?.() ?? []).some(
      (p) =>
        distance(point.x, point.y, p.x, p.y) <
        (p.aimRadius ?? AIM_PICKUP_RADIUS) + AIM_PICKUP_MARGIN,
    );
    const spinners = d.activeSpinners();
    let aim: AimResult;
    if (onPickup) {
      aim = { x: point.x, y: point.y, target: null, snapped: false };
    } else if (!aimed) {
      const targets = spinners.map((s) => ({ id: s.id, x: s.x, y: s.y }));
      aim = resolveMagneticAim(point, targets, this._targetId, AIM_MAGNET_MARGIN);
    } else {
      const targets = spinners.map((s) => ({
        id: s.id,
        x: s.x,
        y: s.y,
        r: s.def.r * s.scaleX,
      }));
      // The aim cannot leave the band: an overshoot lands on the top row, not in the sky.
      const inBand = clampToBox(point, aimBox(targets, AIM_BOX_GROW));
      aim = resolveSoftAim(
        inBand,
        targets,
        this._targetId,
        AIM_CAPTURE_SCALE,
        AIM_CAPTURE_EXTRA,
        AIM_MAGNET_MARGIN,
      );
    }
    this._showRing(aim.target ? (spinners.find((s) => s.id === aim.target?.id) ?? null) : null);
    this._free = !aim.snapped;
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
