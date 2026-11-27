/**
 * How a visit looks, moves and pays: every timing, size and payout of the
 * visitors that is not about who they are (visitor.data.ts) or when they
 * come. One place to tune.
 */

import { COLOUR } from '../../utils/colour';

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
  blockerBobPx: 10,
  blockerBobHz: 0.8,
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

/** A blocker parks over a cluster of instruments, silences them and takes water until it has had enough. */
export const BLOCKER = {
  /** Hits (landed water particles) to shift one, before the gig's own share. */
  baseHits: 28,
  /** Plus this many for each gig index of the venue (gig 1 is index 0). */
  hitsPerGigIndex: 2,
  /** It glides from its peek to its parking spot in this long. */
  glideMs: 900,
  /** It leaves by itself after parking this long. */
  stayMs: 7000,
  /** Instruments it covers: the one it lands on and this many neighbours at most (so 2 to 3 in all). */
  clusterSize: { min: 2, max: 3 },
  /** Neighbours must be within this many instrument radii of the seed to be covered with it. */
  neighbourReachRadii: 3.2,
  /** The picture is this much wider than the cluster it covers. */
  coverFactor: 1.25,
  /**
   * A covered instrument that was at full speed counts as falling out of it
   * this long after the blocker parks, and each further one this much later
   * (a silenced instrument is frozen, so the wind-down is counted for it).
   */
  coverDropMs: 1500,
  dropStaggerMs: 350,
  /** Water within this of a covered instrument's edge is the blocker's, px. */
  coverPadPx: 10,
  /** As hits land it slides up to this many px towards where it will leave, so it is seen to give way. */
  slideMaxPx: 40,
  /** A hit's sideways shove, px, fading on its own. */
  shovePx: 9,
  shoveDecayPerS: 6,
  /** Squash on a hit: the width swell and height squash, fading with the kick. */
  squashDepth: 0.14,
  /** The drain ring around it: radius beyond the cluster, thickness, track alpha. */
  meterGapPx: 10,
  meterPx: 8,
  meterTrackAlpha: 0.25,
  /** The cleared blocker spins off: turns per second, and how fast it goes. */
  spinOffTurnsPerS: 2,
  /** The ring's aim target: the cluster's radius plus this, px. */
  aimPadPx: 24,
} as const;

/** A thief takes coins from the gig's total while it sits, and gives them back when shooed. */
export const THIEF = {
  /** How often it steals, ms. */
  tickMs: 500,
  /** A tick steals the larger of this and `starShare` of the gig's third star target. */
  minPerTick: 5,
  starShare: 0.006,
  arrivalWord: 'Thief!',
  returnWord: 'Got it back!',
  /** Coins flying from the counter to the thief per tick, and thrown back when it is shooed. */
  stealFlyCoins: 2,
  returnCoinThrows: 8,
  /** Where the loot number rides over its head, px above the origin, and its pop on each steal. */
  lootLiftPx: 62,
  lootPop: 1.35,
  lootPopMs: 140,
} as const;
