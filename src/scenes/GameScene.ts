/**
 * Core gameplay loop — orchestrates spinners, Granny, water, the reward
 * loop, and Frenzy for a single gig (CLAUDE.md §7.2, story 1.5). HUDScene
 * runs alongside it as a parallel overlay (CLAUDE.md §7.2) — GameScene
 * feeds it fresh state once per frame; ResultsScene takes over once the
 * round ends.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH, GRANNY_Y_FROM_BOTTOM, WATER_PARTICLE_MAX_POOL } from '../config';
import { GUN_DEFS, DEFAULT_GUN_ID } from '../entities/gun/gun.data';
import { gunAtLevel, gunLevelIn } from '../entities/gun/gunLevels';
import { PowerUpSpawner } from '../entities/powerup/PowerUpSpawner';
import { MAX_SPINNER_SPEED } from '../entities/spinner/spinner.data';
import { DEFAULT_WORLD_ID, WORLD_DEFS } from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import { gigFor, type GigDef } from '../entities/world/gigs.data';
import { buildWall, wallAreaFor } from '../entities/world/wallBuilder';
import { currentGig } from '../systems/Progress';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { DEFAULT_GRANNY_ID } from '../entities/granny/granny.data';
import { Granny } from '../entities/granny/Granny';
import type { GrannyTalents } from '../entities/granny/granny.types';
import { playRoundIntro, type RoundIntro } from '../entities/granny/roundIntro';
import { NO_TALENTS, talentsFor } from '../entities/granny/talents';
import { Gun } from '../entities/gun/Gun';
import { Spinner } from '../entities/spinner/Spinner';
import { GoldenSpinnerSpawner, type GoldenClaim } from '../entities/spinner/GoldenSpinnerSpawner';
import { WaterParticle } from '../entities/waterParticle/WaterParticle';
import { WaterCannon } from '../entities/waterParticle/WaterCannon';
import * as poki from '../poki';
import { FrenzyMeter } from '../systems/FrenzyMeter';
import { InputManager } from '../systems/InputManager';
import { saveManager } from '../systems/SaveManager';
import { adManager } from '../systems/AdManager';
import { audioOrchestra } from '../audio/AudioOrchestra';
import { audioBus } from '../audio/AudioBus';
import { resolveScore } from '../audio/scores';
import { waterSound } from '../audio/WaterSound';
import { WaterJet } from '../entities/waterParticle/WaterJet';
import type { GunDef } from '../entities/gun/gun.types';
import type { GameSceneData } from '../types/sceneData';
import { SpinnerState } from '../entities/spinner/spinner.types';
import { spawnFloatingText } from '../ui/FloatingText';
import { createPauseButton } from '../ui/PauseButton';
import { COLOUR_HEX } from '../utils/colour';
import { bankGig } from './game/bankGig';
import { buildHudData } from './game/hudSnapshot';
import { BigFinish } from './game/BigFinish';
import { stageFor } from './game/BigMessageStage';
import { CountIn } from './game/CountIn';
import { CountdownUrgency } from './game/CountdownUrgency';
import { bindPauseHandlers } from './game/pauseHandlers';
import { FireControl } from './game/FireControl';
import { FirstRunGuide } from './game/FirstRunGuide';
import { FrenzyController } from './game/FrenzyController';
import { LevelUpFlair } from './game/LevelUpFlair';
import { LEVEL_UP_ACCENT } from './game/levelUpAccent';
import { GoalCard } from './game/GoalCard';
import { MusicReactions } from './game/MusicReactions';
import { PowerUpEffects } from './game/PowerUpEffects';
import { RewardLoop } from './game/RewardLoop';
import { VisitorDirector } from './game/VisitorDirector';
import { WaterCollisions } from './game/WaterCollisions';
import type { HUDScene } from './HUDScene';

export class GameScene extends Phaser.Scene {
  private _spinners: Spinner[] = [];
  private _granny!: Granny;
  private _gunSprite!: Gun;
  private _input!: InputManager;
  private _waterPool!: Phaser.GameObjects.Group;
  private _frenzyMeter = new FrenzyMeter();
  private _world!: WorldDef;
  private _grannyId!: string;
  /** What the chosen granny's talent changes (see entities/granny/talents.ts). */
  private _talents: GrannyTalents = NO_TALENTS;
  private _gun!: GunDef;
  private _hud!: HUDScene;

  private _cannon!: WaterCannon;
  /** The round-opening turn (see roundIntro.ts) — null once it has finished or been skipped. */
  private _intro: RoundIntro | null = null;
  private _timeRemainingMs = 0;
  private _gig!: GigDef;
  private _jet!: WaterJet;
  private _started = false;
  /** Whether a real click led here (see GameSceneData.playerClicked). */
  private _playerClicked = false;
  private _roundOver = false;
  private readonly _urgency = new CountdownUrgency(this);
  // Frenzy's start/window/flourish (see game/FrenzyController.ts); starting it is the jackpot.
  private readonly _frenzy = new FrenzyController(
    this,
    () => this._spinners,
    () => this._reward.jackpotStarted(),
    () => this._talents,
  );
  // Built per round in create(), once the world, gig and wall exist.
  /** Coins, stars, the groove and the coin fountain (see game/RewardLoop.ts); src/dev/botSim.ts reads it by name. */
  private _reward!: RewardLoop;
  private _music!: MusicReactions;
  private _goalCard!: GoalCard;
  private _guide!: FirstRunGuide;
  private _flair!: LevelUpFlair;
  private _collisions!: WaterCollisions;
  private _fire!: FireControl;
  /** How the gig opens: the band's count-in, or TAP TO START first (see game/CountIn.ts). */
  private _countIn!: CountIn;
  private _visitors!: VisitorDirector;

  // Bonus Golden Spinner — spawns outside the fixed grid, own lifetime, not part of `_spinners`/FrenzyMeter.
  private _golden!: GoldenSpinnerSpawner;

  // Power-ups (CLAUDE.md §1) — see PowerUpSpawner.ts for spawn/lifetime/collision and
  // game/PowerUpEffects.ts for the active-effect windows GameScene has to consult.
  private _powerupSpawner!: PowerUpSpawner;
  private _powerups!: PowerUpEffects;
  /** Peak simultaneous FULL spinners this round — the end screen's "how close were you". */
  private _peakFullSpinners = 0;

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
    this._playerClicked = data.playerClicked === true;
    const worldId = data.worldId ?? DEFAULT_WORLD_ID;
    this._world = WORLD_DEFS.find((w) => w.id === worldId) ?? WORLD_DEFS[0];
    this._grannyId = data.grannyId ?? DEFAULT_GRANNY_ID;
    this._talents = talentsFor(this._grannyId);
    const gunId = data.gunId ?? DEFAULT_GUN_ID;
    const level = data.gunLevel ?? gunLevelIn(saveManager.load().gunLevels, gunId);
    this._gun = gunAtLevel(GUN_DEFS.find((g) => g.id === gunId) ?? GUN_DEFS[0], level);
    this._gig = gigFor(this._world, data.gig ?? currentGig(saveManager.load(), this._world.id));
  }

  create(): void {
    this._timeRemainingMs = this._gig.seconds * 1000;
    this._resetRoundState(); // in case this is a "Play Again" restart of the same scene instance chain

    drawWorldBackground(this, this._world.id);
    this._spinners = buildWall(this, this._world, this._gig, this._talents);
    this._golden = new GoldenSpinnerSpawner(
      this,
      this._world.goldenFrequent === true,
      wallAreaFor(this._world),
      this._spinners,
    );
    this._powerupSpawner = new PowerUpSpawner(this);
    this._powerups = new PowerUpEffects(this, this._world, this._powerupSpawner, () =>
      this._cannon.refillInstantly(),
    );
    this._granny = new Granny(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT - GRANNY_Y_FROM_BOTTOM,
      this._grannyId,
    );
    this._gunSprite = new Gun(this, this._gun.id, this._gun.handScale);
    this._input = new InputManager(this);
    this._waterPool = this.add.group({
      classType: WaterParticle,
      maxSize: WATER_PARTICLE_MAX_POOL,
      runChildUpdate: true,
    });
    this._cannon = new WaterCannon(this, this._gun, this._waterPool, this._talents);
    this._jet = new WaterJet(this, this._waterPool);
    this._jet.drawBehind(this._granny);
    this._music = new MusicReactions(this, this._world, this._gig);
    this._guide = new FirstRunGuide(this, this._world);
    this._flair = new LevelUpFlair(this, this._world);
    this._reward = new RewardLoop({
      scene: this,
      gun: this._gun,
      gig: this._gig,
      spinners: () => this._spinners,
      frenzyActive: () => this._frenzy.active,
      doubleStarsActive: (time) => this._powerups.doubleStarsActive(time),
    });

    this._visitors = new VisitorDirector({
      scene: this,
      world: this._world,
      gig: this._gig,
      gun: this._gun,
      spinners: () => this._spinners,
      reward: this._reward,
      frenzyActive: () => this._frenzy.active,
      talents: this._talents,
    });
    this._collisions = new WaterCollisions({
      scene: this,
      pool: this._waterPool,
      visitors: this._visitors,
      spinners: this._spinners,
      activeSpinners: () => this._activeSpinners(),
      gun: this._gun,
      frenzy: this._frenzy,
      powerups: this._powerups,
    });

    this._createOverlays();

    this.scene.launch('HUDScene');
    this._hud = this.scene.get('HUDScene') as HUDScene;

    this._input.on('first-input', () => this._countIn.tap());
    this._input.on('pause', () => this._pauseGame());
    this._frenzyMeter.on('full', () => this._frenzy.start());
    // At 80% of the band at full the orchestra leans in toward the Frenzy drop.
    this._frenzyMeter.on('miniHigh', () => audioOrchestra.onFrenzyNear());

    // A brief turn-to-face-the-wall before play, skipped at GO. The round
    // clock doesn't start until GO, so this costs the player no time.
    this._intro = playRoundIntro(this, this._granny, this._gunSprite, () => {
      this._intro = null;
    });

    this._music.showGigIntro(this._spinners);
    this._goalCard = new GoalCard(this);
    this._goalCard.show();
    this._countIn = new CountIn({
      scene: this,
      worldId: this._world.id,
      bpm: resolveScore(this._world.id).bpm,
      pans: this._spinners.map((s) => (s.x / GAME_WIDTH) * 2 - 1),
      spinners: () => this._spinners,
      playerClicked: this._playerClicked,
      onBegin: () => {
        this._guide.maybeShowGhostFinger(this._spinners);
        this._guide.maybeStartTutorial();
      },
      onGo: () => this._beginGig(),
    });
    this._countIn.open();

    // A paused scene never sees fingers lift, so held pointer state is dropped both ways
    // (see InputManager.resetPointerState).
    bindPauseHandlers(
      this,
      () => {
        this._input.resetPointerState();
        this._fire.showCursor();
      },
      () => this._input.resetPointerState(),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._input.destroy();
      this._fire.showCursor();
      this._golden.destroy();
      // Covers every way this scene can end — round over, quit from pause,
      // or a direct scene.stop() — so the music can never outlive the run.
      audioOrchestra.stop();
      waterSound.setFiring(false);
    });
  }

  override update(time: number, delta: number): void {
    // No manual pause guard needed here — Phaser skips update() entirely
    // for a paused scene (this.scene.pause(), called from _pauseGame()).
    if (this._roundOver) return;

    // Frozen mid-turn: she must not fire while still facing the camera.
    const introPlaying = this._intro?.isPlaying() === true;

    for (const spinner of this._spinners) {
      const result = spinner.update(time, delta);
      if (!result) continue;
      this._reward.onSpinnerStateChange(spinner, result.previous, result.state, time);
      if (result.leveledUp) this._onSpinnerLeveledUp(spinner, result.state);
    }
    // Read spinner states into the Frenzy meter right after they're fresh —
    // NOT from inside the HUD refresh. See FrenzyMeter.ts's header comment:
    // that used to race with the window-release below. Golden Spinner is
    // deliberately excluded (own array, see class field comment) — a
    // temporary bonus spawn shouldn't distort Frenzy's "% of wall at FULL".
    this._frenzyMeter.update(this._spinners.map((s) => ({ state: s.playingState })));
    this._peakFullSpinners = Math.max(
      this._peakFullSpinners,
      this._spinners.filter((s) => s.playingState === SpinnerState.FULL).length,
    );
    // Each spinner's own charge drives its assigned instrument, continuously
    // (CLAUDE.md §9.1.1) — same list, same frame, same exclusion of the
    // Golden Spinner as the Frenzy meter above.
    audioOrchestra.updateMix(
      this._spinners.map((s) => ({ charge: s.playingSpeed / MAX_SPINNER_SPEED })),
    );
    // Second, independent audio axis: how far through the round we are, which
    // drives the crescendo (AudioOrchestra.setRoundProgress). Charge decides
    // which instruments play; this decides how big the room sounds.
    const roundMs = this._gig.seconds * 1000;
    audioOrchestra.setRoundProgress(roundMs > 0 ? 1 - this._timeRemainingMs / roundMs : 0);
    const claim = this._golden.update(time, delta);
    if (claim) this._onGoldenClaimed(claim);

    this._visitors.update(time, delta, this._started, this._timeRemainingMs);
    this._powerups.update(
      time,
      delta,
      this._spinners,
      this._waterPool.getChildren() as WaterParticle[],
      this._frenzy.active,
    );

    this._fire.update(time, this._started, introPlaying);
    this._music.react(time, this._spinners, this._frenzy.active);
    this._collisions.update();
    this._frenzy.updateWindow(time);

    if (this._started) {
      this._reward.update(time, delta);
      this._timeRemainingMs = Math.max(0, this._timeRemainingMs - delta);
      this._urgency.update(this._timeRemainingMs);
      if (this._timeRemainingMs <= 0) {
        this._endRound();
        return;
      }
    }

    this._refreshHud();
  }

  /** Creates the GameScene-owned visual overlays that aren't part of HUDScene: the aim crosshair and the pause button. */
  private _createOverlays(): void {
    this._fire = new FireControl({
      scene: this,
      input: this._input,
      granny: this._granny,
      gunSprite: this._gunSprite,
      cannon: this._cannon,
      jet: this._jet,
      gun: this._gun,
      powerups: this._powerups,
      activeSpinners: () => this._activeSpinners(),
      pickupPoints: () => this._powerupSpawner.points,
      visitorPoints: () => this._visitors.aimPoints,
    });
    // Touch has no ESC key; the two-finger gesture stays, this makes it discoverable.
    createPauseButton(this, this._input, () => this._pauseGame());
  }

  /** Resets every field a fresh round needs — covers first boot and a ResultsScene "Play Again" restart alike. */
  private _resetRoundState(): void {
    this._spinners = [];

    this._started = false;
    this._roundOver = false;
    this._frenzy.reset();
    this._frenzyMeter.reset();
    this._urgency.reset();
    this._peakFullSpinners = 0;
  }

  /** The fixed grid roster plus a live Golden Spinner, if one is currently spawned — for aim/fire/collision only. */
  private _activeSpinners(): readonly Spinner[] {
    const golden = this._golden.live;
    return golden ? [...this._spinners, golden] : this._spinners;
  }

  /** A spinner climbed a tier: the orchestra answers, with sparks. Coins come from the pay clock, not from this. */
  private _onSpinnerLeveledUp(spinner: Spinner, newState: SpinnerState): void {
    audioOrchestra.accent(LEVEL_UP_ACCENT[newState]);
    this._flair.sparkBurst(spinner, newState);
    this._flair.maybeEasterEgg(spinner);
    if (newState === SpinnerState.FULL) {
      this._flair.maybeEncourage();
      this._guide.onSpinnerFull();
    }
  }

  /** Pays out a Golden Spinner the player just took to FULL (CLAUDE.md §1's timed bonus spawn). */
  private _onGoldenClaimed(claim: GoldenClaim): void {
    this._reward.addCoins(claim.stars);
    spawnFloatingText(
      this,
      claim.x,
      claim.y - claim.radius - 12,
      `GOLDEN! +${claim.stars}`,
      COLOUR_HEX.sunnyGold,
    );
    audioOrchestra.accent('golden');
  }

  /** GO: the clock, pay tick, visitors and groove start, and Poki is told gameplay has begun (after a real click). */
  private _beginGig(): void {
    if (this._started) return;
    this._started = true;
    this._intro?.skip();
    this._intro = null;
    this._guide.onGo();
    this._goalCard.dismiss();
    this._reward.start(this.time.now);
    const save = saveManager.load();
    if (!save.hasPlayed) saveManager.save({ ...save, hasPlayed: true });
    poki.gameplayStart();
  }

  /** Starts the gig at once with no count-in. Used by the dev balance bot (src/dev/botSim.ts); play goes through CountIn. */
  _onFirstInput(): void {
    this._countIn.skipToGo();
  }

  /**
   * ESC → real Phaser scene pause (not a manual flag): `this.scene.pause()`
   * stops `update()` from running at all, so GameScene needs no internal
   * paused-state branching anywhere else. PauseScene (story 6.6) owns
   * resuming — its Resume button calls `this.scene.resume('GameScene')`.
   */
  private _pauseGame(): void {
    if ((!this._started && !this._countIn.counting) || this._roundOver || this.scene.isPaused()) {
      return;
    }
    if (this._started) poki.gameplayStop();
    audioBus.fadeOut(100);
    audioOrchestra.stop();
    waterSound.setFiring(false);
    this.scene.pause();
    this.scene.launch('PauseScene', { gameplayLive: this._started });
  }

  /**
   * Time is up: input and water stop and the Big Finish plays on the wall
   * (game/BigFinish.ts). It closes the music with the chord, banks the gig
   * with the bow coins in it and starts the results screen.
   */
  private _endRound(): void {
    this._roundOver = true;
    // Everything from the gig leaves the stage at once; only the finish and its verdict may speak.
    stageFor(this).closeForFinish();
    this._frenzy.cutShort();
    this._quietWater();
    poki.gameplayStop();
    adManager.recordRunCompleted();
    new BigFinish({
      scene: this,
      spinners: () => this._spinners,
      reward: this._reward,
      coinBoost: this._gun.coinBoost,
      bonusScale: this._talents.bigFinish,
      refreshHud: () => this._refreshHud(),
      quietWater: () => this._quietWater(),
      bank: () => this._bankAndLeave(),
    }).run();
  }

  /** Nothing fires and no water keeps flying once the whistle has gone. */
  private _quietWater(): void {
    waterSound.setFiring(false);
    this._granny.setFiring(false);
    this._fire.showCursor();
    for (const drop of this._waterPool.getChildren()) this._waterPool.killAndHide(drop);
    this._jet.update(this.time.now, this._gunSprite.getNozzleWorldPosition(), false, this._gun);
  }

  /** Banks the finished gig, bow coins included, and hands over to the results screen. */
  private _bankAndLeave(): void {
    const resultData = bankGig({
      world: this._world,
      gig: this._gig,
      score: this._reward.coins,
      stars: this._reward.stars,
      peakFullSpinners: this._peakFullSpinners,
      totalSpinners: this._spinners.length,
      reachedFrenzy: this._frenzy.reached,
    });
    this.scene.stop('HUDScene');
    this.scene.start('ResultsScene', resultData);
  }

  private _refreshHud(): void {
    this._hud.refresh(
      buildHudData({
        timeRemainingMs: this._timeRemainingMs,
        now: this.time.now,
        cannon: this._cannon,
        gun: this._gun,
        spinners: this._spinners,
        reward: this._reward,
      }),
    );
  }
}
