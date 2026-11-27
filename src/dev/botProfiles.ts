/** The scripted players of the dev balance bot (botSim.ts): how fast they move, how often they miss, what they notice. */

export interface BotProfile {
  /** Time lost between deciding to move and the water arriving on the next spinner. */
  readonly reactMs: number;
  /** Chance a move lands on its spinner at all. */
  readonly skill: number;
  /** Longest it will stay on one spinner before giving up and moving on. */
  readonly maxDwell: number;
  /** Chance it notices a given visitor at all (a thief, a blocker, a treat). */
  readonly notice: number;
}

/** A seven-year-old: slow to move, sometimes misses, sticks at a spinner, misses four visitors in ten. */
export const CHILD: BotProfile = { reactMs: 450, skill: 0.85, maxDwell: 1800, notice: 0.6 };
/** A sharp, practised player who sees every visitor. */
export const KEEN: BotProfile = { reactMs: 180, skill: 0.97, maxDwell: 1400, notice: 1 };
/** An adult who plays as well as a person reasonably can (the owner played about this well). */
export const EXPERT: BotProfile = { reactMs: 120, skill: 1, maxDwell: 1400, notice: 1 };

/** The profiles by the name a batch case uses. */
export const PROFILES: Readonly<Record<string, BotProfile>> = {
  child: CHILD,
  keen: KEEN,
  expert: EXPERT,
};
