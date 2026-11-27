/** GrannyDef — character roster shape. CLAUDE.md §7.2, §8.1. */

/** front = splash-carousel portrait; back/back_firing = actual gameplay sprites (CLAUDE.md §14, 2026-09-11 re-plan). */
export type GrannyPose = 'front' | 'back' | 'back_firing';

/**
 * What a granny's talent changes in play, as small named multipliers (1 = no change). Each is read
 * once, by the module that owns the mechanic: the wall builder (hold), the water cannon (tank), the
 * Frenzy controller (length), the visitor director (treat pay, shoo hits) and the Big Finish (bonus).
 */
export interface GrannyTalents {
  /** How long a topped-up instrument holds full speed before it starts winding down. */
  readonly holdFullSpeed: number;
  /** The size of the water tank. */
  readonly tankSize: number;
  /** How long Splash Frenzy lasts. */
  readonly frenzyLength: number;
  /** What a treat pays. */
  readonly treatPay: number;
  /** How many hits a thief or a blocker needs before it is shooed (below 1 = fewer). */
  readonly shooHits: number;
  /** How big the Big Finish bow bonus is. */
  readonly bigFinish: number;
}

/** Her one talent, said in one line. */
export interface GrannyTalent {
  readonly id: string;
  /** Short name: "Steady hands". */
  readonly name: string;
  /** One line of what it does: "Instruments hold full speed 20% longer." */
  readonly line: string;
  /** The multipliers it sets; every other one stays at 1. */
  readonly effect: Partial<GrannyTalents>;
}

export interface GrannyDef {
  readonly id: string;
  readonly name: string;
  /** Base sprite key for the standing pose; `${spriteKey}_firing` is the firing pose. */
  readonly spriteKey: string;
  /** Total stars at which she joins the band; 0 means available from first run. Stars are never spent. */
  readonly starsToJoin: number;
  readonly talent: GrannyTalent;
}
