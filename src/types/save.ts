/** SaveData v1 schema + migration types. CLAUDE.md §7.2. */

export const SAVE_VERSION = 1 as const;

export interface SaveData {
  /** Bump when introducing breaking schema changes; SaveManager migrates older payloads. */
  readonly version: typeof SAVE_VERSION;
  /** Total stars in the Granny Gold Vault (earn-only, never purchasable — §11.4). */
  vault: number;
  unlockedGrannies: readonly string[];
  unlockedGuns: readonly string[];
  selectedGrannyId: string;
  selectedGunId: string;
  highScore: number;
}

export interface SaveMigration<From, To> {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate: (input: From) => To;
}
