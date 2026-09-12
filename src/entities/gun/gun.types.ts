/** GunDef, AnchorJSON shape, GunTier. CLAUDE.md §7.2, §8.2. */

export type GunTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type GunType = 'water' | 'fire';

/** The 8 sprite rotation angles. */
export type GunAngle = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

/**
 * Per-angle nozzle position (where water/fire emits from in the gun PNG).
 * Authored manually by the anchor-picker tool (CLAUDE.md §8.3.1 step 4).
 */
export type AnchorJSON = Readonly<
  Record<`${GunAngle}`, { readonly x: number; readonly y: number }>
>;

export interface GunDef {
  readonly id: string;
  readonly name: string;
  readonly spriteKey: string;
  readonly tier: GunTier;
  /** Stars required to unlock; 0 means available from first run. */
  readonly cost: number;
  /** Maximum water-tank capacity. */
  readonly tank: number;
  /** Water drained per shot. */
  readonly drain: number;
  /** Water added per pump-refill click. */
  readonly pump: number;
  /** Milliseconds between auto-shots while firing held. */
  readonly interval: number;
  /** Speed boost imparted to a spinner on hit. */
  readonly power: number;
  /** Number of water streams per shot. */
  readonly streams: number;
  /** Particle size in px. */
  readonly sz: number;
  readonly type: GunType;
  /**
   * Projectile + impact-splash colour (CLAUDE.md §5.1 palette only — no
   * new hex values). Restored 2026-09-12: guns previously all fired
   * identical blue dots regardless of `type`/`sz`, which were both dead
   * fields nothing read — direct user feedback that the 6 guns needed to
   * "feel super different" surfaced this.
   */
  readonly particleColour: number;
}
