/**
 * Core gameplay loop — orchestrates spinners, Granny, water, combo, and
 * Frenzy for a single 30-second run (CLAUDE.md §7.2, story 1.5). HUDScene
 * runs alongside it as a parallel overlay (CLAUDE.md §7.2) — GameScene
 * feeds it fresh state once per frame; GameOverScene takes over once the
 * round ends.
 */

import Phaser from 'phaser';

import {
  AIM_SNAP_RADIUS,
  COUNTDOWN_TICK_SHAKE_DURATION_MS,
  COUNTDOWN_TICK_SHAKE_INTENSITY,
  FINAL_COUNTDOWN_SECONDS,
  FRENZY_BONUS_STARS,
  FRENZY_DURATION_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRANNY_X_MARGIN,
  GRANNY_Y_FROM_BOTTOM,
  PUMP_REFILL_MS,
  SOAKER_EXTRA_WOBBLE,
  URGENT_COUNTDOWN_SECONDS,
  WALL_AREA,
  WATER_BAR_Y,
  WATER_PARTICLE_MAX_POOL,
} from '../config';
import { GUN_DEFS, DEFAULT_GUN_ID } from '../entities/gun/gun.data';
import { Obstacle } from '../entities/obstacle/Obstacle';
import { POWERUP_DEFS, type PowerUpEffect } from '../entities/powerup/powerup.data';
import { PowerUpSpawner } from '../entities/powerup/PowerUpSpawner';
import { MAX_SPINNER_SPEED, SPINNER_DEFS } from '../entities/spinner/spinner.data';
import {
  DEFAULT_WORLD_ID,
  GOLDEN_LIFETIME_MS,
  GOLDEN_SPAWN_DELAY_MS,
  WORLD_DEFS,
} from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { DEFAULT_GRANNY_ID } from '../entities/granny/granny.data';
import { Granny } from '../entities/granny/Granny';
import { Gun } from '../entities/gun/Gun';
import { Spinner, STATE_ORDINAL } from '../entities/spinner/Spinner';
import { WaterParticle } from '../entities/waterParticle/WaterParticle';
import { spawnSplash } from '../entities/waterParticle/splashVFX';
import * as poki from '../poki';
import { ComboTracker } from '../systems/ComboTracker';
import { FrenzyMeter } from '../systems/FrenzyMeter';
import { InputManager } from '../systems/InputManager';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { adManager } from '../systems/AdManager';
import { audioBus, AD_MUTE_HOOKS } from '../audio/AudioBus';
import * as SFX from '../audio/SFX';
import type { GunDef } from '../entities/gun/gun.types';
import type { HudRefreshData } from '../types/hud';
import type { GameOverData, GameSceneData } from '../types/sceneData';
import { SpinnerState } from '../entities/spinner/spinner.types';
import { hideBanner, playFrenzyCelebration } from '../ui/Banner';
import { spawnFloatingText } from '../ui/FloatingText';
import { createMobileMoveButtons } from '../ui/MobileMoveButtons';
import { createRefillPrompt } from '../ui/RefillPrompt';
import { showToast } from '../ui/Toast';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { computeGridPositions } from '../utils/grid';
import { distance, resolveAim } from '../utils/math';
import { DURATION, EASE } from '../utils/tween';
import type { HUDScene } from './HUDScene';

/** How close to the canvas edges a Duck obstacle may wander before bouncing back (prototype: 60px). */
const DUCK_BOUNCE_MARGIN = 60;
/** Funfair-only: how many spinners drift, and the drift radius (prototype: 3 spinners, 55px). */
const MOVING_TARGET_COUNT = 3;
const MOVING_TARGET_DRIFT_RANGE = 55;

/**
 * Visual-only stream density (2026-09-12, direct user feedback: "the
 * water guns felt much stronger... like they were blasting strongly" —
 * the prototype fires every 28ms, ~8x denser than this game's tuned
 * 110-220ms gun intervals). Rather than touch the simulated/tuned
 * interval-power-drain balance in gun.data.ts, both the fire cadence and
 * the per-particle power/drain are scaled by the same factor here, so
 * total DPS and tank-drain-per-second are mathematically unchanged —
 * only the granularity gets finer, which is what actually reads as "a
 * dense continuous stream" instead of discrete pulses.
 */
const FIRE_DENSITY_SCALE = 4;

