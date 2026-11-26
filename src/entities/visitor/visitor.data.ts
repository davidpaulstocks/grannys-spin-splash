/**
 * The visitors: who comes to which venue, and every timing and size that
 * decides how a visit feels. One place to tune.
 */

import { COLOUR } from '../../utils/colour';
import type { VisitorDef, VisitorId } from './visitor.types';

export const VISITOR_DEFS: Readonly<Record<VisitorId, VisitorDef>> = {
  bloomers: {
    id: 'bloomers',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 230,
    drawScale: 1,
    hitRx: 62,
    hitRy: 52,
    hitOffsetY: 4,
    exitRisePxPerS: 0,
  },
  umbrella: {
    id: 'umbrella',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 170,
    drawScale: 1.7,
    hitRx: 70,
    hitRy: 42,
    hitOffsetY: -40,
    exitRisePxPerS: 0,
  },
  balloons: {
    id: 'balloons',
    kind: 'blocker',
    word: 'Pop!',
    artPx: 190,
    drawScale: 1,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  flamingo: {
    id: 'flamingo',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 190,
    drawScale: 1,
    hitRx: 80,
    hitRy: 54,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  dust_sheet: {
    id: 'dust_sheet',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 230,
    drawScale: 1,
    hitRx: 66,
    hitRy: 56,
    hitOffsetY: 4,
    exitRisePxPerS: 0,
  },
  tea_towel: {
    id: 'tea_towel',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 210,
    drawScale: 1,
    hitRx: 54,
    hitRy: 58,
    hitOffsetY: 4,
    exitRisePxPerS: 0,
  },
  gnome: {
    id: 'gnome',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 190,
    drawScale: 1,
    hitRx: 50,
    hitRy: 66,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  dodgem: {
    id: 'dodgem',
    kind: 'blocker',
    word: 'Shoo!',
    artPx: 210,
    drawScale: 1,
    hitRx: 78,
    hitRy: 52,
    hitOffsetY: 6,
    exitRisePxPerS: 0,
  },
  squirrel: {
    id: 'squirrel',
    kind: 'sitter',
    word: 'Shoo!',
    artPx: 110,
    drawScale: 1.5,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  pigeon: {
    id: 'pigeon',
    kind: 'sitter',
    word: 'Shoo!',
    artPx: 110,
    drawScale: 1,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 150,
  },
  cat: {
    id: 'cat',
    kind: 'sitter',
    word: 'Shoo!',
    artPx: 110,
    drawScale: 1.5,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  seagull: {
    id: 'seagull',
    kind: 'sitter',
    word: 'Shoo!',
    artPx: 110,
    drawScale: 1,
    hitRx: 0,
    hitRy: 0,
    hitOffsetY: 0,
    exitRisePxPerS: 150,
  },
  rubber_duck: {
    id: 'rubber_duck',
    kind: 'treat',
    word: 'Quack!',
    artPx: 110,
    drawScale: 2,
    hitRx: 54,
    hitRy: 46,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  watering_can: {
    id: 'watering_can',
    kind: 'treat',
    word: 'Golden!',
    artPx: 110,
    drawScale: 1,
    hitRx: 54,
    hitRy: 46,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  cupcake: {
    id: 'cupcake',
    kind: 'treat',
    word: 'Yum!',
    artPx: 100,
    drawScale: 1,
    hitRx: 50,
    hitRy: 50,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  piggy_bank: {
    id: 'piggy_bank',
    kind: 'treat',
    word: 'Ka-ching!',
    artPx: 110,
    drawScale: 1,
    hitRx: 56,
    hitRy: 46,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
  candyfloss: {
    id: 'candyfloss',
    kind: 'treat',
    word: 'Yum!',
    artPx: 110,
    drawScale: 1,
    hitRx: 50,
    hitRy: 56,
    hitOffsetY: -6,
    exitRisePxPerS: 0,
  },
  trophy: {
    id: 'trophy',
    kind: 'treat',
    word: 'Winner!',
    artPx: 110,
    drawScale: 1,
    hitRx: 50,
    hitRy: 54,
    hitOffsetY: 0,
    exitRisePxPerS: 0,
  },
};

/** Who may visit each venue: a blocker or two, a sitter, the duck and the venue's own treat. */
export const VENUE_CAST: Readonly<Record<string, readonly VisitorId[]>> = {
  garden: ['bloomers', 'gnome', 'cat', 'rubber_duck', 'watering_can'],
  workshop: ['dust_sheet', 'umbrella', 'squirrel', 'rubber_duck', 'piggy_bank'],
  kitchen: ['tea_towel', 'cat', 'rubber_duck', 'cupcake'],
  funfair: ['balloons', 'dodgem', 'seagull', 'rubber_duck', 'candyfloss'],
  disco: ['flamingo', 'pigeon', 'rubber_duck', 'trophy'],
};

/** Venue used when an id has no cast of its own. */
export const DEFAULT_CAST_VENUE = 'garden';

/** When visitors come, in ms since the first squirt unless stated. */
export const VISIT_SCHEDULE = {
  /** The first two gigs of a venue (index 0 and 1) have none. */
  firstGigIndex: 2,
  /** From this gig index two visitors may be on screen at once. */
  twoLiveFromGigIndex: 5,
  firstDelayMs: { min: 5000, max: 8000 },
  gapMs: { min: 7000, max: 11000 },
  /** Nothing starts this close to the final whistle. */
  noStartLastMs: 3000,
  /** A sitter that found no instrument to land on tries again after this. */
  retryMs: 1500,
} as const;

/** How a visit looks and moves. */
export const VISIT_MOTION = {
  depth: 120,
  /** The warning before a visitor matters: it peeks in, or its shadow appears. */
  telegraphMs: 600,
  /** How much of a mover shows during the peek, as a share of its width. */
  peekFraction: 0.5,
  /** A mover waits this far past the edge (as a share of its width) before it peeks in. */
  offscreenFraction: 0.6,
  /** How big the aim target on a bunch of balloons is, as a share of its width. */
  balloonAimFraction: 0.4,
  backOvershoot: 1.6,
  /** Blockers and treats are laid out inside this margin above and below the wall's own height. */
  edgeMarginPx: 40,
  blockerCrossSeconds: 5,
  blockerBobPx: 10,
  blockerBobHz: 0.8,
  /** Each absorbed hit adds this to a blocker's speed boost; it fades back at `boostDecayPerS`. */
  nudgePerHit: 0.07,
  boostDecayPerS: 0.7,
  boostMax: 4,
  treatCrossSeconds: 2.6,
  treatArcPx: 70,
  treatSpinDegrees: 14,
  treatSpinHz: 1.4,
  /** Pop: the treat swells and fades. */
  popMs: 260,
  popSwell: 1.5,
  /** Wobble when hit: a kick that fades and the rock it makes. */
  kickPerHit: 0.35,
  kickDecayPerS: 3,
  rockRadPerMs: 0.045,
  kickRockRadians: 0.22,
  sitterDropMs: 300,
  sitterDropHeightPx: 110,
  sitterStayMs: 6000,
  sitterExitMs: 800,
  sitterExitPxPerS: 520,
  sitterHopPx: 30,
  sitterHopHz: 3,
  perchSwayPx: 2,
  perchSwayRadPerMs: 0.004,
  /** The sitter perches this far up the instrument's radius. */
  sitterPerchFraction: 0.55,
  sitterHitPadPx: 8,
  sitterShadowAlpha: 0.35,
  sitterShadowPulseHz: 3,
  /** A sitter's hit zone is its instrument's, so water that would reach the instrument reaches the sitter. */
  deflectSoundGapMs: 120,
  /** Balloons: how many, how big, how they hang. */
  balloonCount: 5,
  balloonRadiusPx: 27,
  /** A popped balloon throws this many coins' worth of sparkle. */
  popCoinThrows: 3,
  treatCoinThrows: 9,
  shooCoinThrows: 5,
} as const;

/** Payouts as a share of the gig's third star target, with a floor so a small gig still pays. */
export const VISIT_PAY = {
  treatFraction: 0.08,
  shooFraction: 0.02,
  balloonFraction: 0.01,
  minCoins: 2,
} as const;

/**
 * Hits a sitter takes before it leaves: about 0.7 s of water from the starter
 * gun (about 18 landed hits a second), fewer for each tier above the first so
 * a better gun is a little quicker.
 */
export const SITTER_HITS = {
  base: 13,
  speedupPerTier: 0.1,
  min: 4,
} as const;

/** Where each balloon of the bunch hangs (facing right) and its colour; strings meet at `BALLOON_KNOT`. */
export const BALLOON_LAYOUT: readonly {
  readonly x: number;
  readonly y: number;
  readonly colour: number;
}[] = [
  { x: -48, y: -14, colour: COLOUR.grannyPink },
  { x: -16, y: -48, colour: COLOUR.waterBlue },
  { x: 24, y: -40, colour: COLOUR.sunnyGold },
  { x: 52, y: -6, colour: COLOUR.mintGreen },
  { x: 6, y: -6, colour: COLOUR.heatOrange },
];
export const BALLOON_KNOT = { x: 0, y: 74 } as const;
