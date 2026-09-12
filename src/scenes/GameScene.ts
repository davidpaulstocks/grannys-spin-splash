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
  URGENT_COUNTDOWN_SECONDS,
  WATER_BAR_Y,
  WATER_PARTICLE_MAX_POOL,
} from '../config';
import { GUN_DEFS, DEFAULT_GUN_ID } from '../entities/gun/gun.data';
import { Obstacle } from '../entities/obstacle/Obstacle';
import { POWERUP_DEFS, type PowerUpEffect } from '../entities/powerup/powerup.data';
import { PowerUpSpawner } from '../entities/powerup/PowerUpSpawner';
import { MAX_SPINNER_SPEED } from '../entities/spinner/spinner.data';
import {
  DEFAULT_WORLD_ID,
  EASTER_EGG_CHANCE,
  WORLD_EASTER_EGG,
  WORLD_DEFS,
} from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import { buildObstacles, buildWall, wallAreaFor } from '../entities/world/wallBuilder';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { DEFAULT_GRANNY_ID } from '../entities/granny/granny.data';
import { Granny } from '../entities/granny/Granny';
import { Gun } from '../entities/gun/Gun';
import { Spinner, STATE_ORDINAL } from '../entities/spinner/Spinner';
import { GoldenSpinnerSpawner, type GoldenClaim } from '../entities/spinner/GoldenSpinnerSpawner';
import { WaterParticle } from '../entities/waterParticle/WaterParticle';
import {
  FIRE_DENSITY_SCALE,
  WaterCannon,
  type PumpEvent,
} from '../entities/waterParticle/WaterCannon';
import { spawnConfetti, spawnSparks, spawnSplash } from '../entities/waterParticle/splashVFX';
import * as poki from '../poki';
import { ComboTracker } from '../systems/ComboTracker';
import { FrenzyMeter } from '../systems/FrenzyMeter';
import { InputManager } from '../systems/InputManager';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { adManager } from '../systems/AdManager';
import { audioBus, AD_MUTE_HOOKS } from '../audio/AudioBus';
import { audioOrchestra } from '../audio/AudioOrchestra';
import * as SFX from '../audio/SFX';
import type { GunDef } from '../entities/gun/gun.types';
import type { HudRefreshData } from '../types/hud';
import type { GameOverData, GameSceneData } from '../types/sceneData';
import { SpinnerState } from '../entities/spinner/spinner.types';
import { hideBanner, playFrenzyCelebration } from '../ui/Banner';
import { spawnFloatingText } from '../ui/FloatingText';
import { createMobileMoveButtons } from '../ui/MobileMoveButtons';
import { createRefillPrompt } from '../ui/RefillPrompt';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { resolveAim } from '../utils/math';
import type { HUDScene } from './HUDScene';

