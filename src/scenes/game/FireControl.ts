/**
 * Aim, fire and the water jet — everything between the pointer and the
 * cannon. Resolves the crosshair against the wall, aims the gun, and drives
 * the cannon, its pump cycle and the hiss of the jet each frame.
 */

import type Phaser from 'phaser';

import { waterSound } from '../../audio/WaterSound';
import { AIM_SNAP_RADIUS, GRANNY_Y_FROM_BOTTOM } from '../../config';
import type { Granny } from '../../entities/granny/Granny';
import type { Gun } from '../../entities/gun/Gun';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Spinner } from '../../entities/spinner/Spinner';
import type { PumpEvent, WaterCannon } from '../../entities/waterParticle/WaterCannon';
import type { WaterJet } from '../../entities/waterParticle/WaterJet';
import type { InputManager } from '../../systems/InputManager';
import { spawnFloatingText } from '../../ui/FloatingText';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { resolveAim } from '../../utils/math';
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
}

export class FireControl {
  private readonly _crosshair: Phaser.GameObjects.Arc;

  constructor(private readonly _d: FireControlDeps) {
    this._crosshair = _d.scene.add
      .circle(0, 0, 10, COLOUR.softSlate, 0)
      .setStrokeStyle(3, COLOUR.softSlate);
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

  /** Resolves the crosshair position against the spinner wall and updates its visual snap feedback. */
  private _updateAim(): ReturnType<typeof resolveAim> {
    const pointer = this._d.input.getPointer();
    const targets = this._d.activeSpinners().map((s) => ({ id: s.id, x: s.x, y: s.y }));
    const aim = resolveAim(pointer.x, pointer.y, targets, AIM_SNAP_RADIUS);

    this._crosshair.setPosition(aim.x, aim.y);
    this._crosshair.setScale(aim.snapped ? 1.3 : 1);
    this._crosshair.setStrokeStyle(3, aim.snapped ? COLOUR.mintGreen : COLOUR.softSlate);
    return aim;
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
