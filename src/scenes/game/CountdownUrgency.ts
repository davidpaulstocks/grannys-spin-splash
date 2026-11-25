/**
 * Final-countdown tick + shake (2026-09-12, restored from the
 * prototype — direct user feedback: "urgency building as the clock
 * counts down" was missing). The matching vignette/big-number visuals
 * live in HUDScene's `UrgencyOverlay`, independently keyed off the same
 * `secondsRemaining` value every frame — no cross-scene event needed,
 * since both derive from the same number in the same tick. This owns
 * only what only GameScene *can* own: the world camera shake and
 * the SFX trigger (CLAUDE.md §7.1 — HUDScene stays a pure visual leaf).
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import {
  COUNTDOWN_TICK_SHAKE_DURATION_MS,
  COUNTDOWN_TICK_SHAKE_INTENSITY,
  FINAL_COUNTDOWN_SECONDS,
  URGENT_COUNTDOWN_SECONDS,
} from '../../config';

export class CountdownUrgency {
  /** Last whole second the tick/shake fired for — guards against re-firing every frame within the same second. */
  private _lastSecond = -1;

  constructor(private readonly _scene: Phaser.Scene) {}

  /** Forgets the last tick — covers first boot and a "Play Again" restart alike. */
  reset(): void {
    this._lastSecond = -1;
  }

  /** Ticks and shakes once per whole second inside the urgent window. */
  update(timeRemainingMs: number): void {
    const seconds = Math.ceil(timeRemainingMs / 1000);
    if (seconds > URGENT_COUNTDOWN_SECONDS || seconds === this._lastSecond) return;
    this._lastSecond = seconds;

    const final = seconds <= FINAL_COUNTDOWN_SECONDS;
    audioOrchestra.tick(final);
    this._scene.cameras.main.shake(
      final ? COUNTDOWN_TICK_SHAKE_DURATION_MS.final : COUNTDOWN_TICK_SHAKE_DURATION_MS.normal,
      final ? COUNTDOWN_TICK_SHAKE_INTENSITY.final : COUNTDOWN_TICK_SHAKE_INTENSITY.normal,
    );
  }
}
