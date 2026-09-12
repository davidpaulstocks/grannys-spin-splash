/** Scene-to-scene transition payloads — shared between whichever scenes start/read them. CLAUDE.md §7.3 rule 12. */

/** SplashScene → GameScene: which loadout to play with. */
export interface GameSceneData {
  readonly grannyId: string;
  readonly gunId: string;
  readonly worldId: string;
}

/** GameScene → GameOverScene: the just-finished run's result. */
export interface GameOverData {
  readonly score: number;
  /** Which world was played — so the end screen can name the best it's comparing against. */
  readonly worldId: string;
  /** The best for that world BEFORE this run, so the end screen can show what was beaten. */
  readonly previousBest: number;
  /** True when this run set a new best for that world (see SaveData.bestByWorld). */
  readonly isNewBest: boolean;
  /** How many spinners reached FULL at once at the peak, and out of how many. */
  readonly peakFullSpinners: number;
  readonly totalSpinners: number;
  /** Whether SPLASH FRENZY triggered at least once. */
  readonly reachedFrenzy: boolean;
}
