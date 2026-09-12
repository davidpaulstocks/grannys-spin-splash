/**
 * The round-opening turn (2026-09-12, direct user request: "when the player
 * enters the world, I want to see the granny start facing the player then
 * rotate ready for action — a brief cinematic to build anticipation").
 *
 * She lands facing the camera in her `front` portrait pose, holds a beat,
 * pivots to face the wall, and settles with a small ready-bounce as the gun
 * fades in.
 *
 * **Why there is no in-between turn frame.** Each granny ships three poses —
 * `front`, `back`, `back_firing` (CLAUDE.md §8.1's 2026-09-11 re-plan, which
 * dropped the original 3/4 and side poses as unused once the camera moved
 * behind her). So the pivot uses the classic 2D turnaround trick instead:
 * squash horizontally to edge-on, swap the texture at the pinch, expand back
 * out. At this size and speed it reads as a real turn. If a 3/4 pose is ever
 * drawn, swapping it in at the pinch is a two-line change here.
 *
 * Skippable by design — CLAUDE.md §12 item 13 requires it, and the round
 * clock does not start until first input anyway, so a player who just wants
 * to shoot loses nothing by skipping.
 */

import Phaser from 'phaser';

import type { Granny } from './Granny';
import { DURATION, EASE } from '../../utils/tween';

/** Beat 1: she faces the player. Long enough to register, short enough not to be a wait. */
const FACE_HOLD_MS = 420;
/** Beat 2: the pivot. Each half is the squash in / expand out. */
const TURN_HALF_MS = 160;
/** Beat 3: the ready-bounce as she settles into the firing stance. */
const SETTLE_MS = 220;
/** How far she dips before the turn — a tiny wind-up reads as intent. */
const WINDUP_SCALE = 0.96;
/** Edge-on width at the pivot. Not 0, which would pop; a sliver keeps it continuous. */
const PINCH_FACTOR = 0.08;

export interface RoundIntro {
  /** True while the cinematic is still playing. */
  readonly isPlaying: () => boolean;
  /** Ends it immediately and settles Granny into her gameplay pose. */
  readonly skip: () => void;
}

/**
 * Plays the turn on `granny`, calling `onComplete` once she is in her
 * gameplay pose. `gunSprite` is faded in on the settle so the gun does not
 * hang in mid-air while she is still facing the camera.
 */
export function playRoundIntro(
  scene: Phaser.Scene,
  granny: Granny,
  gunSprite: Phaser.GameObjects.GameObject & { setAlpha(v: number): unknown },
  onComplete: () => void,
): RoundIntro {
  let done = false;
  const tweens: Phaser.Tweens.Tween[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];

  granny.faceCamera();
  gunSprite.setAlpha(0);

  const finish = (): void => {
    if (done) return;
    done = true;
    for (const t of tweens) t.remove();
    for (const t of timers) t.remove();
    granny.faceWall();
    granny.clearTurnSquash();
    granny.setScale(1);
    gunSprite.setAlpha(1);
    onComplete();
  };

  const pivot = (): void => {
    if (done) return;
    const squash = { v: 1 };
    tweens.push(
      scene.tweens.add({
        targets: squash,
        v: PINCH_FACTOR,
        duration: TURN_HALF_MS,
        ease: EASE.standardIn,
        onUpdate: () => granny.setTurnSquash(squash.v),
        onComplete: () => {
          if (done) return;
          granny.faceWall(); // swap to the `back` texture at the pinch
          granny.setTurnSquash(PINCH_FACTOR);
          tweens.push(
            scene.tweens.add({
              targets: squash,
              v: 1,
              duration: TURN_HALF_MS,
              ease: EASE.standardOut,
              onUpdate: () => granny.setTurnSquash(squash.v),
              onComplete: settle,
            }),
          );
        },
      }),
    );
  };

  const settle = (): void => {
    if (done) return;
    granny.clearTurnSquash();
    tweens.push(
      scene.tweens.add({
        targets: gunSprite,
        alpha: 1,
        duration: DURATION.stateChange,
      }),
    );
    tweens.push(
      scene.tweens.add({
        targets: granny,
        scale: { from: WINDUP_SCALE, to: 1 },
        duration: SETTLE_MS,
        ease: EASE.bouncy,
        onComplete: finish,
      }),
    );
  };

  timers.push(scene.time.delayedCall(FACE_HOLD_MS, pivot));

  return { isPlaying: () => !done, skip: finish };
}
