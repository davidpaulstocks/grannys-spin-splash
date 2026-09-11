/** WorldDef — level/world config shape. CLAUDE.md §7.2, §4. */

import type { ObstacleKind } from '../obstacle/obstacle.types';
import type { SpinnerKind } from '../spinner/spinner.types';

export interface WorldDef {
  readonly id: string;
  readonly name: string;
  /** Background sprite key. */
  readonly bg: string;
  /** Spinner wall layout — columns × rows. */
  readonly grid: { readonly cols: number; readonly rows: number };
  /** Which spinner kinds appear in this world. */
  readonly types: readonly SpinnerKind[];
  /** Which obstacles appear. */
  readonly obstacles: readonly ObstacleKind[];
  /** Round length in seconds. */
  readonly time: number;
  /** Stars required to unlock; 0 means available from first run. */
  readonly unlockThreshold: number;
  /** A few spinners drift side to side instead of holding position (Funfair). */
  readonly movingTargets?: boolean;
  /** Bonus Golden Spinner spawns more often (every 12-20s instead of 25-40s) — Disco. */
  readonly goldenFrequent?: boolean;
}
