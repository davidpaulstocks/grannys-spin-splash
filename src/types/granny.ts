/** GrannyDef — character roster shape. CLAUDE.md §7.2, §8.1. */

export interface GrannyDef {
  readonly id: string;
  readonly name: string;
  /** Base sprite key for the standing pose; `${spriteKey}_firing` is the firing pose. */
  readonly spriteKey: string;
  /** Stars required to unlock; 0 means available from first run. */
  readonly unlockCost: number;
}
