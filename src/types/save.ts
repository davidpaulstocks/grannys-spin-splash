/** SaveData v1 schema + migration types. CLAUDE.md §7.2. */

export const SAVE_VERSION = 1 as const;

export interface SaveData {
  /** Bump when introducing breaking schema changes; SaveManager migrates older payloads. */
  readonly version: typeof SAVE_VERSION;
  /** Total stars in the Granny Gold Vault (earn-only, never purchasable — §11.4). */
  vault: number;
  unlockedGrannies: readonly string[];
  unlockedGuns: readonly string[];
  unlockedWorlds: readonly string[];
  selectedGrannyId: string;
  selectedGunId: string;
  selectedWorldId: string;
  highScore: number;
  /**
   * Best score per world id (2026-09-12). The game has no fail state by
   * design — the 6-year-old playtest that greenlit it said "every single
   * day" about a game you cannot lose — so a personal best is what gives an
   * individual run a stake without ever punishing a child: you can only
   * not-beat-it-yet. Per world rather than global because the worlds differ
   * enough in spinner count that one global number would make the bigger
   * worlds the only ones worth playing.
   *
   * Absent from older saves; `SaveManager`'s default-merge fills in `{}`, so
   * no migration is needed.
   */
  bestByWorld: Record<string, number>;
  /**
   * False until the player fires for the first time. Drives the one-time
   * onboarding in CLAUDE.md §6.5 (splash hint + in-game ghost finger) and
   * nothing else, so it never needs to be accurate about anything beyond
   * "has this person ever played".
   */
  hasPlayed: boolean;
}

export interface SaveMigration<From, To> {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate: (input: From) => To;
}
