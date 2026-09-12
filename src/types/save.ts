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
