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

/**
 * Visual variant. Matches `type` 1:1 by default (as in v1's original
 * design), but `style` and `type` are deliberately separate fields — as
 * of 2026-09-12 (direct user feedback: spinners needed to be "entertaining
 * original objects from each world," not generic shared shapes) GameScene
 * overrides `style` per world for a handful of (world, type) combinations
 * that get a genuinely different bespoke shape, while `type` stays the
 * mechanical kind driving decay/power/hit-testing untouched. See
 * `WORLD_STYLE_OVERRIDE` in world.data.ts for exactly which ones.
 */
export type SpinnerStyle =
  | SpinnerKind
  | 'whisk'
  | 'sawblade'
  | 'candyswirl'
  | 'daisy'
  | 'record'
  | 'citrus';

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
  /** Disco-world-only: adds a glitter overlay on top of whatever shape this spinner already draws. */
  readonly sparkle?: boolean;
  /**
   * Decorative backing plate drawn *behind* the spinner. Funfair's tent
   * canvas is a high-contrast stripe pattern at roughly the same spatial
   * frequency as a spinner's blades, so spinners visually dissolved into
   * it. A shooting-gallery target board fixes the legibility and is the
   * single most on-theme object a fairground could mount a spinner on —
   * unlike the old flat cream scrim, which read as a UI panel pasted over
   * the art.
   */
  readonly mount?: 'target';
}
