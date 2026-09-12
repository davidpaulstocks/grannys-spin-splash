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
  /**
   * Where this world's spinners actually mount, in logical 1280×720 space
   * (2026-09-12, direct user feedback: spinners had to sit "in natural
   * positions like they fit in naturally eg on the fence or the disco
   * ball"). Measured off each delivered background's own art — Garden's
   * fence panel, Workshop's pegboard, Kitchen's shelf + tiled backsplash,
   * Funfair's tent canvas, Disco's back wall under the ball — instead of
   * one generic WALL_AREA rectangle for every world, which left spinners
   * floating over sky, shelves and floor depending on the scene. Falls
   * back to config.ts's WALL_AREA when a world doesn't specify one.
   */
  readonly wallArea?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /**
   * One extra spinner placed on a specific painted feature of the
   * background, outside the grid (2026-09-12, direct user feedback: "in the
   * disco world, surely the disco ball should be a spinner too!"). The
   * position is measured off the delivered art, so it lands ON the thing it
   * depicts rather than near it. It is a normal wall spinner in every other
   * respect — it decays, scores, and counts toward Splash Frenzy.
   */
  readonly featureSpinner?: {
    readonly type: SpinnerKind;
    readonly x: number;
    readonly y: number;
    /** Radius in logical px, matched to the painted feature rather than the type's default. */
    readonly r: number;
  };
}
