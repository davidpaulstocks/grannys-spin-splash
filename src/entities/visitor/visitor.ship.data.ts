/**
 * The Pirate Ship's six visitors: two blockers, two thieves and two treats.
 * They are not painted yet (visitorArt.data.ts), so each wears a drawn
 * stand-in (pirateDrawings.ts). Sizes follow the nearest existing visitor.
 */

import type { VisitorDef } from './visitor.types';

export type ShipVisitorId =
  | 'ship_sail'
  | 'fishing_net'
  | 'parrot'
  | 'crab'
  | 'treasure_chest'
  | 'golden_compass';

/** The crab is painted holding a gold coin: squirting it off pays this share of the third-star target (David, 2026-11-27). */
const CRAB_COIN_FRACTION = 0.05;

export const SHIP_VISITOR_DEFS: Readonly<Record<ShipVisitorId, VisitorDef>> = {
  ship_sail: {
    id: 'ship_sail',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 240,
    drawScale: 1,
    hitRx: 70,
    hitRy: 58,
    hitOffsetY: 4,
    exitRisePxPerS: 0,
  },
  fishing_net: {
    id: 'fishing_net',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 210,
    drawScale: 1,
    hitRx: 72,
    hitRy: 54,
    hitOffsetY: 4,
    exitRisePxPerS: 0,
  },
  parrot: {
    id: 'parrot',
    kind: 'sitter',
    word: 'Shoo!',
    artPx: 110,
    drawScale: 1,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 150,
  },
  crab: {
    id: 'crab',
    kind: 'sitter',
    word: 'Shoo!',
    shooFraction: CRAB_COIN_FRACTION,
    artPx: 110,
    drawScale: 1.2,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  treasure_chest: {
    id: 'treasure_chest',
    kind: 'treat',
    word: 'Ka-ching!',
    artPx: 110,
    drawScale: 1,
    hitRx: 56,
    hitRy: 46,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  golden_compass: {
    id: 'golden_compass',
    kind: 'treat',
    word: 'Ahoy!',
    artPx: 110,
    drawScale: 1,
    hitRx: 50,
    hitRy: 50,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
};
