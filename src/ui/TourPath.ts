/**
 * "Where am I?" — a venue's eight gigs as a row of dots with the stars earned
 * on each, the gig just played ringed in pink, the next one pulsing, and at
 * the right-hand end the next venue: padlocked with how many more stars it
 * needs, or open with a flourish when this gig's stars just opened it.
 */

import Phaser from 'phaser';

import { spawnConfetti } from '../entities/waterParticle/splashVFX';
import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import type { WorldDef } from '../entities/world/world.types';
import { playStarChime } from '../audio/ResultsMusic';
import { MAX_STARS_PER_GIG } from '../systems/Progress';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createPanel } from './Panel';
import { drawLockIcon, drawStarIcon } from './icons';
import { ensureThumbTexture } from './VenueTile';

export interface TourPathConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly venue: WorldDef;
  /** Best stars on each gig, `GIGS_PER_VENUE` long. */
  readonly stars: readonly number[];
  /** Zero-based gig just played, and the one NEXT GIG leads to (the same gig after a miss). */
  readonly played: number;
  readonly next: number;
  /** A venue this gig just opened; takes the badge's place and is celebrated. */
  readonly opened: WorldDef | null;
  /** Otherwise the next venue still locked and the stars it needs. */
  readonly locked: { readonly venue: WorldDef; readonly starsNeeded: number } | null;
}

export interface TourPath {
  readonly container: Phaser.GameObjects.Container;
  /** The big moment when a venue has just opened: pop, confetti, chime. No-op otherwise. */
  celebrate(): void;
}

export const TOUR_PATH_WIDTH = 760;
export const TOUR_PATH_HEIGHT = 104;

/** Offsets from the card's centre. */
const DOTS_Y = 8;
const STARS_Y = 42;
const DOTS_START_X = -344;
const DOT_SPACING_WITH_BADGE = 54;
const DOT_SPACING_ALONE = 62;
const DOT_RADIUS = 19;
const DOT_OUTLINE_PX = 3;
const PLAYED_RING_RADIUS = 27;
const PLAYED_RING_PX = 5;
const PALE = 0xd8d4c6;
const PULSE_SCALE = 1.16;
const PULSE_MS = 520;
const GIG_STAR_RADIUS = 6;
const GIG_STAR_SPACING = 15;

const BADGE_X = 260;
const BADGE_Y = 4;
const BADGE_WIDTH = 146;
const BADGE_HEIGHT = 84;
const BADGE_RADIUS = 14;
const BADGE_DIM_ALPHA = 0.5;
const BADGE_OUTLINE_PX = 4;
const BADGE_FALLBACK = 0x8a8a9a;
const LOCK_SIZE = 22;
const CONNECTOR_ALPHA = 0.3;
const CONNECTOR_PX = 4;
const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

