/**
 * Core gameplay loop — orchestrates spinners, Granny, water, combo, and
 * Frenzy for a single 30-second run (CLAUDE.md §7.2, story 1.5). Sprint 1
 * scope: a fully playable walking skeleton with placeholder/procedural
 * visuals and a plain corner-text debug readout — HUDScene, WaterBar,
 * TimerDial, and FrenzyMeterUI (the real, minimal production HUD per
 * CLAUDE.md §5.8/§6.1) are Sprint 2 work, not duplicated here.
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
  WATER_PARTICLE_MAX_POOL,
} from '../config';
import { GUN_DEFS, DEFAULT_GUN_ID } from '../data/guns';
import { SPINNER_DEFS } from '../data/spinners';
import { WORLD_DEFS } from '../data/worlds';
import { Granny } from '../objects/Granny';
import { Spinner, STATE_ORDINAL } from '../objects/Spinner';
import { WaterParticle } from '../objects/WaterParticle';
import * as poki from '../poki';
import { ComboTracker } from '../systems/ComboTracker';
import { FrenzyMeter } from '../systems/FrenzyMeter';
import { InputManager } from '../systems/InputManager';
import { SaveManager } from '../systems/SaveManager';
import type { GunDef } from '../types/gun';
import { SpinnerState } from '../types/spinner';
import { COLOUR } from '../utils/colour';
import { computeGridPositions } from '../utils/grid';
import { resolveAim } from '../utils/math';

const DEBUG_TEXT_STYLE = {
  fontFamily: 'monospace',
  fontSize: '18px',
  color: '#1F2138',
  backgroundColor: '#F5F2E8',
  padding: { x: 8, y: 6 },
};

export class GameScene extends Phaser.Scene {
  private _spinners: Spinner[] = [];
  private _granny!: Granny;
  private _input!: InputManager;
  private _waterPool!: Phaser.GameObjects.Group;
  private _frenzyMeter = new FrenzyMeter();
  private _combo = new ComboTracker();
  private _save = new SaveManager();
  private _gun!: GunDef;
  private _crosshair!: Phaser.GameObjects.Arc;
  private _debugText!: Phaser.GameObjects.Text;
  private _frenzyBanner!: Phaser.GameObjects.Text;
  private _pausedText!: Phaser.GameObjects.Text;

  private _score = 0;
  private _waterTank = 0;
  private _isPumping = false;
  private _pumpEndAt = 0;
  private _nextFireAt = 0;
  private _timeRemainingMs = 0;
  private _started = false;
  private _paused = false;
  private _roundOver = false;
  private _frenzyActive = false;
  private _frenzyEndAt = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    const world = WORLD_DEFS[0];
    this._gun = GUN_DEFS.find((g) => g.id === DEFAULT_GUN_ID) ?? GUN_DEFS[0];
    this._waterTank = this._gun.tank;
    this._timeRemainingMs = world.time * 1000;

    this._buildWall(world.grid.cols, world.grid.rows, world.types);
    this._granny = new Granny(this, GAME_WIDTH / 2, GAME_HEIGHT - GRANNY_Y_FROM_BOTTOM);
    this._input = new InputManager(this);
    this._waterPool = this.add.group({
      classType: WaterParticle,
      maxSize: WATER_PARTICLE_MAX_POOL,
      runChildUpdate: true,
    });

    this._crosshair = this.add
      .circle(0, 0, 10, COLOUR.softSlate, 0)
      .setStrokeStyle(3, COLOUR.softSlate);
    this._debugText = this.add.text(16, 16, '', DEBUG_TEXT_STYLE).setDepth(100);
    this._frenzyBanner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'SPLASH FRENZY!', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#FFC93C',
        stroke: '#1F2138',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setVisible(false);
    this._pausedText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#1F2138',
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setVisible(false);

    this._input.on('first-input', () => this._onFirstInput());
    this._input.on('pause', () => this._togglePause());
    this._frenzyMeter.on('full', () => this._onFrenzyStart());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this._input.destroy());

    poki.gameLoadingFinished();
  }

  override update(time: number, delta: number): void {
    if (this._roundOver) return;

    if (this._paused) {
      this._refreshDebugText();
      return;
    }

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
    // NOT from inside the debug-text refresh. See FrenzyMeter.ts's header
    // comment: that used to race with the window-release below.
    this._frenzyMeter.update(this._spinners.map((s) => ({ state: s.currentState })));

    const aim = this._updateAim();
    this._updateFiring(time, aim);
    this._updateWaterCollisions();
    this._combo.update(delta);
    this._updateFrenzyWindow(time);

    if (this._started) {
      this._timeRemainingMs = Math.max(0, this._timeRemainingMs - delta);
      if (this._timeRemainingMs <= 0) this._endRound();
    }

    this._refreshDebugText();
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

  /** Fires a pooled water particle on cadence while the input is held and the tank isn't empty/pumping. */
  private _updateFiring(time: number, aim: ReturnType<typeof resolveAim>): void {
    if (
      this._input.isFiring() &&
      !this._isPumping &&
      this._waterTank > 0 &&
      time >= this._nextFireAt
    ) {
      const origin = this._granny.getGunOrigin();
      const target = aim.target
        ? (this._spinners.find((s) => s.id === aim.target?.id) ?? null)
        : null;
      const particle = this._waterPool.get() as WaterParticle | null;
      if (particle) {
        particle.fire(origin.x, origin.y, aim.x, aim.y, target);
        this._waterTank = Math.max(0, this._waterTank - this._gun.drain);
        this._nextFireAt = time + this._gun.interval;
      }
    }

    if (this._waterTank <= 0 && !this._isPumping) {
      this._isPumping = true;
      this._pumpEndAt = time + PUMP_REFILL_MS;
    }
    if (this._isPumping && time >= this._pumpEndAt) {
      this._isPumping = false;
      this._waterTank = this._gun.tank;
    }
  }

  /** Tests every pooled particle against its candidate spinner(s); applies hits and combo/score on a landing. */
  private _updateWaterCollisions(): void {
    const particles = this._waterPool.getChildren() as WaterParticle[];
    for (const particle of particles) {
      const hitSpinner = particle.checkCollision(particle.getCandidates(this._spinners));
      if (!hitSpinner) continue;
      const landed = hitSpinner.hit(this._gun.power);
      if (landed) this._combo.registerHit(hitSpinner.id);
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
    this._frenzyBanner.setVisible(true);
  }

  private _updateFrenzyWindow(time: number): void {
    if (!this._frenzyActive || time < this._frenzyEndAt) return;
    this._frenzyActive = false;
    for (const spinner of this._spinners) spinner.locked = false;
    this._frenzyBanner.setVisible(false);
  }

  private _onFirstInput(): void {
    if (this._started) return;
    this._started = true;
    poki.gameplayStart();
  }

  private _togglePause(): void {
    if (!this._started || this._roundOver) return;
    this._paused = !this._paused;
    this._pausedText.setVisible(this._paused);
    if (this._paused) poki.gameplayStop();
    else poki.gameplayStart();
  }

  private _endRound(): void {
    this._roundOver = true;
    poki.gameplayStop();

    const save = this._save.load();
    if (this._score > save.highScore) {
      this._save.save({ ...save, highScore: this._score });
    }
  }

  private _refreshDebugText(): void {
    const seconds = Math.ceil(this._timeRemainingMs / 1000);
    const waterPct = Math.round((this._waterTank / this._gun.tank) * 100);
    const status = this._roundOver ? 'TIME UP' : this._started ? 'RUNNING' : 'WAITING FOR INPUT';
    this._debugText.setText(
      [
        `[${status}]`,
        `Time: ${seconds}s`,
        `Score: ${this._score}`,
        `Water: ${waterPct}%${this._isPumping ? ' (pumping)' : ''}`,
        `Combo: x${this._combo.multiplier}`,
      ].join('  |  '),
    );
  }
}
