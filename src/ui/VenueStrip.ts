/**
 * The row of venue tiles along the bottom of Home. Tapping an open venue
 * selects it; tapping a locked one shakes and says how many more stars it needs.
 * It shows five tiles at a time; with more venues than that, a round arrow at
 * each end pages through them and the selected venue is always in view.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../config';
import { WORLD_DEFS } from '../entities/world/world.data';
import { isVenueOpen, starsToGo, venueStarTotal } from '../systems/Progress';
import type { SaveData } from '../types/save';
import { drawBackIcon, drawForwardIcon } from './icons';
import { createIconButton } from './IconButton';
import { showToast } from './Toast';
import { createVenueTile, VENUE_TILE_WIDTH, type VenueTile } from './VenueTile';
import {
  firstAfterPaging,
  firstInView,
  needsPaging,
  slotCentreX,
  STRIP_PAGE_SIZE,
  visibleCount,
} from './venueStripPaging';

export interface VenueStripConfig {
  /** Vertical centre of the (unraised) tiles. */
  readonly y: number;
  readonly save: SaveData;
  readonly selectedId: string;
  readonly onSelect: (venueId: string) => void;
}

export interface VenueStrip {
  /** Moves the pink ring and the raise to another venue's tile, paging to it if it is off screen. */
  setSelected(venueId: string): void;
}

const TILE_GAP = 16;
const TOAST_OFFSET_Y = -30;
/** The arrows sit in the margin left of the tiles: (1280 - 5 tiles - 4 gaps) / 2 = 68 px each side. */
const ARROW_DIAMETER = 48;
const ARROW_CENTRE_FROM_EDGE = 32;
const ARROW_DISABLED_ALPHA = 0.3;

interface Entry {
  readonly id: string;
  readonly tile: VenueTile;
}

/** Lays the tiles out centred on the canvas, pages them when there are many, and wires their taps. */
export function createVenueStrip(scene: Phaser.Scene, config: VenueStripConfig): VenueStrip {
  const pitch = VENUE_TILE_WIDTH + TILE_GAP;
  const count = WORLD_DEFS.length;
  const entries: Entry[] = [];
  let selectedId = config.selectedId;
  let first = firstInView(
    count,
    Math.max(
      0,
      WORLD_DEFS.findIndex((w) => w.id === selectedId),
    ),
    0,
  );

  /** Where tile `index` stands now, or null when it is off the page. */
  const xOf = (index: number): number | null => {
    const slot = index - first;
    if (slot < 0 || slot >= STRIP_PAGE_SIZE) return null;
    return slotCentreX(GAME_WIDTH / 2, slot, visibleCount(count), pitch);
  };

  WORLD_DEFS.forEach((venue, i) => {
    const open = isVenueOpen(config.save, venue);
    const tile = createVenueTile(scene, {
      x: xOf(i) ?? GAME_WIDTH / 2,
      y: config.y,
      venue,
      earned: venueStarTotal(config.save, venue.id),
      open,
      selected: venue.id === selectedId,
      onTap: () => {
        if (open) {
          config.onSelect(venue.id);
          return;
        }
        const needed = starsToGo(config.save, venue);
        tile.shake();
        showToast(
          scene,
          xOf(i) ?? GAME_WIDTH / 2,
          config.y + TOAST_OFFSET_Y,
          `${needed} more ${needed === 1 ? 'star' : 'stars'} to open`,
        );
      },
    });
    entries.push({ id: venue.id, tile });
  });

  const arrows = needsPaging(count) ? buildArrows() : null;

  function buildArrows(): {
    left: Phaser.GameObjects.Container;
    right: Phaser.GameObjects.Container;
  } {
    const make = (direction: -1 | 1): Phaser.GameObjects.Container =>
      createIconButton(scene, {
        x: direction === -1 ? ARROW_CENTRE_FROM_EDGE : GAME_WIDTH - ARROW_CENTRE_FROM_EDGE,
        y: config.y,
        icon: direction === -1 ? drawBackIcon : drawForwardIcon,
        diameter: ARROW_DIAMETER,
        onClick: () => {
          const next = firstAfterPaging(count, first, direction);
          if (next === first) return;
          first = next;
          layout();
        },
      });
    return { left: make(-1), right: make(1) };
  }

  /** Puts each tile in its slot, hides the ones off the page and dims an arrow that has nowhere to go. */
  function layout(): void {
    entries.forEach((entry, i) => {
      const x = xOf(i);
      entry.tile.container.setVisible(x !== null);
      if (x !== null) entry.tile.container.setX(x);
    });
    if (arrows) {
      const last = count - STRIP_PAGE_SIZE;
      arrows.left.setAlpha(first > 0 ? 1 : ARROW_DISABLED_ALPHA);
      arrows.right.setAlpha(first < last ? 1 : ARROW_DISABLED_ALPHA);
    }
  }
  layout();

  return {
    setSelected: (venueId: string): void => {
      selectedId = venueId;
      const index = Math.max(
        0,
        WORLD_DEFS.findIndex((w) => w.id === venueId),
      );
      const next = firstInView(count, index, first);
      if (next !== first) {
        first = next;
        layout();
      }
      entries.forEach((entry) => entry.tile.setSelected(entry.id === venueId));
    },
  };
}