/** Builds the card and returns it with its one celebration. */
export function createTourPath(scene: Phaser.Scene, config: TourPathConfig): TourPath {
  const hasBadge = config.opened !== null || config.locked !== null;
  const parts: Phaser.GameObjects.GameObject[] = createPanel(scene, {
    x: config.x,
    y: config.y,
    width: TOUR_PATH_WIDTH,
    height: TOUR_PATH_HEIGHT,
    ribbon: `${config.venue.name.toUpperCase()} TOUR`,
  });
  const container = scene.add.container(0, 0);
  container.add(parts);

  const spacing = hasBadge ? DOT_SPACING_WITH_BADGE : DOT_SPACING_ALONE;
  const startX = hasBadge ? DOTS_START_X : -((GIGS_PER_VENUE - 1) * spacing) / 2;
  const dotsY = config.y + DOTS_Y;

  if (hasBadge) {
    const line = scene.add.graphics();
    line.lineStyle(CONNECTOR_PX, COLOUR.ink, CONNECTOR_ALPHA);
    line.lineBetween(config.x + startX, dotsY, config.x + BADGE_X - BADGE_WIDTH / 2, dotsY);
    container.add(line);
  }

  for (let i = 0; i < GIGS_PER_VENUE; i++) {
    const x = config.x + startX + i * spacing;
    const earned = config.stars[i] ?? 0;
    const dot = scene.add.container(x, dotsY);
    const face = scene.add.graphics();
    if (i === config.played) {
      face.lineStyle(PLAYED_RING_PX, COLOUR.grannyPink, 1);
      face.strokeCircle(0, 0, PLAYED_RING_RADIUS);
    }
    face.fillStyle(earned > 0 ? COLOUR.sunnyGold : i === config.next ? COLOUR.mintGreen : PALE, 1);
    face.fillCircle(0, 0, DOT_RADIUS);
    face.lineStyle(DOT_OUTLINE_PX, COLOUR.ink, earned > 0 || i === config.next ? 1 : 0.4);
    face.strokeCircle(0, 0, DOT_RADIUS);
    const label = scene.add
      .text(0, 0, String(i + 1), textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.ink))
      .setOrigin(0.5);
    dot.add([face, label]);
    container.add(dot);
    if (i === config.next) {
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

  let badge: Phaser.GameObjects.Container | null = null;
  if (hasBadge) {
    badge = buildBadge(scene, config);
    container.add(badge);
  }

  return {
    container,
    celebrate: () => {
      if (!badge || !config.opened) return;
      const target = badge;
      target.setScale(0.6);
      scene.tweens.add({
        targets: target,
        scale: 1,
        duration: DURATION.celebration,
        ease: EASE.bouncy,
      });
      playStarChime(2);
      spawnConfetti(scene, config.x + BADGE_X, config.y + BADGE_Y, CONFETTI_COLOURS);
    },
  };
}

/** The next venue as a small rounded picture with its name and what it needs (or OPEN!). */
function buildBadge(scene: Phaser.Scene, config: TourPathConfig): Phaser.GameObjects.Container {
  const venue = config.opened ?? config.locked?.venue;
  const x = config.x + BADGE_X;
  const y = config.y + BADGE_Y;
  const badge = scene.add.container(x, y);
  if (!venue) return badge;
  const isOpen = config.opened !== null;
  const left = -BADGE_WIDTH / 2;
  const top = -BADGE_HEIGHT / 2;

  const textureKey = ensureThumbTexture(scene, venue.id);
  if (textureKey) {
    badge.add(scene.add.image(0, 0, textureKey).setDisplaySize(BADGE_WIDTH, BADGE_HEIGHT));
  } else {
    const swatch = scene.add.graphics();
    swatch.fillStyle(BADGE_FALLBACK, 1);
    swatch.fillRoundedRect(left, top, BADGE_WIDTH, BADGE_HEIGHT, BADGE_RADIUS);
    badge.add(swatch);
  }
  const overlay = scene.add.graphics();
  overlay.fillStyle(COLOUR.ink, isOpen ? 0.3 : BADGE_DIM_ALPHA);
  overlay.fillRoundedRect(left, top, BADGE_WIDTH, BADGE_HEIGHT, BADGE_RADIUS);
  overlay.lineStyle(BADGE_OUTLINE_PX, COLOUR.ink, 1);
  overlay.strokeRoundedRect(left, top, BADGE_WIDTH, BADGE_HEIGHT, BADGE_RADIUS);
  badge.add(overlay);

  const name = scene.add
    .text(0, isOpen ? -22 : -28, venue.name, textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
    .setOrigin(0.5);
  badge.add(name);
  if (isOpen) {
    badge.add(
      scene.add
        .text(0, 14, 'OPEN!', textStyle('displayM', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink))
        .setOrigin(0.5),
    );
    return badge;
  }
  const lock = scene.add.graphics({ x: 0, y: -2 });
  drawLockIcon(lock, LOCK_SIZE, COLOUR.cloud);
  const need = config.locked?.starsNeeded ?? 0;
  const needed = scene.add
    .text(
      0,
      27,
      `${need} more ${need === 1 ? 'star' : 'stars'}`,
      textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink),
    )
    .setOrigin(0.5);
  badge.add([lock, needed]);
  return badge;
}
