/**
 * Final-countdown tick + shake (2026-09-12, restored from the
 * prototype — direct user feedback: "urgency building as the clock
 * counts down" was missing). The vignette and the pink pulse live in HUDScene's
 * `UrgencyOverlay`, keyed off the same `secondsRemaining` value. This owns what
 * only GameScene can: the world camera shake, the SFX trigger and (2026-11-27)
 * the big count-down numbers, which are messages on the scene's one stage so
 * they never overprint SPLASH FRENZY or the finish (CLAUDE.md §7.1).
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import {
  COUNTDOWN_TICK_SHAKE_DURATION_MS,
  COUNTDOWN_TICK_SHAKE_INTENSITY,
  FINAL_COUNTDOWN_SECONDS,
  TWENTY_SECOND_CALLOUT_AT,
  URGENT_COUNTDOWN_SECONDS,
} from '../../config';
import { showCountdownNumber } from './stageMessages';

/** "20 SECONDS!" is a sentence, so it is set smaller than a count-down number. */
const TWENTY_CALLOUT_SIZE = 48;

export class CountdownUrgency {
  /** Whether the one-time "20 SECONDS!" has been shown. */
  private _shownTwenty = false;
  /** Last whole second the tick/shake fired for — guards against re-firing every frame within the same second. */
  private _lastSecond = -1;

  constructor(private readonly _scene: Phaser.Scene) {}

  /** Forgets the last tick — covers first boot and a "Play Again" restart alike. */
  reset(): void {
    this._lastSecond = -1;
    this._shownTwenty = false;
  }

  /**
   * Ticks and shakes once per whole second inside the urgent window, and puts
   * the big number on the stage. "20 SECONDS!" shows once; there is no
   * "TIME'S UP!" (the Big Finish says it).
   */
  update(timeRemainingMs: number): void {
    const seconds = Math.ceil(timeRemainingMs / 1000);
    if (seconds === TWENTY_SECOND_CALLOUT_AT && !this._shownTwenty) {
      this._shownTwenty = true;
      showCountdownNumber(this._scene, '20 SECONDS!', seconds, TWENTY_CALLOUT_SIZE);
    }
    if (seconds > URGENT_COUNTDOWN_SECONDS || seconds === this._lastSecond) return;
    this._lastSecond = seconds;
    if (seconds > 0) showCountdownNumber(this._scene, String(seconds), seconds);

    const final = seconds <= FINAL_COUNTDOWN_SECONDS;
    audioOrchestra.tick(final);
    this._scene.cameras.main.shake(
      final ? COUNTDOWN_TICK_SHAKE_DURATION_MS.final : COUNTDOWN_TICK_SHAKE_DURATION_MS.normal,
      final ? COUNTDOWN_TICK_SHAKE_INTENSITY.final : COUNTDOWN_TICK_SHAKE_INTENSITY.normal,
    );
  }
}
