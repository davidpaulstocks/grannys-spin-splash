/**
 * "Where am I?" — a venue's eight gigs as a row of dots with the stars earned
 * on each, the gig just played ringed in pink, the next one pulsing, and at
 * the right-hand end the next venue as a button: GO! when it is open, a
 * padlock and "N more stars" when it is not.
 */

import Phaser from 'phaser';

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import type { WorldDef } from '../entities/world/world.types';
import { MAX_STARS_PER_GIG } from '../systems/Progress';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { drawStarIcon } from './icons';
import { createNextVenueTile } from './NextVenueTile';
import { createPanel } from './Panel';

export interface TourPathConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly venue: WorldDef;
  /** Best stars on each gig, `GIGS_PER_VENUE` long. */
  readonly stars: readonly number[];
  /** Zero-based gig just played, and the one the main button leads to (the same gig after a miss). */
  readonly played: number;
  readonly next: number;
  /** The venue after this one, with the stars it still needs (0 = open), or null after the last. */
  readonly following: { readonly venue: WorldDef; readonly starsNeeded: number } | null;
  /** Starts the following venue; called only when it is open. */
  readonly onGo: (venue: WorldDef) => void;
}

export interface TourPath {
  readonly container: Phaser.GameObjects.Container;
}

export const TOUR_PATH_WIDTH = 760;
export const TOUR_PATH_HEIGHT = 104;

/** Offsets from the card's centre. */
const DOTS_Y = -14;
const STARS_Y = 30;
const DOTS_START_X = -330;
const DOT_SPACING_WITH_TILE = 62;
const DOT_SPACING_ALONE = 72;
const DOT_RADIUS = 19;
const DOT_OUTLINE_PX = 3;
const PLAYED_RING_RADIUS = 27;
const PLAYED_RING_PX = 5;
const PALE = 0xd8d4c6;
const PULSE_SCALE = 1.16;
const PULSE_MS = 520;
const GIG_STAR_RADIUS = 6;
const GIG_STAR_SPACING = 15;
const TILE_X = 299;
const TILE_Y = -2;
const TILE_HALF_WIDTH = 65;
const CONNECTOR_ALPHA = 0.3;
const CONNECTOR_PX = 4;
const CONNECTOR_GAP = 8;

/** Builds the card and returns it. */
export function createTourPath(scene: Phaser.Scene, config: TourPathConfig): TourPath {
  const parts: Phaser.GameObjects.GameObject[] = createPanel(scene, {
    x: config.x,
    y: config.y,
    width: TOUR_PATH_WIDTH,
    height: TOUR_PATH_HEIGHT,
  });
  const container = scene.add.container(0, 0);
  container.add(parts);

  const following = config.following;
  const spacing = following ? DOT_SPACING_WITH_TILE : DOT_SPACING_ALONE;
  const startX = following ? DOTS_START_X : -((GIGS_PER_VENUE - 1) * spacing) / 2;
  const dotsY = config.y + DOTS_Y;

  if (following) {
    const lastDotX = config.x + startX + (GIGS_PER_VENUE - 1) * spacing;
    const line = scene.add.graphics();
    line.lineStyle(CONNECTOR_PX, COLOUR.ink, CONNECTOR_ALPHA);
    line.lineBetween(
      lastDotX + PLAYED_RING_RADIUS + CONNECTOR_GAP,
      dotsY,
      config.x + TILE_X - TILE_HALF_WIDTH - CONNECTOR_GAP,
      dotsY,
    );
    container.add(line);
  }

  for (let i = 0; i < GIGS_PER_VENUE; i++) {
    const x = config.x + startX + i * spacing;
    const earned = config.stars[i] ?? 0;
    const isNext = i === config.next;
    const dot = scene.add.container(x, dotsY);
    const face = scene.add.graphics();
    if (i === config.played) {
      face.lineStyle(PLAYED_RING_PX, COLOUR.grannyPink, 1);
      face.strokeCircle(0, 0, PLAYED_RING_RADIUS);
    }
    face.fillStyle(earned > 0 ? COLOUR.sunnyGold : isNext ? COLOUR.mintGreen : PALE, 1);
    face.fillCircle(0, 0, DOT_RADIUS);
    face.lineStyle(DOT_OUTLINE_PX, COLOUR.ink, earned > 0 || isNext ? 1 : 0.4);
    face.strokeCircle(0, 0, DOT_RADIUS);
    const label = scene.add
      .text(0, 0, String(i + 1), textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.ink))
      .setOrigin(0.5);
    dot.add([face, label]);
    container.add(dot);
    if (isNext) {
      scene.tweens.add({
        targets: dot,
        scale: PULSE_SCALE,
        duration: PULSE_MS,
        ease: EASE.standardOut,
        yoyo: true,
        repeat: -1,
      });
    }

    const row = scene.add.graphics({ x, y: config.y + STARS_Y });
    for (let s = 0; s < MAX_STARS_PER_GIG; s++) {
      const starX = (s - 1) * GIG_STAR_SPACING;
      row.translateCanvas(starX, 0);
      drawStarIcon(row, GIG_STAR_RADIUS + 2, COLOUR.ink);
      drawStarIcon(row, GIG_STAR_RADIUS, s < earned ? COLOUR.sunnyGold : PALE);
      row.translateCanvas(-starX, 0);
    }
    container.add(row);
  }

  if (following) {
    container.add(
      createNextVenueTile(scene, {
        x: config.x + TILE_X,
        y: config.y + TILE_Y,
        venue: following.venue,
        starsNeeded: following.starsNeeded,
        onGo: () => config.onGo(following.venue),
      }),
    );
  }
  return { container };
}
