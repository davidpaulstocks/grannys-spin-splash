/**
 * Home's row of eight gig buttons: pick which gig PLAY starts without leaving
 * the screen. The same small buttons as the results screen's tour path
 * (`GigButton`): stars under each, padlocked ones locked, finished ones
 * ticked, the recommended one pulsing under a pointer, and a pink ring on the
 * selected one. One row of eight, 48 across with 8 between, so a finger can
 * hit each one.
 */

import type Phaser from 'phaser';

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import { isGigOpen, venueStars } from '../systems/Progress';
import type { SaveData } from '../types/save';
import { createGigButton } from './GigButton';
import { PICKER_DIAMETER, PICKER_PITCH } from './gigCardLayout';

export interface GigPickerConfig {
  /** Centre of the row, and of the discs vertically. */
  readonly x: number;
  readonly y: number;
  readonly save: SaveData;
  readonly venueId: string;
  /** The selected gig (ringed), zero-based. */
  readonly selected: number;
  /** `recommendedGig` for the venue, or null when it is complete. */
  readonly recommended: number | null;
  /** An open gig was tapped. */
  readonly onSelect: (gig: number) => void;
}

/** Builds the row and returns everything it made. */
export function createGigPicker(
  scene: Phaser.Scene,
  config: GigPickerConfig,
): Phaser.GameObjects.GameObject[] {
  const stars = venueStars(config.save, config.venueId);
  const parts: Phaser.GameObjects.GameObject[] = [];
  for (let i = 0; i < GIGS_PER_VENUE; i++) {
    parts.push(
      ...createGigButton(scene, {
        x: config.x + (i - (GIGS_PER_VENUE - 1) / 2) * PICKER_PITCH,
        y: config.y,
        diameter: PICKER_DIAMETER,
        gig: i,
        open: isGigOpen(config.save, config.venueId, i),
        stars: stars[i] ?? 0,
        recommended: i === config.recommended,
        marked: i === config.selected,
        onTap: () => config.onSelect(i),
      }),
    );
  }
  return parts;
}
