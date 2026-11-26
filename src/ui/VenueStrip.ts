/**
 * The row of five venue tiles along the bottom of Home. Tapping an open venue
 * selects it; tapping a locked one shakes and says how many more stars it needs.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../config';
import { WORLD_DEFS } from '../entities/world/world.data';
import { isVenueOpen, starsToGo, venueStarTotal } from '../systems/Progress';
import type { SaveData } from '../types/save';
import { showToast } from './Toast';
import { createVenueTile, VENUE_TILE_WIDTH, type VenueTile } from './VenueTile';

export interface VenueStripConfig {
  /** Vertical centre of the (unraised) tiles. */
  readonly y: number;
  readonly save: SaveData;
  readonly selectedId: string;
  readonly onSelect: (venueId: string) => void;
}

export interface VenueStrip {
  /** Moves the pink ring and the raise to another venue's tile. */
  setSelected(venueId: string): void;
}

const TILE_GAP = 16;
const TOAST_OFFSET_Y = -30;

/** Lays the tiles out centred on the canvas and wires their taps. */
export function createVenueStrip(scene: Phaser.Scene, config: VenueStripConfig): VenueStrip {
  const pitch = VENUE_TILE_WIDTH + TILE_GAP;
  const tiles = new Map<string, VenueTile>();

  WORLD_DEFS.forEach((venue, i) => {
    const x = GAME_WIDTH / 2 + (i - (WORLD_DEFS.length - 1) / 2) * pitch;
    const open = isVenueOpen(config.save, venue);
    const tile = createVenueTile(scene, {
      x,
      y: config.y,
      venue,
      earned: venueStarTotal(config.save, venue.id),
      open,
      selected: venue.id === config.selectedId,
      onTap: () => {
        if (open) {
          config.onSelect(venue.id);
          return;
        }
        const needed = starsToGo(config.save, venue);
        tiles.get(venue.id)?.shake();
        showToast(
          scene,
          x,
          config.y + TOAST_OFFSET_Y,
          `${needed} more ${needed === 1 ? 'star' : 'stars'} to open`,
        );
      },
    });
    tiles.set(venue.id, tile);
  });

  return {
    setSelected: (venueId: string): void => {
      tiles.forEach((tile, id) => tile.setSelected(id === venueId));
    },
  };
}
