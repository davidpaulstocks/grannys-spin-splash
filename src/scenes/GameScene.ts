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
  FRENZY_BONUS_STARS,
  FRENZY_DURATION_MS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRANNY_X_MARGIN,
  GRANNY_Y_FROM_BOTTOM,
  PUMP_REFILL_MS,
  WALL_AREA,
  WATER_BAR_Y,
  WATER_PARTICLE_MAX_POOL,
} from '../config';
import { GUN_DEFS, DEFAULT_GUN_ID } from '../entities/gun/gun.data';
import { SPINNER_DEFS } from '../entities/spinner/spinner.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { Granny } from '../entities/granny/Granny';
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
import type { GunDef } from '../entities/gun/gun.types';
import type { HudRefreshData } from '../types/hud';
import type { GameOverData, GameSceneData } from '../types/sceneData';
import { SpinnerState } from '../entities/spinner/spinner.types';
import { hideBanner, playFrenzyCelebration } from '../ui/Banner';
import { createRefillPrompt } from '../ui/RefillPrompt';
import { COLOUR } from '../utils/colour';
import { computeGridPositions } from '../utils/grid';
import { resolveAim } from '../utils/math';
import type { HUDScene } from './HUDScene';

export class GameScene extends Phaser.Scene {
  private _spinners: Spinner[] = [];
  private _granny!: Granny;
  private _input!: InputManager;
  private _waterPool!: Phaser.GameObjects.Group;
  private _frenzyMeter = new FrenzyMeter();
  private _combo = new ComboTracker();
  private _unlocks = new UnlockManager(saveManager);
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

  constructor() {
    super('GameScene');
  }

  create(data: Partial<GameSceneData>): void {
    const world = WORLD_DEFS[0];
    const gunId = data.gunId ?? DEFAULT_GUN_ID;
    this._gun = GUN_DEFS.find((g) => g.id === gunId) ?? GUN_DEFS[0];
    this._waterTank = this._gun.tank;
    this._timeRemainingMs = world.time * 1000;
    this._resetRoundState(); // in case this is a "Play Again" restart of the same scene instance chain

    drawWorldBackground(this, world.id);
    this._buildWall(world.grid.cols, world.grid.rows, world.types);
    this._granny = new Granny(this, GAME_WIDTH / 2, GAME_HEIGHT - GRANNY_Y_FROM_BOTTOM);
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

    poki.gameLoadingFinished();
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
      if (result?.leveledUp) this._onSpinnerLeveledUp(spinner, result.state);
    }
    // Read spinner states into the Frenzy meter right after they're fresh —
    // NOT from inside the HUD refresh. See FrenzyMeter.ts's header comment:
    // that used to race with the window-release below.
    this._frenzyMeter.update(this._spinners.map((s) => ({ state: s.currentState })));

    const aim = this._updateAim();
    this._updateFiring(time, aim);
    this._updatePump(time);
    this._updateWaterCollisions();
    this._combo.update(delta);
    this._updateFrenzyWindow(time);

    if (this._started) {
      this._timeRemainingMs = Math.max(0, this._timeRemainingMs - delta);
      if (this._timeRemainingMs <= 0) {
        this._endRound();
        return;
      }
    }

    this._refreshHud();
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
  }

  /** Resets every field a fresh round needs — covers first boot and a GameOverScene "Play Again" restart alike. */
  private _resetRoundState(): void {
    this._spinners = [];
    this._score = 0;
    this._started = false;
    this._roundOver = false;
    this._frenzyActive = false;
    this._frenzyBanner = null;
    this._frenzyMeter.reset();
    this._combo.reset();
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

  /** Resolves the crosshair position against the spinner wall and updates its visual snap feedback. */
  private _updateAim(): ReturnType<typeof resolveAim> {
    const pointer = this._input.getPointer();
    const targets = this._spinners.map((s) => ({ id: s.id, x: s.x, y: s.y }));
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

    const origin = this._granny.getGunOrigin();
    const target = aim.target
      ? (this._spinners.find((s) => s.id === aim.target?.id) ?? null)
      : null;

    // Multi-stream guns (Splash Jr, Soaker 3000) fire several particles per
    // cycle, all at the same aim point — each particle's own randomised
    // wobble (WaterParticle.fire) is what gives them a visible spread.
    for (let i = 0; i < this._gun.streams; i++) {
      const particle = this._waterPool.get() as WaterParticle | null;
      if (!particle) break;
      particle.fire(origin.x, origin.y, aim.x, aim.y, target);
    }
    this._waterTank = Math.max(0, this._waterTank - this._gun.drain);
    this._nextFireAt = time + this._gun.interval;
  }

  /** Starts a pump-refill once the tank hits empty, and completes it once its timer elapses. */
  private _updatePump(time: number): void {
    if (this._waterTank <= 0 && !this._isPumping) {
      this._isPumping = true;
      this._pumpEndAt = time + PUMP_REFILL_MS;
      this._refillPrompt.setVisible(true);
    } else if (this._isPumping && time >= this._pumpEndAt) {
      this._isPumping = false;
      this._waterTank = this._gun.tank;
      this._refillPrompt.setVisible(false);
    }
  }

  /** CLAUDE.md story 6.3: player-initiated only, shown solely while pumping — watching completes the refill instantly. */
  private async _onWatchAdForRefill(): Promise<void> {
    if (!this._isPumping) return;
    const watched = await adManager.playRewarded('small');
    if (!watched || !this._isPumping) return;

    this._isPumping = false;
    this._waterTank = this._gun.tank;
    this._refillPrompt.setVisible(false);
  }

  /** Tests every pooled particle against its candidate spinner(s); applies hits and combo/score on a landing. */
  private _updateWaterCollisions(): void {
    const particles = this._waterPool.getChildren() as WaterParticle[];
    for (const particle of particles) {
      const hitX = particle.x;
      const hitY = particle.y;
      const hitSpinner = particle.checkCollision(particle.getCandidates(this._spinners));
      if (!hitSpinner) continue;
      const landed = hitSpinner.hit(this._gun.power);
      if (landed) this._combo.registerHit(hitSpinner.id);
      spawnSplash(this, hitX, hitY);
    }
  }

  /** Stars are awarded only on an upward state transition (CLAUDE.md §2) — never per-hit, never on decay. */
  private _onSpinnerLeveledUp(spinner: Spinner, newState: SpinnerState): void {
    const levelBonus = Math.max(0, STATE_ORDINAL[newState] - 1);
    this._score += (spinner.def.stars + levelBonus) * this._combo.multiplier;
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