/** How close to the canvas edges a Duck obstacle may wander before bouncing back (prototype: 60px). */
const DUCK_BOUNCE_MARGIN = 60;

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
  private _cannon!: WaterCannon;
  /** Rising-edge detector for the opening-shot blast surge — true only the instant firing starts, not while held. */
  private _timeRemainingMs = 0;
  private _started = false;
  private _roundOver = false;
  private _frenzyActive = false;
  private _frenzyEndAt = 0;
  /** Last whole second the final-countdown tick/shake fired for — guards against re-firing every frame within the same second. */
  private _lastUrgentSecond = -1;

  // Bonus Golden Spinner — spawns outside the fixed grid, own lifetime, not part of `_spinners`/FrenzyMeter.
  private _golden!: GoldenSpinnerSpawner;

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
    this._timeRemainingMs = this._world.time * 1000;
    this._resetRoundState(); // in case this is a "Play Again" restart of the same scene instance chain

    drawWorldBackground(this, this._world.id);
    this._spinners = buildWall(this, this._world);
    this._obstacles = buildObstacles(this, this._world, this._spinners);
    this._golden = new GoldenSpinnerSpawner(
      this,
      this._world.goldenFrequent === true,
      wallAreaFor(this._world),
      this._spinners,
    );
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
    this._cannon = new WaterCannon(this, this._gun, this._waterPool);

    this._createOverlays();

    this.scene.launch('HUDScene');
    this._hud = this.scene.get('HUDScene') as HUDScene;

    this._input.on('first-input', () => this._onFirstInput());
    this._input.on('pause', () => this._pauseGame());
    this._frenzyMeter.on('full', () => this._onFrenzyStart());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._input.destroy();
      this._golden.destroy();
      // Covers every way this scene can end — round over, quit from pause,
      // or a direct scene.stop() — so the music can never outlive the run.
      audioOrchestra.stop();
    });
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
    // Each spinner's own charge drives its assigned instrument, continuously
    // (CLAUDE.md §9.1.1) — same list, same frame, same exclusion of the
    // Golden Spinner as the Frenzy meter above.
    audioOrchestra.updateMix(
      this._spinners.map((s) => ({ charge: s.currentSpeed / MAX_SPINNER_SPEED })),
    );
    const claim = this._golden.update(time, delta);
    if (claim) this._onGoldenClaimed(claim);

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
    this._cannon.update(time, {
      firing: this._input.isFiring(),
      origin: this._gunSprite.getNozzleWorldPosition(),
      aimX: aim.x,
      aimY: aim.y,
      target: aim.target
        ? (this._activeSpinners().find((sp) => sp.id === aim.target?.id) ?? null)
        : null,
      soakerActive: time < this._soakerEndAt,
    });
    this._onPumpEvent(this._cannon.updatePump(time));
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

  /** The fixed grid roster plus a live Golden Spinner, if one is currently spawned — for aim/fire/collision only. */
  private _activeSpinners(): readonly Spinner[] {
    const golden = this._golden.live;
    return golden ? [...this._spinners, golden] : this._spinners;
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

  /** Drives the refill prompt + REFILLED! flourish off the cannon's own pump cycle. */
  private _onPumpEvent(event: PumpEvent): void {
    if (event === 'started') this._refillPrompt.setVisible(true);
    if (event === 'completed') {
      this._refillPrompt.setVisible(false);
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
    if (!this._cannon.isPumping) return;
    const watched = await adManager.playRewarded('small', AD_MUTE_HOOKS);
    if (!watched || !this._cannon.isPumping) return;

    this._cannon.refillInstantly();
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

    // Spark burst on the spinner itself — a state upgrade is the single
    // most rewarding moment in the loop and previously had no VFX beyond
    // the SFX + a flat glow-colour swap (2026-09-12, direct user feedback:
    // spinners needed more "juice, momentum, sparks"). FULL gets Sunny
    // Gold sparks (matches its glow); every earlier tier gets the
    // spinner's own base colour. No scale-punch tween here deliberately —
    // Spinner._updateWobble() already writes this.scale every frame past
    // WOBBLE_SPEED_THRESHOLD, which would fight a separate tween on the
    // same property and read as a flicker rather than a punch.
    const sparkColour =
      newState === SpinnerState.FULL
        ? COLOUR.sunnyGold
        : Phaser.Display.Color.HexStringToColor(spinner.def.colors[0]).color;
    spawnSparks(this, spinner.x, spinner.y, sparkColour);
    this._maybeEasterEgg(spinner);
  }

  /**
   * This world's rare surprise moment (CLAUDE.md §1's worlds as distinct
   * playgrounds) — a one-in-ten level-up fires the world's own shout and
   * confetti palette, so Kitchen's "SIZZLE!" is instantly recognisable as
   * Kitchen's. Rare by design: at every level-up it'd be wallpaper.
   */
  private _maybeEasterEgg(spinner: Spinner): void {
    if (Math.random() >= EASTER_EGG_CHANCE) return;
    const egg = WORLD_EASTER_EGG[this._world.id];
    if (!egg) return;
    spawnConfetti(this, spinner.x, spinner.y, egg.confetti);
    spawnFloatingText(this, spinner.x, spinner.y - spinner.def.r - 40, egg.text, egg.textColour);
  }

  /** Advances every live power-up pickup and applies the effect of any just collected (CLAUDE.md §1). */
  private _updatePowerups(time: number, delta: number): void {
    const area = wallAreaFor(this._world);
    const bounds = {
      x0: area.x,
      y0: area.y,
      x1: area.x + area.width,
      y1: area.y + area.height,
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
        this._cannon.refillInstantly();
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

  /** Pays out a Golden Spinner the player just took to FULL (CLAUDE.md §1's timed bonus spawn). */
  private _onGoldenClaimed(claim: GoldenClaim): void {
    this._score += claim.stars;
    spawnFloatingText(
      this,
      claim.x,
      claim.y - claim.radius - 12,
      `GOLDEN! +${claim.stars} ★`,
      COLOUR_HEX.sunnyGold,
    );
    SFX.playUpgrade(STATE_ORDINAL[SpinnerState.FULL]);
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
    audioOrchestra.onFrenzyStart();
  }

  private _updateFrenzyWindow(time: number): void {
    if (!this._frenzyActive || time < this._frenzyEndAt) return;
    this._frenzyActive = false;
    audioOrchestra.onFrenzyEnd();
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
    // The orchestra can only start once there's an AudioContext, which is
    // this gesture — so the run's music begins on the player's first shot
    // rather than on scene load (CLAUDE.md §9).
    audioOrchestra.start();
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
    audioOrchestra.stop();
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
      waterPct: (this._cannon.tank / this._gun.tank) * 100,
      isPumping: this._cannon.isPumping,
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