/** Combo tiers ≥ this shake (prototype: `if(combo>=4) shake(150, 0.005*(combo-2))`). */
const COMBO_SHAKE_THRESHOLD = 4;

/** Floating "+N ★" colour by combo multiplier tier — escalates with the combo, matching the prototype's `awardStars`. */
function hitTextColour(multiplier: number): string {
  if (multiplier >= 4) return COLOUR_HEX.grannyPink;
  if (multiplier >= 2) return COLOUR_HEX.sunnyGold;
  return COLOUR_HEX.waterBlue;
}

export class GameScene extends Phaser.Scene {
  private _spinners: Spinner[] = [];
  private _obstacles: Obstacle[] = [];
  private _granny!: Granny;
  private _gunSprite!: Gun;
  private _input!: InputManager;
  private _waterPool!: Phaser.GameObjects.Group;
  private _frenzyMeter = new FrenzyMeter();
  private _combo = new ComboTracker();
  private _unlocks = new UnlockManager(saveManager);
  private _world!: WorldDef;
  private _grannyId!: string;
  private _gun!: GunDef;
  private _crosshair!: Phaser.GameObjects.Arc;
  private _hud!: HUDScene;
  private _frenzyBanner: Phaser.GameObjects.Text | null = null;
  private _refillPrompt!: Phaser.GameObjects.Container;

  private _score = 0;
  private _waterTank = 0;
  private _isPumping = false;
  private _pumpEndAt = 0;
  private _nextFireAt = 0;
  private _timeRemainingMs = 0;
  private _started = false;
  private _roundOver = false;
  private _frenzyActive = false;
  private _frenzyEndAt = 0;
  /** Last whole second the final-countdown tick/shake fired for — guards against re-firing every frame within the same second. */
  private _lastUrgentSecond = -1;

  // Bonus Golden Spinner — spawns outside the fixed grid, own lifetime, not part of `_spinners`/FrenzyMeter.
  private _goldenSpinner: Spinner | null = null;
  private _goldenLifetimeMs = 0;
  private _goldenSpawnAt = 0;

  // Power-ups (CLAUDE.md §1) — see PowerUpSpawner.ts for spawn/lifetime/collision; these are the
  // active-effect windows GameScene itself has to track to actually change gameplay.
  private _powerupSpawner!: PowerUpSpawner;
  private _soakerEndAt = 0;
  private _spinlockEndAt = 0;
  private _doubleStarsEndAt = 0;
  private _goldenSplashPending = false;

  constructor() {
    super('GameScene');
  }

  /**
   * Runs before create() — resolves the selected loadout early. No
   * preload() needed any more: BootScene preloads every launch granny/gun/
   * world asset up front, so every texture this scene uses is already in
   * the cache by the time a round starts.
   */
  init(data: Partial<GameSceneData>): void {
    const worldId = data.worldId ?? DEFAULT_WORLD_ID;
    this._world = WORLD_DEFS.find((w) => w.id === worldId) ?? WORLD_DEFS[0];
    this._grannyId = data.grannyId ?? DEFAULT_GRANNY_ID;
    const gunId = data.gunId ?? DEFAULT_GUN_ID;
    this._gun = GUN_DEFS.find((g) => g.id === gunId) ?? GUN_DEFS[0];
  }

