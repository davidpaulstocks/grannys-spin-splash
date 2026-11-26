/**
 * The gig ladder — docs/ENGAGEMENT_DESIGN.md §3. Each venue (world) is eight
 * gigs: the first is a small band on big spinners, each one after adds
 * musicians, and the eighth is the whole wall, the Grand Concert.
 *
 * Band sizes are authored per venue, and the band *is* the difficulty: more
 * musicians means more to keep going at once. Each spinner's wind-down is
 * therefore slowed as the band grows — otherwise a twelve-piece is not hard
 * but impossible — and nudged up a notch per venue, by which point the
 * player is expected to have bought a better gun. One place to tune; the
 * numbers were set against a bot that plays like a child (see gun.data.ts).
 */

import type { ObstacleKind } from '../obstacle/obstacle.types';
import { FRENZY_THRESHOLDS } from '../spinner/spinner.data';
import { WORLD_DEFS } from './world.data';
import type { WorldDef } from './world.types';

export const GIGS_PER_VENUE = 8;

export interface GigDef {
  readonly venueId: string;
  /** 0-based position on the venue's ladder. */
  readonly index: number;
  /** How many spinners are on the wall, the venue's feature spinner included. */
  readonly band: number;
  readonly seconds: number;
  /** Multiplier on every spinner's wind-down rate. */
  readonly decayScale: number;
  /** How long a topped-up spinner holds before it starts winding down. */
  readonly holdMs: number;
  readonly obstacles: readonly ObstacleKind[];
  /** How many spinners drift side to side. */
  readonly moving: number;
  /** Whether the venue's painted centrepiece (Disco's mirror ball) is in play. */
  readonly feature: boolean;
}

/** Spinners on the wall for each gig, by venue. The last is always the venue's full grid. */
const BAND_LADDER: Readonly<Record<string, readonly number[]>> = {
  garden: [3, 4, 5, 6, 8, 9, 10, 12],
  workshop: [4, 5, 6, 8, 9, 10, 12, 15],
  kitchen: [4, 6, 8, 9, 10, 12, 14, 16],
  funfair: [4, 6, 8, 9, 10, 12, 14, 16],
  disco: [5, 6, 8, 10, 12, 15, 18, 20],
};

/** Round length by gig: the first gigs are quick wins, the rest run the full thirty seconds. */
const SECONDS_BY_GIG = [20, 20, 25, 25, 30, 30, 30, 30] as const;

/**
 * Wind-down runs at full rate for bands up to this size, then slows faster
 * than in proportion. Holding a band is not just more spinners to top up:
 * every extra one is also more travel between them, during which all the
 * others are winding down.
 *
 * Set against a commit-then-move bot on the starter gun. The knee is low
 * (four) because the mid-sized bands were the wall: with full-rate wind-down
 * up to six, an eight-piece was harder than a fifteen-piece. From four, a
 * child-speed bot three-stars the small bands, gets two or three on the
 * middle ones, and passes the Grand Concert with one or two; a sharp one
 * three-stars the Grand Concert near the end.
 */
const FULL_DECAY_BAND = 4;
const DECAY_FALLOFF = 1.6;
/**
 * Later venues do not wind down any faster. They are already harder in ways
 * Garden is not — obstacles that block water, whirligigs that deflect it,
 * drifting targets — and stacking a faster wind-down on top left the
 * Workshop's middle gigs at one star for every bot, with any gun.
 */
const DECAY_GAIN_PER_VENUE = 0;
/**
 * How long a topped-up spinner holds before winding down at all, and how
 * fast it then goes, as a multiple of each spinner's own rate.
 *
 * Tightened 2026-11-26 (David: "when you get the instrument started it then
 * just is going... maybe you need to be in a bit more of a rush to go back
 * and re-spin it. Should the spinners lose momentum a little bit more?").
 * The hold was 2.5 s and the rate 1x, which left a trio playing untouched
 * for five seconds and a twelve-piece for twelve. Affordable now because
 * aiming is quicker: the water always finds an instrument and flies faster.
 */
const HOLD_MS = 1200;
const DECAY_RATE = 1.6;
/** Bigger bands get a little longer: there is further to travel before coming back round. */
const HOLD_MS_PER_EXTRA_MUSICIAN = 120;
const HOLD_MS_MAX = 2400;

/** Drifting spinners arrive one at a time through a venue's later gigs, up to this many. */
const MAX_MOVING = 3;

function ladderFor(venueId: string): readonly number[] {
  return BAND_LADDER[venueId] ?? BAND_LADDER.garden ?? [];
}

/** The gig at `index` (clamped to the ladder) in `world`. */
export function gigFor(world: WorldDef, index: number): GigDef {
  const gig = Math.min(GIGS_PER_VENUE - 1, Math.max(0, Math.floor(index)));
  const venueTier = Math.max(0, WORLD_DEFS.indexOf(world));
  const progress = gig / (GIGS_PER_VENUE - 1);
  const isFinal = gig === GIGS_PER_VENUE - 1;
  const feature = isFinal && world.featureSpinner !== undefined;
  const grid = ladderFor(world.id)[gig] ?? world.grid.cols * world.grid.rows;

  // Obstacles join through the ladder: none at the first gig, the venue's
  // whole roster by the last.
  const obstacleCount = Math.round(world.obstacles.length * progress);

  return {
    venueId: world.id,
    index: gig,
    band: grid + (feature ? 1 : 0),
    seconds: SECONDS_BY_GIG[gig] ?? world.time,
    decayScale:
      DECAY_RATE *
      Math.min(1, Math.pow(FULL_DECAY_BAND / grid, DECAY_FALLOFF)) *
      (1 + DECAY_GAIN_PER_VENUE * venueTier),
    holdMs: Math.min(
      HOLD_MS_MAX,
      HOLD_MS + HOLD_MS_PER_EXTRA_MUSICIAN * Math.max(0, grid - FULL_DECAY_BAND),
    ),
    obstacles: world.obstacles.slice(0, obstacleCount),
    moving: world.movingTargets ? Math.min(MAX_MOVING, Math.floor(gig / 2)) : 0,
    feature,
  };
}

/** Musicians who join at this gig — its band minus the previous gig's. All of them at the first gig. */
export function newMusicianCount(world: WorldDef, index: number): number {
  const here = gigFor(world, index).band;
  return index <= 0 ? here : here - gigFor(world, index - 1).band;
}

/**
 * How many of a band must be wide awake at once for one, two and three
 * stars. The same thresholds `FrenzyMeter` fires on, expressed as a head
 * count so the HUD and the goal card can say "4 awake" instead of "80%".
 * Small bands skip a star: a trio needs two for the first and all three for
 * both the second and third.
 */
export function awakeNeededForStars(band: number): readonly [number, number, number] {
  const needed = (fraction: number): number => Math.max(1, Math.ceil(fraction * band - 1e-9));
  return [
    needed(FRENZY_THRESHOLDS.miniLow),
    needed(FRENZY_THRESHOLDS.miniHigh),
    needed(FRENZY_THRESHOLDS.full),
  ];
}
