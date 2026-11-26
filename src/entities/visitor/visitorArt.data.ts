/**
 * Which visitor pictures have actually been painted and shipped. Only these
 * are loaded (BootScene) and shown; every other visitor keeps its drawn
 * stand-in (visitorDrawings.ts). To switch one on: run `npm run visitors`,
 * then add the ids it prints here. Painted pictures should face right.
 */

import type { VisitorId } from './visitor.types';

export const VISITOR_ART_READY: readonly VisitorId[] = [
  'balloons',
  'bloomers',
  'candyfloss',
  'cat',
  'cupcake',
  'dodgem',
  'dust_sheet',
  'flamingo',
  'gnome',
  'pigeon',
  'piggy_bank',
  'rubber_duck',
  'seagull',
  'squirrel',
  'tea_towel',
  'trophy',
  'umbrella',
  'watering_can',
];

/** Painted pictures that were drawn facing left; they are mirrored once so every visitor faces right before it is turned to face the way it is going. */
export const VISITOR_ART_FACES_LEFT: readonly VisitorId[] = [
  'flamingo',
  'piggy_bank',
  'watering_can',
  'dodgem',
];
