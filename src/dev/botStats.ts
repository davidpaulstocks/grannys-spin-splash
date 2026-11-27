/** Averages a batch case's runs for the dev balance bot (botSim.ts). */

import type { BatchCase, BatchRow, RunResult } from './botTypes';

const HUNDRED = 100;

/** Mean coins and stars, the share of runs with a star, the share with three, and each run's coins. */
export function summarise(c: BatchCase, results: readonly RunResult[]): BatchRow {
  const runs = results.length;
  const mean = (pick: (r: RunResult) => number): number =>
    results.reduce((sum, r) => sum + pick(r), 0) / runs;
  const share = (test: (r: RunResult) => boolean): number =>
    Math.round((results.filter(test).length / runs) * HUNDRED) / HUNDRED;
  return {
    venue: c.venue,
    gig: c.gig,
    gun: c.gun,
    profile: c.profile,
    runs,
    coinList: results.map((r) => r.coins),
    starList: results.map((r) => r.stars),
    coins: Math.round(mean((r) => r.coins)),
    stars: Math.round(mean((r) => r.stars) * HUNDRED) / HUNDRED,
    pass: share((r) => r.stars >= 1),
    three: share((r) => r.stars >= 3),
  };
}
