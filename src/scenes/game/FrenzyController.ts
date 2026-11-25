/**
 * SPLASH FRENZY from the scene's side: the moment it starts (banner, flash,
 * zoom, confetti, every spinner maxed and locked), the window that ends it,
 * and the per-hit flourish that keeps the climax loud. The meter that
 * *triggers* it lives in systems/FrenzyMeter.ts.
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import { FRENZY_DURATION_MS, GAME_HEIGHT, GAME_WIDTH, RENDER_SCALE } from '../../config';
import type { Spinner } from '../../entities/spinner/Spinner';
import { spawnConfetti, spawnSparks } from '../../entities/waterParticle/splashVFX';
import { hideBanner, playFrenzyCelebration } from '../../ui/Banner';
import { COLOUR } from '../../utils/colour';
import { MAX_STARS_PER_GIG } from '../../systems/Progress';

/**
 * How often landed hits during the SPLASH FRENZY window are celebrated with
 * their own sparks/chime (2026-09-13, direct user
 * feedback: "when you achieve splash frenzy the sounds of hitting the
 * spinners stops so it kinda feels like the excitement is over vs it being a
 * sustained high point").
 *
 * The cause was structural. Frenzy maxes AND locks every spinner, so no
 * spinner can change state for the whole window — and every reward in the
 * game hangs off `_onSpinnerLeveledUp`, which only fires on an upward
 * transition. So the climax paid no stars, spawned no floating "+N ★", threw
 * no sparks and played no upgrade sound: the game's single biggest moment was
 * its only scoring and feedback dead zone. CLAUDE.md §1 calls Frenzy "a
 * 5-second bonus burst worth bonus stars", which is exactly what it wasn't.
 *
 * Every hit now pays, multiplied by the live combo, so the window rewards
 * firing flat out. Only a fraction spawn their own text/sparks — at up to 60
 * hits a second the screen would otherwise be unreadable confetti.
 */
const FRENZY_HIT_FLOURISH_CHANCE = 0.14;

const FRENZY_FLASH_MS = 220;
const FRENZY_ZOOM = 1.045;
const FRENZY_ZOOM_IN_MS = 110;
const FRENZY_ZOOM_HOLD_MS = 90;
const FRENZY_ZOOM_OUT_MS = 380;
/** Camera effects only accept Phaser's named eases, not the tween module's custom curves. */
const CAMERA_EASE = 'Quad.easeOut';
const FRENZY_CONFETTI_EVERY = 2;
const FRENZY_CONFETTI_COLOURS = [
  COLOUR.grannyPink,
  COLOUR.sunnyGold,
  COLOUR.waterBlue,
  COLOUR.mintGreen,
] as const;

export class FrenzyController {
  private _active = false;
  private _endAt = 0;
  private _banner: Phaser.GameObjects.Text | null = null;
  private _reached = false;

  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _spinners: () => readonly Spinner[],
    /** Frenzy awards the full set of stars the moment it fires — GameScene binds this to its score. */
    private readonly _awardStars: (reached: number) => void,
  ) {}

  /** Whether the Frenzy window is open right now. */
  get active(): boolean {
    return this._active;
  }

  /** Whether Frenzy ever fired this round — the end screen's "how close were you". */
  get reached(): boolean {
    return this._reached;
  }

  /** Back to "never happened" — covers first boot and a "Play Again" restart alike. */
  reset(): void {
    this._active = false;
    this._banner = null;
    this._reached = false;
  }

  start(): void {
    const spinners = this._spinners();
    this._active = true;
    this._reached = true;
    this._endAt = this._scene.time.now + FRENZY_DURATION_MS;
    for (const spinner of spinners) {
      spinner.maxOut();
      spinner.locked = true;
    }
    this._banner = playFrenzyCelebration(
      this._scene,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'SPLASH FRENZY!',
    );
    this._awardStars(MAX_STARS_PER_GIG);
    audioOrchestra.onFrenzyStart();
    // The drop should hit the eyes as hard as the ears: a flash, a punch of
    // zoom, and confetti off the whole wall.
    const camera = this._scene.cameras.main;
    camera.flash(FRENZY_FLASH_MS, 255, 244, 200);
    // Zoom is relative to the render scale the camera already sits at.
    camera.zoomTo(FRENZY_ZOOM * RENDER_SCALE, FRENZY_ZOOM_IN_MS, CAMERA_EASE, true);
    this._scene.time.delayedCall(FRENZY_ZOOM_IN_MS + FRENZY_ZOOM_HOLD_MS, () => {
      camera.zoomTo(RENDER_SCALE, FRENZY_ZOOM_OUT_MS, CAMERA_EASE, true);
    });
    spinners.forEach((spinner, i) => {
      spinner.pulse(1);
      if (i % FRENZY_CONFETTI_EVERY === 0) {
        spawnConfetti(this._scene, spinner.x, spinner.y, FRENZY_CONFETTI_COLOURS);
      }
    });
  }

  /** Closes the window once its time is up: music back to normal, spinners unlocked, banner away. */
  updateWindow(time: number): void {
    if (!this._active || time < this._endAt) return;
    this._active = false;
    audioOrchestra.onFrenzyEnd();
    for (const spinner of this._spinners()) spinner.locked = false;
    if (this._banner) {
      hideBanner(this._scene, this._banner);
      this._banner = null;
    }
  }

  /**
   * Keeps the encore loud: nothing can level up while the whole band is
   * locked at full, so without this the climax would be the one stretch of
   * the gig with no sparks and no chime. The coins themselves are paid by
   * the clock (`GigScore.payEncore`), not per hit — a fast gun lands sixty
   * hits a second, and paying each one emptied the shop in two rounds.
   */
  celebrateHit(spinner: Spinner): void {
    if (Math.random() < FRENZY_HIT_FLOURISH_CHANCE) {
      spawnSparks(this._scene, spinner.x, spinner.y, COLOUR.sunnyGold);
      // The bright upgrade chime is what actually made hits feel rewarding,
      // and it stopped dead at Frenzy because nothing could level up any
      // more. Riding the same chance keeps it celebratory without turning
      // 60 hits a second into a siren.
      audioOrchestra.accent('full');
    }
  }
}
