import { describe, expect, it } from 'vitest';

import { VENUE_CAST, VISIT_SCHEDULE, VISITOR_DEFS } from '../../src/entities/visitor/visitor.data';
import {
  VISITOR_IDS,
  type VisitorId,
  type VisitorKind,
} from '../../src/entities/visitor/visitor.types';
import {
  castFor,
  hasVisitors,
  maxLiveVisitors,
  pickVisitor,
  VisitorSchedule,
  type RandomFn,
  type ScheduleContext,
} from '../../src/entities/visitor/visitorSchedule';

/** A small deterministic generator, so a failing run can be repeated. */
function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const RUNNING: ScheduleContext = {
  started: true,
  frenzyActive: false,
  timeRemainingMs: 30000,
  liveCount: 0,
};

/** Runs a schedule in 100 ms steps and returns when (ms since the start) each visitor was sent. */
function runVisits(
  schedule: VisitorSchedule,
  seconds: number,
  ctx: (elapsedMs: number) => ScheduleContext,
): { at: number; id: VisitorId }[] {
  const sent: { at: number; id: VisitorId }[] = [];
  for (let ms = 100; ms <= seconds * 1000; ms += 100) {
    const id = schedule.update(100, ctx(ms));
    if (id) sent.push({ at: ms, id });
  }
  return sent;
}

describe('the cast', () => {
  it('has the eighteen visitors, each in at least one venue', () => {
    expect(VISITOR_IDS).toHaveLength(18);
    const used = new Set(Object.values(VENUE_CAST).flat());
    for (const id of VISITOR_IDS) expect(used.has(id)).toBe(true);
  });

  it('gives every venue a blocker, a sitter and at least one treat', () => {
    for (const [venue, cast] of Object.entries(VENUE_CAST)) {
      const kinds = cast.map((id) => VISITOR_DEFS[id].kind);
      expect(kinds, venue).toContain('blocker');
      expect(kinds, venue).toContain('sitter');
      expect(kinds, venue).toContain('treat');
      expect(cast, venue).toContain('rubber_duck');
    }
  });

  it('borrows the garden cast for a venue it does not know', () => {
    expect(castFor('nowhere')).toEqual(castFor('garden'));
  });
});

describe('choosing who comes', () => {
  it('never picks the same visitor twice running', () => {
    const random = seeded(7);
    for (const venue of Object.keys(VENUE_CAST)) {
      let last: VisitorId | null = null;
      for (let i = 0; i < 400; i++) {
        const id = pickVisitor(castFor(venue), last, random);
        expect(id).not.toBeNull();
        expect(id).not.toBe(last);
        last = id;
      }
    }
  });

  // Garden has two treats but one blocker and one sitter, and the same visitor never
  // comes twice running, so the treats take a little more than a third.
  it('makes the three kinds roughly equally likely', () => {
    const random = seeded(11);
    const counts: Record<VisitorKind, number> = { blocker: 0, sitter: 0, treat: 0 };
    let last: VisitorId | null = null;
    const runs = 6000;
    for (let i = 0; i < runs; i++) {
      last = pickVisitor(castFor('garden'), last, random);
      if (last) counts[VISITOR_DEFS[last].kind]++;
    }
    for (const kind of ['blocker', 'sitter', 'treat'] as const) {
      expect(counts[kind] / runs).toBeGreaterThan(0.25);
      expect(counts[kind] / runs).toBeLessThan(0.46);
    }
  });

  it('returns null for an empty cast', () => {
    expect(pickVisitor([], null, Math.random)).toBeNull();
  });
});

describe('when they come', () => {
  it("sends none in a venue's first two gigs", () => {
    expect(hasVisitors(0)).toBe(false);
    expect(hasVisitors(1)).toBe(false);
    expect(hasVisitors(2)).toBe(true);
    for (const gig of [0, 1]) {
      const schedule = new VisitorSchedule(castFor('garden'), gig, seeded(3));
      expect(runVisits(schedule, 120, () => RUNNING)).toHaveLength(0);
    }
  });

  it('does not start its clock before the first squirt', () => {
    const schedule = new VisitorSchedule(castFor('garden'), 3, seeded(3));
    const idle = { ...RUNNING, started: false };
    expect(runVisits(schedule, 60, () => idle)).toHaveLength(0);
    const sent = runVisits(schedule, 12, () => RUNNING);
    expect(sent.length).toBeGreaterThan(0);
  });

  it('sends the first visitor 5 to 8 seconds in, then one every 7 to 11', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const schedule = new VisitorSchedule(castFor('kitchen'), 4, seeded(seed));
      const sent = runVisits(schedule, 90, () => RUNNING);
      const first = sent[0];
      expect(first?.at).toBeGreaterThanOrEqual(VISIT_SCHEDULE.firstDelayMs.min);
      expect(first?.at).toBeLessThanOrEqual(VISIT_SCHEDULE.firstDelayMs.max + 100);
      for (let i = 1; i < sent.length; i++) {
        const gap = (sent[i]?.at ?? 0) - (sent[i - 1]?.at ?? 0);
        expect(gap).toBeGreaterThanOrEqual(VISIT_SCHEDULE.gapMs.min);
        expect(gap).toBeLessThanOrEqual(VISIT_SCHEDULE.gapMs.max + 100);
        expect(sent[i]?.id).not.toBe(sent[i - 1]?.id);
      }
    }
  });

  it('starts nothing in the last three seconds', () => {
    const schedule = new VisitorSchedule(castFor('garden'), 3, seeded(5));
    const sent = runVisits(schedule, 60, (ms) => ({
      ...RUNNING,
      timeRemainingMs: 3000 - (ms - 57000),
    }));
    // The ctx says 3 s or less remain only after 57 s; nothing may be sent then.
    for (const visit of sent) expect(visit.at).toBeLessThan(57000);
  });

  it('waits out Splash Frenzy and then sends the visitor that was due', () => {
    const schedule = new VisitorSchedule(castFor('garden'), 3, seeded(9));
    const during = runVisits(schedule, 20, () => ({ ...RUNNING, frenzyActive: true }));
    expect(during).toHaveLength(0);
    expect(schedule.update(100, RUNNING)).not.toBeNull();
  });

  it('allows one at a time, and two from the sixth gig', () => {
    expect(maxLiveVisitors(2)).toBe(1);
    expect(maxLiveVisitors(4)).toBe(1);
    expect(maxLiveVisitors(5)).toBe(2);
    const one = new VisitorSchedule(castFor('garden'), 3, seeded(2));
    expect(runVisits(one, 60, () => ({ ...RUNNING, liveCount: 1 }))).toHaveLength(0);
    const two = new VisitorSchedule(castFor('garden'), 5, seeded(2));
    expect(runVisits(two, 60, () => ({ ...RUNNING, liveCount: 1 })).length).toBeGreaterThan(0);
    const full = new VisitorSchedule(castFor('garden'), 5, seeded(2));
    expect(runVisits(full, 60, () => ({ ...RUNNING, liveCount: 2 }))).toHaveLength(0);
  });

  it('asks again soon when a sitter finds nothing to land on', () => {
    const schedule = new VisitorSchedule(castFor('garden'), 3, seeded(4));
    runVisits(schedule, 9, () => RUNNING);
    schedule.retrySoon();
    const sent = runVisits(schedule, 2, () => RUNNING);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.at).toBeGreaterThanOrEqual(VISIT_SCHEDULE.retryMs);
  });
});
