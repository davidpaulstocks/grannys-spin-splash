/**
 * The roster of grannies. Each has one talent that changes play a little (a named multiplier in
 * `GrannyTalents`, see talents.ts) and joins the band when the player's total stars reach her
 * milestone: stars are a rating and are never spent, coins never buy a granny. Three more are
 * planned (joy, priya, mei); they are written here with their talents so the rules can be tested, but
 * they are not offered, and load no pictures, until their art is switched on in `GRANNY_ART_READY`.
 */

import type { GrannyDef } from './granny.types';

/** Talent strengths: each is a multiplier on one mechanic. Balance was measured without any of them. */
export const STEADY_HANDS_HOLD = 1.2;
export const BIG_TANK_SIZE = 1.3;
export const LOUD_FRENZY_LENGTH = 1.3;
export const CROWD_PLEASER_TREAT_PAY = 2;
export const SHARP_EYE_SHOO_HITS = 0.65;
export const BIG_FINISH_BONUS = 1.5;

/** Total stars at which each granny joins (classic and squirt are free). */
export const PUNK_STARS_TO_JOIN = 20;
export const JOY_STARS_TO_JOIN = 40;
export const PRIYA_STARS_TO_JOIN = 70;
export const MEI_STARS_TO_JOIN = 100;

/** All six grannies, in the order they join. The game uses `GRANNY_DEFS`. */
export const GRANNY_LADDER_DEFS: readonly GrannyDef[] = [
  {
    id: 'classic',
    name: 'Classic Granny',
    spriteKey: 'granny_classic',
    starsToJoin: 0,
    talent: {
      id: 'steady_hands',
      name: 'Steady hands',
      line: 'Instruments hold full speed 20% longer',
      effect: { holdFullSpeed: STEADY_HANDS_HOLD },
    },
  },
  {
    id: 'squirt',
    name: 'Nana Storm',
    spriteKey: 'granny_squirt',
    starsToJoin: 0,
    talent: {
      id: 'big_tank',
      name: 'Big tank',
      line: 'Her water tank is 30% bigger',
      effect: { tankSize: BIG_TANK_SIZE },
    },
  },
  {
    id: 'punk',
    name: 'Punk Granny',
    spriteKey: 'granny_punk',
    starsToJoin: PUNK_STARS_TO_JOIN,
    talent: {
      id: 'loud',
      name: 'Loud',
      line: 'Splash Frenzy lasts 30% longer',
      effect: { frenzyLength: LOUD_FRENZY_LENGTH },
    },
  },
  {
    id: 'joy',
    name: 'Nana Joy',
    spriteKey: 'granny_joy',
    starsToJoin: JOY_STARS_TO_JOIN,
    talent: {
      id: 'crowd_pleaser',
      name: 'Crowd-pleaser',
      line: 'Treats pay double',
      effect: { treatPay: CROWD_PLEASER_TREAT_PAY },
    },
  },
  {
    id: 'priya',
    name: 'Nani Priya',
    spriteKey: 'granny_priya',
    starsToJoin: PRIYA_STARS_TO_JOIN,
    talent: {
      id: 'sharp_eye',
      name: 'Sharp eye',
      line: 'Thieves and blockers need 35% fewer hits',
      effect: { shooHits: SHARP_EYE_SHOO_HITS },
    },
  },
  {
    id: 'mei',
    name: 'Grandma Mei',
    spriteKey: 'granny_mei',
    starsToJoin: MEI_STARS_TO_JOIN,
    talent: {
      id: 'big_finish',
      name: 'Big finish',
      line: 'The Big Finish bow bonus is 50% bigger',
      effect: { bigFinish: BIG_FINISH_BONUS },
    },
  },
];

/**
 * Which grannies have been painted and shipped (public/sprites/grannies/<id>/{front,back,back_firing}.webp).
 * One not listed is left out of the game entirely: no Shop slot, no milestone, no texture loaded. To
 * switch one on, drop her three pictures in and add her id here.
 */
export const GRANNY_ART_READY: readonly string[] = ['classic', 'squirt', 'punk', 'joy', 'priya', 'mei'];

/** The grannies that exist in the game today: the roster, minus any whose art is not yet painted. */
export const GRANNY_DEFS: readonly GrannyDef[] = GRANNY_LADDER_DEFS.filter((g) =>
  GRANNY_ART_READY.includes(g.id),
);

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GRANNY_ID = 'classic';
