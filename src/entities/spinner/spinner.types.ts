/** Spinner state machine + shared types. CLAUDE.md §2, §7.2. */

export enum SpinnerState {
  STOPPED = 'STOPPED',
  SLOW = 'SLOW',
  MEDIUM = 'MEDIUM',
  FULL = 'FULL',
}

/**
 * The 8 launch spinner kinds (CLAUDE.md §1), named to match the reference
 * prototype's `ST` table (`game prototype/granny-spin-splash.html`).
 */
export type SpinnerKind =
  | 'pinwheel'
  | 'fan'
  | 'windmill'
  | 'cog'
  | 'propeller'
  | 'whirligig'
  | 'disco'
  | 'golden';

/** Visual variant — for v1 this always matches `type` (1:1, unlike the prototype). */
export type SpinnerStyle = SpinnerKind;

export interface SpinnerDef {
  readonly type: SpinnerKind;
  /** Speed dropped per second when not being hit. */
  readonly decay: number;
  /** Speed gained per water hit. */
  readonly power: number;
  /** Stars awarded when this spinner reaches FULL. */
  readonly stars: number;
  /** Visible radius in px (logical 1280×720 space). */
  readonly r: number;
  /** Blade count for the procedural draw (0 = no discrete blades, e.g. cog/disco). */
  readonly blades: number;
  readonly style: SpinnerStyle;
  /** Palette for the procedural draw, `#RRGGBB` — darkest/base colour first. */
  readonly colors: readonly string[];
  /** Whirligig-only: deflects ~38% of incoming water instead of registering a hit. */
  readonly deflects?: boolean;
  /**
   * Golden-only: this spinner is a rare timed bonus spawn (not part of the
   * static wall grid) — high power/stars, vanishes after its lifetime.
   * Spawn-timer behaviour is not yet wired (tracked as a Sprint 2+ addition).
   */
  readonly isGolden?: boolean;
}
