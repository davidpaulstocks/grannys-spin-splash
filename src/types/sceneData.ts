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
}
