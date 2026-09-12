/**
 * The first-run onboarding gesture (CLAUDE.md §6.5) — a ghost finger that
 * taps a spinner on a loop until the player fires for the first time.
 *
 * §6.5 rules out a tutorial screen outright and §5.9 rules out reading
 * during gameplay, so a gesture is the only thing allowed to teach the core
 * verb in-game. Legibility over busy illustrated art is what drives every
 * choice here: the hand carries the same Ink outline as everything else in
 * the scene, and a Mint Green ring contracts onto the target as the hand
 * comes down — the ring is what actually reads at this size, so the
 * *destination* stays unmistakable even when the hand doesn't.
 */

import Phaser from 'phaser';

import { COLOUR } from '../utils/colour';
import { EASE } from '../utils/tween';

const PRESS_MS = 460;
const LIFT_MS = 300;
const HOLD_MS = 380;
const RIPPLE_MS = 520;

const RIPPLE_RADIUS = 52;
/** Where the contracting aim ring starts, before it closes onto the target. */
const RING_START_RADIUS = 54;
const RING_END_RADIUS = 22;

/** How far above the target the hand lifts between taps. */
const LIFT_OFFSET_Y = 52;
/**
 * Drawn upright and large. A tilted, smaller version was tried first and
 * read as two floating white pills over the fence art at this size — the
 * finger and palm need a clear width difference and no rotation to register
 * as a hand at ~60 px.
 */
const HAND_SCALE = 1.35;

const FINGERTIP_RADIUS = 9;
const PALM_WIDTH = 38;
const PALM_HEIGHT = 32;
const OUTLINE_WIDTH = 3;
const ALPHA = 0.9;

/** Draws the hand with its fingertip at the origin, so the container's position *is* the touch point. */
function drawHand(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLOUR.cloud, ALPHA);
  g.lineStyle(OUTLINE_WIDTH, COLOUR.ink, ALPHA);

  // Palm first, so the finger reads as lying over it rather than beside it.
  const palmTop = FINGERTIP_RADIUS + 16;
  g.fillRoundedRect(-PALM_WIDTH / 2, palmTop, PALM_WIDTH, PALM_HEIGHT, 14);
  g.strokeRoundedRect(-PALM_WIDTH / 2, palmTop, PALM_WIDTH, PALM_HEIGHT, 14);

  // The extended index finger, from the fingertip down into the palm.
  g.fillRoundedRect(-FINGERTIP_RADIUS, -FINGERTIP_RADIUS, FINGERTIP_RADIUS * 2, palmTop + 10, 9);
  g.strokeRoundedRect(-FINGERTIP_RADIUS, -FINGERTIP_RADIUS, FINGERTIP_RADIUS * 2, palmTop + 10, 9);
}

/**
 * Starts the looping tap hint over (x, y). Returns a dismiss function — call
 * it the moment the player fires, so the hint never talks over someone who
 * already knows what to do.
 */
export function showGhostFinger(scene: Phaser.Scene, x: number, y: number): () => void {
  const gfx = scene.add.graphics();
  drawHand(gfx);
  const hand = scene.add.container(x, y - LIFT_OFFSET_Y, [gfx]);
  hand.setScale(HAND_SCALE);
  hand.setDepth(900);

  let dismissed = false;
  // Tracked so dismissal can kill each ring's tween *before* destroying it.
  // Destroying first left the tween writing `radius` to a dead Arc, which
  // threw inside TweenManager.step and took every other tween in the scene
  // down with it — including the hand's own fade-out, so the hint stayed
  // frozen on screen after the player had already fired.
  const rings = new Set<Phaser.GameObjects.Arc>();

  const retire = (ring: Phaser.GameObjects.Arc): void => {
    rings.delete(ring);
    ring.destroy();
  };

  const newRing = (radius: number, alpha: number): Phaser.GameObjects.Arc => {
    const ring = scene.add.circle(x, y, radius);
    ring.setStrokeStyle(3, COLOUR.mintGreen, alpha);
    ring.setDepth(899);
    rings.add(ring);
    return ring;
  };

  const loop = (): void => {
    if (dismissed) return;
    const aim = newRing(RING_START_RADIUS, 0.85);
    scene.tweens.add({
      targets: aim,
      radius: RING_END_RADIUS,
      alpha: 0.2,
      duration: PRESS_MS,
      ease: EASE.standardOut,
      onComplete: () => retire(aim),
    });
    scene.tweens.add({
      targets: hand,
      y,
      scale: HAND_SCALE * 0.85,
      duration: PRESS_MS,
      ease: EASE.standardOut,
      onComplete: () => {
        if (dismissed) return;
        const ripple = newRing(RING_END_RADIUS, 0.95);
        scene.tweens.add({
          targets: ripple,
          radius: RIPPLE_RADIUS,
          alpha: 0,
          duration: RIPPLE_MS,
          ease: EASE.standardOut,
          onComplete: () => retire(ripple),
        });
        scene.tweens.add({
          targets: hand,
          y: y - LIFT_OFFSET_Y,
          scale: HAND_SCALE,
          duration: LIFT_MS,
          delay: HOLD_MS,
          ease: EASE.standardIn,
          onComplete: loop,
        });
      },
    });
  };
  loop();

  return () => {
    if (dismissed) return;
    dismissed = true;
    scene.tweens.killTweensOf(hand);
    for (const ring of rings) {
      scene.tweens.killTweensOf(ring);
      ring.destroy();
    }
    rings.clear();
    scene.tweens.add({
      targets: hand,
      alpha: 0,
      duration: 160,
      onComplete: () => hand.destroy(),
    });
  };
}
