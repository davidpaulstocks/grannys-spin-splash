/**
 * POWERUP_DEFS — the 5 launch power-ups (CLAUDE.md §1). IDs, names, and
 * durations are extracted verbatim from the reference prototype's `PU`
 * table (`game prototype/granny-spin-splash.html`); effect semantics below
 * are read from `applyPowerup()` in the same file for PowerUp.ts to
 * implement against.
 *
 * `label` holds an icon key into src/assets/keys.ts, NOT an emoji char —
 * CLAUDE.md §7.3 rule 8 (no emoji in user-facing TS source).
 */

export type PowerUpEffect = 'soaker' | 'turbo' | 'spinlock' | 'goldenSplash' | 'doubleStars';

export interface PowerUpDef {
  readonly id: PowerUpEffect;
  /** Icon key (from ICON_KEYS) rendered on the floating pickup. */
  readonly label: string;
  /** Display name for the pickup toast + end-of-run summary. */
  readonly name: string;
  /** Duration in seconds; 0 = instant one-shot, no timed window. */
  readonly duration: number;
  /** Effect identifier — PowerUp.ts dispatches on this. */
  readonly effect: PowerUpEffect;
}

export const POWERUP_DEFS: readonly PowerUpDef[] = [
  {
    id: 'soaker',
    label: 'icon_soaker',
    name: 'Super Soaker',
    // Fires two extra side streams (±0.12 wobble) alongside the main stream.
    duration: 6,
    effect: 'soaker',
  },
  {
    id: 'turbo',
    label: 'icon_turbo',
    name: 'Turbo Pump',
    // Instant: refills the water tank to full and cancels any pump-refill wait.
    duration: 0,
    effect: 'turbo',
  },
  {
    id: 'spinlock',
    label: 'icon_spinlock',
    name: 'Spin Lock',
    // Suspends decay on every spinner for the duration — nothing slows down.
    duration: 8,
    effect: 'spinlock',
  },
  {
    id: 'goldenSplash',
    label: 'icon_goldensplash',
    name: 'Golden Splash',
    // Instant: the next spinner hit jumps straight to FULL (100) speed.
    duration: 0,
    effect: 'goldenSplash',
  },
  {
    id: 'doubleStars',
    label: 'icon_doublestars',
    name: 'Double Stars',
    // ×2 multiplier on all stars earned for the duration.
    duration: 10,
    effect: 'doubleStars',
  },
];
