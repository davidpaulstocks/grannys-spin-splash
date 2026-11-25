/**
 * One gig on the tour map: a numbered round button when it can be played, a
 * flat padlocked disc when it cannot, and the best rating (three small stars)
 * beneath either. A playable gig is the game's own icon button, so it presses
 * like every other button; a locked one is deliberately flat and silent.
 */

import type Phaser from 'phaser';

import { COLOUR } from '../utils/colour';
import { EASE } from '../utils/tween';
import { createIconButton } from './IconButton';
import { drawLockIcon, drawStarIcon } from './icons';

export interface TourNodeConfig {
  /** Centre of the disc. */
  readonly x: number;
  readonly y: number;
  /** Zero-based; the face shows `gig + 1`. */
  readonly gig: number;
  readonly playable: boolean;
  /** The gig to play next: its button breathes so the eye lands on it first. */
  readonly isNext: boolean;
  /** Best rating so far, 0 to 3. */
  readonly bestStars: number;
  readonly onPlay: () => void;
}

const NODE_DIAMETER = 80;
const NODE_RADIUS = NODE_DIAMETER / 2;
const LOCKED_DISC = 0xd8d4c6;
const LOCKED_OUTLINE_PX = 4;
const LOCKED_OUTLINE_ALPHA = 0.4;
const LOCK_ICON_SIZE = 26;
const BREATHE_SCALE = 1.1;
const BREATHE_MS = 620;
const RATING_STARS = 3;
const RATING_STAR_RADIUS = 10;
const RATING_STAR_OUTLINE = 3;
const RATING_STAR_SPACING = 26;
/** Clears the button's lip and shadow (7 + 6 below the disc) with a little air. */
const RATING_OFFSET_Y = NODE_RADIUS + 30;

/** Builds one node and returns everything it made, ready to add to a container. */
export function createTourNode(
  scene: Phaser.Scene,
  config: TourNodeConfig,
): Phaser.GameObjects.GameObject[] {
  const parts: Phaser.GameObjects.GameObject[] = [];

  if (config.playable) {
    const button = createIconButton(scene, {
      x: config.x,
      y: config.y,
      text: String(config.gig + 1),
      variant: 'primary',
      diameter: NODE_DIAMETER,
      onClick: config.onPlay,
    });
    if (config.isNext) {
      scene.tweens.add({
        targets: button,
        scale: BREATHE_SCALE,
        duration: BREATHE_MS,
        ease: EASE.standardOut,
        yoyo: true,
        repeat: -1,
      });
    }
    parts.push(button);
  } else {
    const disc = scene.add.graphics({ x: config.x, y: config.y });
    disc.fillStyle(LOCKED_DISC, 1);
    disc.fillCircle(0, 0, NODE_RADIUS);
    disc.lineStyle(LOCKED_OUTLINE_PX, COLOUR.ink, LOCKED_OUTLINE_ALPHA);
    disc.strokeCircle(0, 0, NODE_RADIUS);
    const lock = scene.add.graphics({ x: config.x, y: config.y });
    drawLockIcon(lock, LOCK_ICON_SIZE, COLOUR.softSlate);
    parts.push(disc, lock);
  }

  for (let i = 0; i < RATING_STARS; i++) {
    const star = scene.add.graphics({
      x: config.x + (i - 1) * RATING_STAR_SPACING,
      y: config.y + RATING_OFFSET_Y,
    });
    drawStarIcon(star, RATING_STAR_RADIUS + RATING_STAR_OUTLINE, COLOUR.ink);
    drawStarIcon(star, RATING_STAR_RADIUS, i < config.bestStars ? COLOUR.sunnyGold : LOCKED_DISC);
    parts.push(star);
  }
  return parts;
}
