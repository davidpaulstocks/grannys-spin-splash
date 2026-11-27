/**
 * Keeps hold of every timer and tween the gun reveal starts, so closing the
 * overlay (or a tap that skips ahead) can cancel them all and leave nothing
 * running behind it.
 */

import type Phaser from 'phaser';

export class RevealTracker {
  private readonly _timers = new Set<Phaser.Time.TimerEvent>();
  private readonly _tweens = new Set<Phaser.Tweens.Tween>();

  constructor(private readonly _scene: Phaser.Scene) {}

  /** Runs `fn` after `ms`; the timer is remembered so it can be cancelled. */
  delay(ms: number, fn: () => void): Phaser.Time.TimerEvent {
    const timer = this._scene.time.delayedCall(Math.max(0, ms), () => {
      this._timers.delete(timer);
      fn();
    });
    this._timers.add(timer);
    return timer;
  }

  /** Cancels one timer started by `delay`. */
  cancel(timer: Phaser.Time.TimerEvent): void {
    timer.remove(false);
    this._timers.delete(timer);
  }

  /** Starts a tween and remembers it. */
  tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    const tween = this._scene.tweens.add(config);
    this._tweens.add(tween);
    return tween;
  }

  /** Starts a number tween (a counter) and remembers it. */
  counter(config: Phaser.Types.Tweens.NumberTweenBuilderConfig): Phaser.Tweens.Tween {
    const tween = this._scene.tweens.addCounter(config);
    this._tweens.add(tween);
    return tween;
  }

  /** Cancels every timer and tween still running. */
  clear(): void {
    this._timers.forEach((t) => t.remove(false));
    this._timers.clear();
    this._tweens.forEach((t) => t.remove());
    this._tweens.clear();
  }
}

/** What every piece of the reveal needs: the scene, the overlay's container and the tracker. */
export interface RevealCtx {
  readonly scene: Phaser.Scene;
  readonly root: Phaser.GameObjects.Container;
  readonly tracker: RevealTracker;
}
