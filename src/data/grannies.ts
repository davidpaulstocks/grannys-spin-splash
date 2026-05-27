/**
 * GRANNY_DEFS — launch roster of 3 grannies (CLAUDE.md §8.1). Cost values
 * come from §8.1's table; sprite keys mirror the planned filenames in
 * public/sprites/grannies/. Sprint 3 generates the actual PNGs.
 */

import type { GrannyDef } from '../types/granny';

export const GRANNY_DEFS: readonly GrannyDef[] = [
  { id: 'classic', name: 'Classic Granny', spriteKey: 'granny_classic', unlockCost: 0 },
  { id: 'squirt', name: 'The Squirt Sister', spriteKey: 'granny_squirt', unlockCost: 0 },
  { id: 'punk', name: 'Punk Granny', spriteKey: 'granny_punk', unlockCost: 500 },
];

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GRANNY_ID = 'classic';
