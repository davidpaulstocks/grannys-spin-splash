/** Spinner state machine + shared types. CLAUDE.md §2, §7.2. */

export enum SpinnerState {
  STOPPED = 'STOPPED',
  SLOW = 'SLOW',
  MEDIUM = 'MEDIUM',
  FULL = 'FULL',
}

export type SpinnerKind =
  | 'pinwheel'
  | 'cog'
  | 'fan'
  | 'daisy'
  | 'propeller'
  | 'wheel'
  | 'turbine'
  | 'gear';

/** Visual variant — for v1 placeholder data this matches `type`; the prototype distinguished them. */
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
  /** Blade count for the procedural draw. */
  readonly blades: number;
  readonly style: SpinnerStyle;
  readonly colors: readonly string[];
}
