/** Scene-to-scene transition payloads — shared between whichever scenes start/read them. CLAUDE.md §7.3 rule 12. */

/** SplashScene → GameScene: which loadout to play with. */
export interface GameSceneData {
  readonly grannyId: string;
  readonly gunId: string;
  /** Upgrade level to fire the gun at. Omitted = the level the save holds (the balance bot passes 1). */
  readonly gunLevel?: number;
  readonly worldId: string;
  /** 0-based gig on the venue's ladder. Omitted = the first gig not yet passed. */
  readonly gig?: number;
}

/** GameScene → ResultsScene: the just-finished run's result. */
export interface GigResultData {
  readonly score: number;
  /** Which world was played — so the end screen can name the best it's comparing against. */
  readonly worldId: string;
  /** This gig's best coin total BEFORE this run (0 = never played), so the end screen can show what was beaten. */
  readonly previousBest: number;
  /** True when this run beat that best (see SaveData.gigBest). */
  readonly isNewBest: boolean;
  /** Coin totals that earn one, two and three stars on this gig. */
  readonly targets: readonly [number, number, number];
  /** How many spinners reached FULL at once at the peak, and out of how many. */
  readonly peakFullSpinners: number;
  readonly totalSpinners: number;
  /** Whether SPLASH FRENZY triggered at least once. */
  readonly reachedFrenzy: boolean;
  /** 0-based gig just played, the stars earned on it (0–3), and how many of those were new. */
  readonly gig: number;
  readonly stars: number;
  readonly newStars: number;
  /** Coins paid for the new stars, on top of `score`. */
  readonly starCoins: number;
}

/** HomeScene → TourScene: which venue's page to open on. Omitted = the one the player is working through. */
export interface TourSceneData {
  readonly venueId?: string;
}
