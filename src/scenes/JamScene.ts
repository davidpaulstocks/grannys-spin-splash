/**
 * Jam — the toy with the pressure off. One venue's whole band on the wall,
 * exactly as its Grand Concert lays it out, with no clock, no score, no coins,
 * no stars, no visitors and no way to fail: squirt, and the band plays for as
 * long as you like. A venue's Jam is the reward for finishing it.
 *
 * It composes the same pieces GameScene does (wall, spinners, aim and fire,
 * the orchestra in its room, the note fountain, Splash Frenzy, the count-in,
 * pause) without the scoring ones, and wears the same Poki rules: gameplayStart
 * on GO, gameplayStop on leaving or pausing. Nothing here writes to the save.
 */

import Phaser from 'phaser';

import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GRANNY_Y_FROM_BOTTOM,
  WATER_BAR_HEIGHT,
  WATER_BAR_MARGIN_X,
  WATER_BAR_Y,
  WATER_PARTICLE_MAX_POOL,
} from '../config';
import { GUN_DEFS, DEFAULT_GUN_ID } from '../entities/gun/gun.data';
import { gunAtLevel, gunLevelIn } from '../entities/gun/gunLevels';
import type { GunDef } from '../entities/gun/gun.types';
import { DEFAULT_GRANNY_ID } from '../entities/granny/granny.data';
import { Granny } from '../entities/granny/Granny';
import { playRoundIntro, type RoundIntro } from '../entities/granny/roundIntro';
import { Gun } from '../entities/gun/Gun';
import { MAX_SPINNER_SPEED } from '../entities/spinner/spinner.data';
import type { Spinner } from '../entities/spinner/Spinner';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import type { GigDef } from '../entities/world/gigs.data';
import { buildWall } from '../entities/world/wallBuilder';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { WaterCannon } from '../entities/waterParticle/WaterCannon';
import { WaterJet } from '../entities/waterParticle/WaterJet';
import { WaterParticle } from '../entities/waterParticle/WaterParticle';
import { audioBus } from '../audio/AudioBus';
import { audioOrchestra } from '../audio/AudioOrchestra';
import { resolveScore } from '../audio/scores';
import { waterSound } from '../audio/WaterSound';
import * as poki from '../poki';
import { FrenzyMeter } from '../systems/FrenzyMeter';
import { InputManager } from '../systems/InputManager';
import { saveManager } from '../systems/SaveManager';
import type { JamSceneData } from '../types/sceneData';
import { WaterBar } from '../ui/WaterBar';
import { CountIn } from './game/CountIn';
import { FireControl } from './game/FireControl';
import { FrenzyController } from './game/FrenzyController';
import { LEVEL_UP_ACCENT } from './game/levelUpAccent';
import { LevelUpFlair } from './game/LevelUpFlair';
import { MusicReactions } from './game/MusicReactions';
import { bindPauseHandlers } from './game/pauseHandlers';
import { WaterCollisions } from './game/WaterCollisions';
import { JamControls } from './jam/JamControls';
import { JAM_ROUND_PROGRESS, jamGig, nextGun, ownedGunCycle } from './jam/jamRules';

const PERCENT = 100;
/** Nothing blocks the water in Jam: there are no visitors. */
const NO_BLOCKER = { tryBlock: (): boolean => false };

export class JamScene extends Phaser.Scene {
  private _spinners: Spinner[] = [];
  private _granny!: Granny;
  private _gunSprite!: Gun;
  private _input!: InputManager;
  private _waterPool!: Phaser.GameObjects.Group;
  private readonly _frenzyMeter = new FrenzyMeter();
  private _world!: WorldDef;
  private _grannyId = DEFAULT_GRANNY_ID;
  private _gun!: GunDef;
  private _gig!: GigDef;
  /** The guns she owns, in ladder order, for the gun button. */
  private _guns: readonly GunDef[] = [];
  private _cannon!: WaterCannon;
  private _jet!: WaterJet;
  private _waterBar!: WaterBar;
  private _intro: RoundIntro | null = null;
  private _started = false;
  private _leaving = false;
  private _playerClicked = false;
  private _countIn!: CountIn;
  private _music!: MusicReactions;
  private _flair!: LevelUpFlair;
  private _fire!: FireControl;
  private _collisions!: WaterCollisions;
  private _controls!: JamControls;
  private readonly _frenzy = new FrenzyController(
    this,
    () => this._spinners,
    () => undefined, // Frenzy is a celebration here: it pays nothing.
  );

  constructor() {
    super('JamScene');
  }

  /** Resolves the venue, Granny and the gun the save has selected (or the first one she owns). */
  init(data: Partial<JamSceneData>): void {
    this._playerClicked = data.playerClicked === true;
    this._world = WORLD_DEFS.find((w) => w.id === data.worldId) ?? WORLD_DEFS[0];
    this._grannyId = data.grannyId ?? DEFAULT_GRANNY_ID;
    this._gig = jamGig(this._world);
    const save = saveManager.load();
    this._guns = ownedGunCycle(save.unlockedGuns);
    const wanted = this._guns.find((g) => g.id === save.selectedGunId) ?? this._guns[0];
    const base = wanted ?? GUN_DEFS.find((g) => g.id === DEFAULT_GUN_ID) ?? GUN_DEFS[0];
    this._gun = gunAtLevel(base, gunLevelIn(save.gunLevels, base.id));
  }

