/**
 * "Where am I, and where next?" — a venue's eight gigs as a row of real
 * buttons (`GigButton`): open ones start that gig, locked ones are padlocked,
 * each open one shows its stars, a gig with all three looks calmly done, the
 * recommended one pulses under a pointer, and the one just played keeps its
 * pink ring. At the right-hand end the next venue is a button: GO! when it is
 * open, a padlock and "N more stars" when it is not.
 */

import Phaser from 'phaser';

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import type { WorldDef } from '../entities/world/world.types';
import { COLOUR } from '../utils/colour';
import { createGigButton } from './GigButton';
import { GIG_RING_GAP, GIG_RING_PX } from './gigButtonLayout';
import { createNextVenueTile } from './NextVenueTile';
import { createPanel } from './Panel';
import {
  PATH_GIG_DIAMETER,
  PATH_GIG_Y,
  PATH_TILE_FACE_Y,
  PATH_TILE_WIDTH,
  PATH_TILE_X,
  pathGigX,
  TOUR_PATH_HEIGHT,
  TOUR_PATH_WIDTH,
} from './tourPathLayout';

export { TOUR_PATH_HEIGHT, TOUR_PATH_WIDTH };

export interface TourPathConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly venue: WorldDef;
  /** Best stars on each gig, `GIGS_PER_VENUE` long. */
  readonly stars: readonly number[];
  /** Which gigs can be played, `GIGS_PER_VENUE` long. */
  readonly open: readonly boolean[];
  /** Zero-based gig just played: it keeps its ring. */
  readonly played: number;
  /** The gig the player should go to next (`recommendedGig`), or null when the venue is complete. */
  readonly recommended: number | null;
  /** Starts an open gig. */
  readonly onPick: (gig: number) => void;
  /** The venue after this one, with the stars it still needs (0 = open), or null after the last. */
  readonly following: { readonly venue: WorldDef; readonly starsNeeded: number } | null;
  /** Starts the following venue; called only when it is open. */
  readonly onGo: (venue: WorldDef) => void;
}

export interface TourPath {
  readonly container: Phaser.GameObjects.Container;
}

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

  const withTile = config.following !== null;
  const discY = config.y + PATH_GIG_Y;

  if (config.following) {
    const ringReach = PATH_GIG_DIAMETER / 2 + GIG_RING_GAP + GIG_RING_PX / 2;
    const line = scene.add.graphics();
    line.lineStyle(CONNECTOR_PX, COLOUR.ink, CONNECTOR_ALPHA);
    line.lineBetween(
      config.x + pathGigX(GIGS_PER_VENUE - 1, true) + ringReach + CONNECTOR_GAP,
      discY,
      config.x + PATH_TILE_X - PATH_TILE_WIDTH / 2 - CONNECTOR_GAP,
      discY,
    );
    container.add(line);
  }

  for (let i = 0; i < GIGS_PER_VENUE; i++) {
    container.add(
      createGigButton(scene, {
        x: config.x + pathGigX(i, withTile),
        y: discY,
        diameter: PATH_GIG_DIAMETER,
        gig: i,
        open: config.open[i] ?? false,
        stars: config.stars[i] ?? 0,
        recommended: i === config.recommended,
        marked: i === config.played,
        onTap: () => config.onPick(i),
      }),
    );
  }

  if (config.following) {
    const following = config.following;
    container.add(
      createNextVenueTile(scene, {
        x: config.x + PATH_TILE_X,
        y: config.y + PATH_TILE_FACE_Y,
        venue: following.venue,
        starsNeeded: following.starsNeeded,
        onGo: () => config.onGo(following.venue),
      }),
    );
  }
  return { container };
}
