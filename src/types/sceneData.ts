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
  /**
   * True when the player has just clicked or tapped something to get here
   * (set by `startRoundAfterAdGate`): the gig then counts itself in. Absent on
   * a first-ever launch and on a review link, which arrive with no click, so
   * the scene asks for a tap first.
   */
  readonly playerClicked?: boolean;
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
  /** Ids of grannies who joined the band because this gig took the stars past their milestone. */
  readonly joinedGrannies?: readonly string[];
}

/** HomeScene → TourScene: which venue's page to open on. Omitted = the one the player is working through. */
export interface TourSceneData {
  readonly venueId?: string;
}

/** HomeScene / TourScene / the `?jam=` link → JamScene: whose Jam, with which Granny. The gun is the one the save has selected. */
export interface JamSceneData {
  readonly worldId: string;
  readonly grannyId: string;
  /** True when a real click led here (see GameSceneData.playerClicked). */
  readonly playerClicked?: boolean;
}