  create(): void {
    this._started = false;
    this._leaving = false;
    this._frenzy.reset();
    this._frenzyMeter.reset();

    drawWorldBackground(this, this._world.id);
    this._spinners = buildWall(this, this._world, this._gig);
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
    this._cannon = new WaterCannon(this, this._gun, this._waterPool);
    this._jet = new WaterJet(this, this._waterPool);
    this._jet.drawBehind(this._gunSprite);
    this._music = new MusicReactions(this, this._world, this._gig);
    this._flair = new LevelUpFlair(this, this._world);
    this._collisions = new WaterCollisions({
      scene: this,
      pool: this._waterPool,
      visitors: NO_BLOCKER,
      spinners: this._spinners,
      activeSpinners: () => this._spinners,
      gun: this._gun,
      frenzy: this._frenzy,
    });
    this._fire = new FireControl({
      scene: this,
      input: this._input,
      granny: this._granny,
      gunSprite: this._gunSprite,
      cannon: this._cannon,
      jet: this._jet,
      gun: this._gun,
      activeSpinners: () => this._spinners,
    });
    this._waterBar = new WaterBar(
      this,
      WATER_BAR_MARGIN_X,
      WATER_BAR_Y,
      GAME_WIDTH - WATER_BAR_MARGIN_X * 2,
      WATER_BAR_HEIGHT,
    );
    this._controls = new JamControls({
      scene: this,
      venueName: this._world.name,
      gun: this._gun,
      onHome: () => this._goHome(),
      onGun: () => this._cycleGun(),
      pointerGuard: this._input,
    });

    this._input.on('first-input', () => this._countIn.tap());
    this._input.on('pause', () => this._pauseGame());
    this._frenzyMeter.on('full', () => this._frenzy.start());
    this._frenzyMeter.on('miniHigh', () => audioOrchestra.onFrenzyNear());
    this._intro = playRoundIntro(this, this._granny, this._gunSprite, () => {
      this._intro = null;
    });
    this._countIn = new CountIn({
      scene: this,
      worldId: this._world.id,
      bpm: resolveScore(this._world.id).bpm,
      pans: this._spinners.map((s) => (s.x / GAME_WIDTH) * 2 - 1),
      spinners: () => this._spinners,
      playerClicked: this._playerClicked,
      onBegin: () => undefined,
      onGo: () => this._begin(),
    });
    this._countIn.open();

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
      audioOrchestra.stop();
      waterSound.setFiring(false);
    });
  }

  override update(time: number, delta: number): void {
    if (this._leaving) return;
    for (const spinner of this._spinners) {
      const result = spinner.update(time, delta);
      if (result?.leveledUp) {
        audioOrchestra.accent(LEVEL_UP_ACCENT[result.state]);
        this._flair.sparkBurst(spinner, result.state);
      }
    }
    this._frenzyMeter.update(this._spinners.map((s) => ({ state: s.playingState })));
    audioOrchestra.updateMix(
      this._spinners.map((s) => ({ charge: s.playingSpeed / MAX_SPINNER_SPEED })),
    );
    audioOrchestra.setRoundProgress(JAM_ROUND_PROGRESS);
    this._fire.update(time, this._started, this._intro?.isPlaying() === true);
    this._music.react(time, this._spinners, this._frenzy.active);
    this._collisions.update();
    this._frenzy.updateWindow(time);
    this._waterBar.update((this._cannon.tank / this._gun.tank) * PERCENT, this._cannon.isPumping);
  }

  /** GO: the water is live and Poki is told gameplay has begun. */
  private _begin(): void {
    if (this._started) return;
    this._started = true;
    this._intro?.skip();
    this._intro = null;
    poki.gameplayStart();
  }

  /** Puts the next gun she owns in her hands, with its own projectile, and names it. */
  private _cycleGun(): void {
    if (this._leaving || this._intro?.isPlaying() === true) return;
    const next = nextGun(this._guns, this._gun.id);
    if (!next) return;
    const level = gunLevelIn(saveManager.load().gunLevels, next.id);
    this._gun = gunAtLevel(next, level);
    this._gunSprite.destroy();
    this._gunSprite = new Gun(this, this._gun.id, this._gun.handScale);
    this._cannon = new WaterCannon(this, this._gun, this._waterPool);
    this._fire.swapGun({ gunSprite: this._gunSprite, cannon: this._cannon, gun: this._gun });
    this._collisions.setGun(this._gun);
    this._controls.setGun(this._gun);
  }

  /** Leaves for Home: the water stops, Poki hears gameplay has stopped, the music ends with the scene. */
  private _goHome(): void {
    if (this._leaving) return;
    this._leaving = true;
    if (this._started) poki.gameplayStop();
    waterSound.setFiring(false);
    this.scene.start('HomeScene');
  }

  /** ESC or the pause button: a real scene pause, as in a gig. */
  private _pauseGame(): void {
    if ((!this._started && !this._countIn.counting) || this._leaving || this.scene.isPaused()) {
      return;
    }
    if (this._started) poki.gameplayStop();
    audioBus.fadeOut(100);
    audioOrchestra.stop();
    waterSound.setFiring(false);
    this.scene.pause();
    this.scene.launch('PauseScene', { gameplayLive: this._started, sceneKey: 'JamScene' });
  }

  /** Starts the jam at once with no count-in — for the dev tools, like GameScene's. */
  _onFirstInput(): void {
    this._countIn.skipToGo();
  }
}
