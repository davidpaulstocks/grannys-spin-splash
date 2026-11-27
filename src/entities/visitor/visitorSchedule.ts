/**
 * When a visitor comes, and which one. Pure logic with an injectable random
 * function, so the rules can be tested without a scene (CLAUDE.md §7.3 rule 10).
 *
 * The rules: visitors come from a venue's very first gig (David, 2026-11-27:
 * "you only get one chance to make it fun from the beginning"); the first
 * visitor comes a few seconds after the first squirt and then one every so
 * often; in a venue's first gig the first one is always a treat; the kinds (blocker, sitter, treat) are about equally likely and the
 * same visitor never comes twice running; one at a time, two from a later gig;
 * nothing starts near the final whistle or during Splash Frenzy.
 */

import { DEFAULT_CAST_VENUE, VENUE_CAST, VISIT_SCHEDULE, VISITOR_DEFS } from './visitor.data';
import type { VisitorId, VisitorKind } from './visitor.types';

/** A source of numbers in [0, 1) — `Math.random` in the game, a fixed sequence in tests. */
export type RandomFn = () => number;

/** Who may visit `venueId`. */
export function castFor(venueId: string): readonly VisitorId[] {
  return VENUE_CAST[venueId] ?? VENUE_CAST[DEFAULT_CAST_VENUE] ?? [];
}

/** True if a gig at `gigIndex` has visitors at all. */
export function hasVisitors(gigIndex: number): boolean {
  return gigIndex >= VISIT_SCHEDULE.firstGigIndex;
}

/** How many visitors may be on screen at once in a gig. */
export function maxLiveVisitors(gigIndex: number): number {
  return gigIndex >= VISIT_SCHEDULE.twoLiveFromGigIndex ? 2 : 1;
}

function between(range: { readonly min: number; readonly max: number }, random: RandomFn): number {
  return range.min + random() * (range.max - range.min);
}

/**
 * Picks who comes next: a kind first (so each kind is about as likely as
 * another however many of it the cast has), then one of that kind, never
 * `last`. Returns null for an empty cast.
 */
export function pickVisitor(
  cast: readonly VisitorId[],
  last: VisitorId | null,
  random: RandomFn,
): VisitorId | null {
  const allowed = cast.filter((id) => id !== last);
  const kinds = [...new Set(allowed.map((id) => VISITOR_DEFS[id].kind))];
  const kind: VisitorKind | undefined =
    kinds[Math.min(kinds.length - 1, Math.floor(random() * kinds.length))];
  if (!kind) return null;
  const ofKind = allowed.filter((id) => VISITOR_DEFS[id].kind === kind);
  return ofKind[Math.min(ofKind.length - 1, Math.floor(random() * ofKind.length))] ?? null;
}

/** What the schedule needs to know each frame. */
export interface ScheduleContext {
  /** False until the first squirt. */
  readonly started: boolean;
  readonly frenzyActive: boolean;
  readonly timeRemainingMs: number;
  readonly liveCount: number;
}

/** One gig's timetable of visits. */
export class VisitorSchedule {
  private _elapsedMs = 0;
  private _nextAtMs: number;
  private _last: VisitorId | null = null;
  private _sent = 0;

  constructor(
    private readonly _cast: readonly VisitorId[],
    private readonly _gigIndex: number,
    private readonly _random: RandomFn = Math.random,
  ) {
    this._nextAtMs = between(VISIT_SCHEDULE.firstDelayMs, _random);
  }

  /**
   * Advances the clock (only once the gig has started) and returns who should
   * start now, or null. A visit that cannot start yet — one already out,
   * Frenzy on, too near the end — waits rather than being skipped.
   */
  update(deltaMs: number, ctx: ScheduleContext): VisitorId | null {
    if (!ctx.started || !hasVisitors(this._gigIndex)) return null;
    this._elapsedMs += deltaMs;
    if (this._elapsedMs < this._nextAtMs) return null;
    if (ctx.frenzyActive || ctx.timeRemainingMs <= VISIT_SCHEDULE.noStartLastMs) return null;
    if (ctx.liveCount >= maxLiveVisitors(this._gigIndex)) return null;
    const id = pickVisitor(this._castForNext(), this._last, this._random);
    if (!id) return null;
    this._last = id;
    this._sent++;
    this._nextAtMs = this._elapsedMs + between(VISIT_SCHEDULE.gapMs, this._random);
    return id;
  }

  /** Everyone, or only the treats for the opening visit of a venue's first gig. */
  private _castForNext(): readonly VisitorId[] {
    if (this._sent > 0 || this._gigIndex > VISIT_SCHEDULE.treatFirstUntilGigIndex)
      return this._cast;
    const treats = this._cast.filter((id) => VISITOR_DEFS[id].kind === 'treat');
    return treats.length > 0 ? treats : this._cast;
  }

  /** A visit that could not happen (a sitter with nothing to sit on) asks to try again soon. */
  retrySoon(): void {
    this._nextAtMs = this._elapsedMs + VISIT_SCHEDULE.retryMs;
    this._last = null;
  }
}
