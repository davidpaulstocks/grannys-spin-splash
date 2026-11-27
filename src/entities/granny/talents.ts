/** Turning a granny's id into the `GrannyTalents` the mechanics read. */

import { GRANNY_LADDER_DEFS } from './granny.data';
import type { GrannyTalents } from './granny.types';

/** No talent at all: every multiplier 1. What every module defaults to, so nothing needs a granny to run. */
export const NO_TALENTS: GrannyTalents = {
  holdFullSpeed: 1,
  tankSize: 1,
  frenzyLength: 1,
  treatPay: 1,
  shooHits: 1,
  bigFinish: 1,
};

/** The talents of granny `grannyId`; `NO_TALENTS` for an unknown id. */
export function talentsFor(grannyId: string | undefined): GrannyTalents {
  const def = GRANNY_LADDER_DEFS.find((g) => g.id === grannyId);
  return def ? { ...NO_TALENTS, ...def.talent.effect } : NO_TALENTS;
}

/** How many hits it takes to shoo a thief or a blocker that needs `hits` as standard: fewer for Sharp eye, never below one. */
export function shooHits(hits: number, talents: GrannyTalents = NO_TALENTS): number {
  return Math.max(1, Math.round(hits * talents.shooHits));
}