  create(): void {
    this._waterTank = this._gun.tank;
    this._timeRemainingMs = this._world.time * 1000;
    this._resetRoundState(); // in case this is a "Play Again" restart of the same scene instance chain

    drawWorldBackground(this, this._world.id);
    this._buildWall(this._world.grid.cols, this._world.grid.rows, this._world.types);
    this._applyMovingTargets();
    this._buildObstacles();
    this._scheduleNextGolden();
    this._powerupSpawner = new PowerUpSpawner(this);
    this._granny = new Granny(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - GRANNY_Y_FROM_BOTTOM,
      this._grannyId,
    );
    this._gunSprite = new Gun(this, this._gun.id);
    this._input = new InputManager(this);
    this._waterPool = this.add.group({
      classType: WaterParticle,
      maxSize: WATER_PARTICLE_MAX_POOL,
      runChildUpdate: true,
    });

    this._createOverlays();

    this.scene.launch('HUDScene');
    this._hud = this.scene.get('HUDScene') as HUDScene;

    this._input.on('first-input', () => this._onFirstInput());
    this._input.on('pause', () => this._pauseGame());
    this._frenzyMeter.on('full', () => this._onFrenzyStart());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this._input.destroy());
  }

  override update(time: number, delta: number): void {
    // No manual pause guard needed here — Phaser skips update() entirely
    // for a paused scene (this.scene.pause(), called from _pauseGame()).
    if (this._roundOver) return;

    this._granny.move(
      this._input.getMoveDir(),
      delta / 1000,
      GRANNY_X_MARGIN,
      GAME_WIDTH - GRANNY_X_MARGIN,
    );

    for (const spinner of this._spinners) {
      const result = spinner.update(time, delta);
      if (result?.leveledUp) this._onSpinnerLeveledUp(spinner, result.state, time);
    }
    // Read spinner states into the Frenzy meter right after they're fresh —
    // NOT from inside the HUD refresh. See FrenzyMeter.ts's header comment:
    // that used to race with the window-release below. Golden Spinner is
    // deliberately excluded (own array, see class field comment) — a
    // temporary bonus spawn shouldn't distort Frenzy's "% of wall at FULL".
    this._frenzyMeter.update(this._spinners.map((s) => ({ state: s.currentState })));
    this._updateGolden(time, delta);

    for (const obstacle of this._obstacles) {
      obstacle.update(
        delta / 1000,
        this._spinners,
        DUCK_BOUNCE_MARGIN,
        GAME_WIDTH - DUCK_BOUNCE_MARGIN,
      );
    }
    this._updatePowerups(time, delta);

    const aim = this._updateAim();
    const grip = this._granny.getGunGripOrigin();
    this._gunSprite.updateAim(grip.x, grip.y, aim.x, aim.y);
    this._granny.setFiring(this._input.isFiring());
    this._updateFiring(time, aim);
    this._updatePump(time);
    this._updateWaterCollisions();
    this._combo.update(delta);
    this._updateFrenzyWindow(time);

    if (this._started) {
      this._timeRemainingMs = Math.max(0, this._timeRemainingMs - delta);
      this._updateCountdownUrgency();
      if (this._timeRemainingMs <= 0) {
        this._endRound();
        return;
      }
    }

    this._refreshHud();
  }

  /**
   * Final-countdown tick + shake (2026-09-12, restored from the
   * prototype — direct user feedback: "urgency building as the clock
   * counts down" was missing). The matching vignette/big-number visuals
   * live in HUDScene's `UrgencyOverlay`, independently keyed off the same
   * `secondsRemaining` value every frame — no cross-scene event needed,
   * since both derive from the same number in the same tick. This method
   * owns only what only GameScene *can* own: the world camera shake and
   * the SFX trigger (CLAUDE.md §7.1 — HUDScene stays a pure visual leaf).
   */
  private _updateCountdownUrgency(): void {
    const seconds = Math.ceil(this._timeRemainingMs / 1000);
    if (seconds > URGENT_COUNTDOWN_SECONDS || seconds === this._lastUrgentSecond) return;
    this._lastUrgentSecond = seconds;

    const final = seconds <= FINAL_COUNTDOWN_SECONDS;
    SFX.playTick(final);
    this.cameras.main.shake(
      final ? COUNTDOWN_TICK_SHAKE_DURATION_MS.final : COUNTDOWN_TICK_SHAKE_DURATION_MS.normal,
      final ? COUNTDOWN_TICK_SHAKE_INTENSITY.final : COUNTDOWN_TICK_SHAKE_INTENSITY.normal,
    );
  }

  /** Creates the GameScene-owned visual overlays that aren't part of HUDScene: the aim crosshair and the refill prompt. */
  private _createOverlays(): void {
    this._crosshair = this.add
      .circle(0, 0, 10, COLOUR.softSlate, 0)
      .setStrokeStyle(3, COLOUR.softSlate);
    this._refillPrompt = createRefillPrompt(
      this,
      GAME_WIDTH / 2,
      WATER_BAR_Y,
      () => void this._onWatchAdForRefill(),
    );
    createMobileMoveButtons(this, (direction, down) => this._input.setMobileMove(direction, down));
  }

  /** Resets every field a fresh round needs — covers first boot and a GameOverScene "Play Again" restart alike. */
  private _resetRoundState(): void {
    this._spinners = [];
    this._obstacles = [];
    this._goldenSpinner = null;
    this._goldenLifetimeMs = 0;
    this._score = 0;
    this._started = false;
    this._roundOver = false;
    this._frenzyActive = false;
    this._frenzyBanner = null;
    this._frenzyMeter.reset();
    this._combo.reset();
    this._lastUrgentSecond = -1;
    this._soakerEndAt = 0;
    this._spinlockEndAt = 0;
    this._doubleStarsEndAt = 0;
    this._goldenSplashPending = false;
  }

  /** Builds the spinner wall: an even grid within WALL_AREA, kinds cycled round-robin from the world's roster. */
  private _buildWall(cols: number, rows: number, kinds: readonly string[]): void {
    const positions = computeGridPositions(
      cols,
      rows,
      WALL_AREA.x,
      WALL_AREA.y,
      WALL_AREA.width,
      WALL_AREA.height,
    );
    positions.forEach((pos, i) => {
      const kind = kinds[i % kinds.length];
      const def = SPINNER_DEFS.find((d) => d.type === kind);
      if (!def) throw new Error(`No SPINNER_DEFS entry for kind "${kind}"`);
      this._spinners.push(new Spinner(this, pos.x, pos.y, def));
    });
  }

  /** Funfair-only: picks a few spinners at random and sets them drifting side to side (CLAUDE.md §1). */
  private _applyMovingTargets(): void {
    if (!this._world.movingTargets) return;
    const picks = Phaser.Utils.Array.Shuffle([...this._spinners]).slice(0, MOVING_TARGET_COUNT);
    for (const spinner of picks) {
      spinner.setDrift(MOVING_TARGET_DRIFT_RANGE, 0.4 + Math.random() * 0.4);
    }
  }

  /** Spawns this world's cat/umbrella/duck roster (CLAUDE.md §1, §4) within the spinner wall's play field. */
  private _buildObstacles(): void {
    const bounds = {
      x0: WALL_AREA.x,
      y0: WALL_AREA.y,
      x1: WALL_AREA.x + WALL_AREA.width,
      y1: WALL_AREA.y + WALL_AREA.height,
    };
    this._obstacles = this._world.obstacles.map(
      (kind) => new Obstacle(this, kind, bounds, this._spinners),
    );
  }

  /** The fixed grid roster plus a live Golden Spinner, if one is currently spawned — for aim/fire/collision only. */
  private _activeSpinners(): readonly Spinner[] {
    return this._goldenSpinner ? [...this._spinners, this._goldenSpinner] : this._spinners;
  }

  /** Resolves the crosshair position against the spinner wall and updates its visual snap feedback. */
  private _updateAim(): ReturnType<typeof resolveAim> {
    const pointer = this._input.getPointer();
    const targets = this._activeSpinners().map((s) => ({ id: s.id, x: s.x, y: s.y }));
    const aim = resolveAim(pointer.x, pointer.y, targets, AIM_SNAP_RADIUS);

    this._crosshair.setPosition(aim.x, aim.y);
    this._crosshair.setScale(aim.snapped ? 1.3 : 1);
    this._crosshair.setStrokeStyle(3, aim.snapped ? COLOUR.mintGreen : COLOUR.softSlate);
    return aim;
  }

  /** Fires `gun.streams` pooled water particles on cadence while held and the tank isn't empty/pumping. */
  private _updateFiring(time: number, aim: ReturnType<typeof resolveAim>): void {
    const canFire = this._input.isFiring() && !this._isPumping && this._waterTank > 0;
    if (!canFire || time < this._nextFireAt) return;

    const origin = this._gunSprite.getNozzleWorldPosition();
    const target = aim.target
      ? (this._activeSpinners().find((s) => s.id === aim.target?.id) ?? null)
      : null;

    // Multi-stream guns (Splash Jr, Soaker 3000) fire several particles per
    // cycle, all at the same aim point — each particle's own randomised
    // wobble (WaterParticle.fire) is what gives them a visible spread.
    for (let i = 0; i < this._gun.streams; i++) {
      const particle = this._waterPool.get() as WaterParticle | null;
      if (!particle) break;
      particle.setAppearance(this._gun.particleColour, this._gun.sz);
      particle.fire(origin.x, origin.y, aim.x, aim.y, target);
    }
    // Super Soaker power-up: two extra angled streams alongside the main
    // one for its duration (prototype: `applyPowerup`'s `fx.soaker`).
    if (time < this._soakerEndAt) {
      for (const side of [-1, 1] as const) {
        const extra = this._waterPool.get() as WaterParticle | null;
        if (extra) {
          extra.setAppearance(this._gun.particleColour, this._gun.sz);
          extra.fire(origin.x, origin.y, aim.x, aim.y, target, side * SOAKER_EXTRA_WOBBLE);
        }
      }
    }
    // FIRE_DENSITY_SCALE: drain scales down with interval so the actual
    // drain-per-second is unchanged — see its own doc comment.
    this._waterTank = Math.max(0, this._waterTank - this._gun.drain / FIRE_DENSITY_SCALE);
    this._nextFireAt = time + this._gun.interval / FIRE_DENSITY_SCALE;
  }

  /** Starts a pump-refill once the tank hits empty, and completes it once its timer elapses. */
  private _updatePump(time: number): void {
    if (this._waterTank <= 0 && !this._isPumping) {
      this._isPumping = true;
      this._pumpEndAt = time + PUMP_REFILL_MS;
      this._refillPrompt.setVisible(true);
      SFX.playPump();
    } else if (this._isPumping && time >= this._pumpEndAt) {
      this._isPumping = false;
      this._waterTank = this._gun.tank;
      this._refillPrompt.setVisible(false);
      SFX.playRefill();
      spawnFloatingText(
        this,
        this._granny.x,
        this._granny.y - GRANNY_Y_FROM_BOTTOM,
        'REFILLED!',
        COLOUR_HEX.waterBlue,
      );
    }
  }

  /** CLAUDE.md story 6.3: player-initiated only, shown solely while pumping — watching completes the refill instantly. */
  private async _onWatchAdForRefill(): Promise<void> {
    if (!this._isPumping) return;
    const watched = await adManager.playRewarded('small', AD_MUTE_HOOKS);
    if (!watched || !this._isPumping) return;

    this._isPumping = false;
    this._waterTank = this._gun.tank;
    this._refillPrompt.setVisible(false);
  }

  /** Tests every pooled particle against obstacles first, then its candidate spinner(s); applies hits/combo/score. */
  private _updateWaterCollisions(): void {
    const particles = this._waterPool.getChildren() as WaterParticle[];
    const activeSpinners = this._activeSpinners();
    for (const particle of particles) {
      if (!particle.active) continue;
      if (this._obstacles.some((o) => o.tryBlock(particle))) continue;

      const hitX = particle.x;
      const hitY = particle.y;
      const hitSpinner = particle.checkCollision(particle.getCandidates(activeSpinners));
      if (!hitSpinner) continue;

      // Golden Splash power-up: the next landed hit jumps straight to FULL
      // instead of its normal power — still routed through hit() so a
      // whirligig keeps its usual deflect chance (prototype: the effect
      // only ever fires from inside the "not deflected" branch).
      const usingGoldenSplash = this._goldenSplashPending;
      // FIRE_DENSITY_SCALE: each of the N denser particles carries 1/N the
      // power, so a shot that lands all of them still delivers the exact
      // total the tuned balance expects — see the constant's doc comment.
      const power = usingGoldenSplash ? MAX_SPINNER_SPEED : this._gun.power / FIRE_DENSITY_SCALE;
      const landed = hitSpinner.hit(power);
      spawnSplash(this, hitX, hitY, this._gun.particleColour);
      if (!landed) {
        SFX.playDeflect(); // whirligig
        continue;
      }
      if (usingGoldenSplash) this._goldenSplashPending = false;

      SFX.playHit(hitSpinner.currentSpeed);
      const comboBefore = this._combo.combo;
      const comboAfter = this._combo.registerHit(hitSpinner.id);
      if (comboAfter !== comboBefore) {
        SFX.playCombo(comboAfter);
        // Escalating shake on a hot streak (prototype: combo>=4) — never on
        // every single hit, only when the combo itself actually climbs.
        if (comboAfter >= COMBO_SHAKE_THRESHOLD) {
          this.cameras.main.shake(150, 0.005 * (comboAfter - 2));
        }
      }
    }
  }

  /** Stars are awarded only on an upward state transition (CLAUDE.md §2) — never per-hit, never on decay. */
  private _onSpinnerLeveledUp(spinner: Spinner, newState: SpinnerState, time: number): void {
    const levelBonus = Math.max(0, STATE_ORDINAL[newState] - 1);
    // Double Stars power-up stacks on top of the combo multiplier (prototype: `awardStars`'s `dsMult`).
    const doubleStarsActive = time < this._doubleStarsEndAt;
    const multiplier = this._combo.multiplier * (doubleStarsActive ? 2 : 1);
    const total = (spinner.def.stars + levelBonus) * multiplier;
    this._score += total;
    SFX.playUpgrade(STATE_ORDINAL[newState]);
    // Restored 2026-09-12 from the prototype's `awardStars` — direct user
    // feedback that per-hit feedback ("toasts when the player hit
    // targets") was part of what made hits feel rewarding. The permanent
    // score number stays hidden during play either way (CLAUDE.md story
    // 2.5) — this is transient combat text, not a persistent HUD readout.
    const label = multiplier > 1 ? `+${total} ★ ×${multiplier}` : `+${total} ★`;
    spawnFloatingText(
      this,
      spinner.x,
      spinner.y - spinner.def.r - 12,
      label,
      hitTextColour(multiplier),
    );
  }

  /** Advances every live power-up pickup and applies the effect of any just collected (CLAUDE.md §1). */
  private _updatePowerups(time: number, delta: number): void {
    const bounds = {
      x0: WALL_AREA.x,
      y0: WALL_AREA.y,
      x1: WALL_AREA.x + WALL_AREA.width,
      y1: WALL_AREA.y + WALL_AREA.height,
    };
    const particles = this._waterPool.getChildren() as WaterParticle[];
    const collected = this._powerupSpawner.update(time, delta, bounds, this._spinners, particles);
    for (const { effect, x, y } of collected) this._applyPowerupEffect(effect, time, x, y);

    // Spin Lock's own release — a plain `time >= endAt` check, same shape as
    // Frenzy's window (CLAUDE.md §1). The two share `spinner.locked`; both
    // being active at once is a rare edge case not worth a lock-reason
    // system for — worst case a spinner stays locked a beat longer.
    if (this._spinlockEndAt && time >= this._spinlockEndAt) {
      this._spinlockEndAt = 0;
      if (!this._frenzyActive) for (const spinner of this._spinners) spinner.locked = false;
    }
  }

  /**
   * Dispatches on the collected effect (prototype: `applyPowerup`) — each
   * one sets a timed window GameScene itself checks elsewhere (soaker in
   * `_updateFiring`, spinlock as `spinner.locked`, doubleStars in
   * `_onSpinnerLeveledUp`) except the two instants, which apply immediately.
   */
  private _applyPowerupEffect(effect: PowerUpEffect, time: number, x: number, y: number): void {
    const def = POWERUP_DEFS.find((d) => d.effect === effect);
    if (!def) return;
    spawnFloatingText(this, x, y - 30, `${def.name}!`, COLOUR_HEX.sunnyGold);
    SFX.playPowerup();
    this.cameras.main.shake(200, 0.007);

    switch (effect) {
      case 'soaker':
        this._soakerEndAt = time + def.duration * 1000;
        return;
      case 'turbo':
        this._waterTank = this._gun.tank;
        this._isPumping = false;
        this._refillPrompt.setVisible(false);
        return;
      case 'spinlock':
        this._spinlockEndAt = time + def.duration * 1000;
        for (const spinner of this._spinners) spinner.locked = true;
        return;
      case 'goldenSplash':
        this._goldenSplashPending = true;
        return;
      case 'doubleStars':
        this._doubleStarsEndAt = time + def.duration * 1000;
        return;
    }
  }

  /** Ticks the live Golden Spinner (claim-on-FULL or lifetime expiry), or checks whether it's time to spawn one. */
  private _updateGolden(time: number, delta: number): void {
    const golden = this._goldenSpinner;
    if (!golden) {
      if (time >= this._goldenSpawnAt) this._spawnGolden();
      return;
    }

    const result = golden.update(time, delta);
    if (result?.leveledUp && result.state === SpinnerState.FULL) {
      this._score += golden.def.stars;
      spawnFloatingText(
        this,
        golden.x,
        golden.y - golden.def.r - 12,
        `GOLDEN! +${golden.def.stars} ★`,
        COLOUR_HEX.sunnyGold,
      );
      SFX.playUpgrade(STATE_ORDINAL[SpinnerState.FULL]);
      this._despawnGolden(false);
      return;
    }
    this._goldenLifetimeMs -= delta;
    if (this._goldenLifetimeMs <= 0) this._despawnGolden(true);
  }

  /** Spawns a bonus Golden Spinner at a random point clear of the grid (CLAUDE.md §1). */
  private _spawnGolden(): void {
    const def = SPINNER_DEFS.find((d) => d.type === 'golden');
    if (!def) return;

    let x = WALL_AREA.x;
    let y = WALL_AREA.y;
    for (let tries = 0; tries < 20; tries++) {
      x = WALL_AREA.x + Math.random() * WALL_AREA.width;
      y = WALL_AREA.y + Math.random() * WALL_AREA.height;
      if (this._spinners.every((s) => distance(x, y, s.x, s.y) > 65)) break;
    }

    this._goldenSpinner = new Spinner(this, x, y, def);
    this._goldenLifetimeMs = GOLDEN_LIFETIME_MS;
    showToast(this, x, y - def.r - 20, 'Golden Spinner appeared!');
    SFX.playGoldenAppear();
  }

  /** Removes the live Golden Spinner with a shrink-and-fade, then schedules the next one. */
  private _despawnGolden(playExpireSfx: boolean): void {
    const golden = this._goldenSpinner;
    if (!golden) return;
    this._goldenSpinner = null;

    this.tweens.add({
      targets: golden,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: DURATION.celebration,
      ease: EASE.standardIn,
      onComplete: () => golden.destroy(),
    });
    if (playExpireSfx) SFX.playGoldenExpire();
    this._scheduleNextGolden();
  }

  /** Golden Spinner respawn window — shorter (more frequent) in Disco (CLAUDE.md §1's `goldenFrequent`). */
  private _scheduleNextGolden(): void {
    const range = this._world.goldenFrequent
      ? GOLDEN_SPAWN_DELAY_MS.frequent
      : GOLDEN_SPAWN_DELAY_MS.normal;
    this._goldenSpawnAt = this.time.now + range.min + Math.random() * (range.max - range.min);
  }

  private _onFrenzyStart(): void {
    this._frenzyActive = true;
    this._frenzyEndAt = this.time.now + FRENZY_DURATION_MS;
    this._score += FRENZY_BONUS_STARS;
    for (const spinner of this._spinners) {
      spinner.maxOut();
      spinner.locked = true;
    }
    this._frenzyBanner = playFrenzyCelebration(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'SPLASH FRENZY!',
    );
    SFX.playFrenzy();
  }

  private _updateFrenzyWindow(time: number): void {
    if (!this._frenzyActive || time < this._frenzyEndAt) return;
    this._frenzyActive = false;
    for (const spinner of this._spinners) spinner.locked = false;
    if (this._frenzyBanner) {
      hideBanner(this, this._frenzyBanner);
      this._frenzyBanner = null;
    }
  }

  private _onFirstInput(): void {
    if (this._started) return;
    this._started = true;
    // AudioContext creation/resume must happen on a real user gesture
    // (browser autoplay policy) — first-input is that gesture. Also
    // guarantees the gain is back at full even if a previous round was
    // quit mid-pause-fade without ever resuming.
    audioBus.init();
    audioBus.resume();
    audioBus.fadeIn(0);
    poki.gameplayStart();
  }

  /**
   * ESC → real Phaser scene pause (not a manual flag): `this.scene.pause()`
   * stops `update()` from running at all, so GameScene needs no internal
   * paused-state branching anywhere else. PauseScene (story 6.6) owns
   * resuming — its Resume button calls `this.scene.resume('GameScene')`.
   */
  private _pauseGame(): void {
    if (!this._started || this._roundOver || this.scene.isPaused()) return;
    poki.gameplayStop();
    audioBus.fadeOut(100);
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  private _endRound(): void {
    this._roundOver = true;
    poki.gameplayStop();
    adManager.recordRunCompleted();

    this._unlocks.addStars(this._score);
    const save = saveManager.load();
    if (this._score > save.highScore) {
      saveManager.save({ ...save, highScore: this._score });
    }

    this.scene.stop('HUDScene');
    const gameOverData: GameOverData = { score: this._score };
    this.scene.start('GameOverScene', gameOverData);
  }

  private _refreshHud(): void {
    const data: HudRefreshData = {
      secondsRemaining: this._timeRemainingMs / 1000,
      waterPct: (this._waterTank / this._gun.tank) * 100,
      isPumping: this._isPumping,
      spinners: this._spinners.map((s) => ({
        x: s.x,
        y: s.y,
        r: s.def.r,
        currentSpeed: s.currentSpeed,
        currentState: s.currentState,
      })),
    };
    this._hud.refresh(data);
  }
}
