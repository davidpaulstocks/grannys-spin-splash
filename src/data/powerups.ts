/**
 * POWERUP_DEFS — the 5 launch power-ups (CLAUDE.md §1). Names + durations
 * are placeholders; effect IDs map to PowerUp.ts handlers (Sprint 1+).
 * Specific values get tuned in Sprint 2.
 *
 * `label` holds an icon key into src/assets/keys.ts, NOT an emoji char —
 * CLAUDE.md §7.3 rule 8 (no emoji in user-facing TS source).
 */

export type PowerUpEffect =
  | 'doubleScore'
  | 'speedBoost'
  | 'waterRefill'
  | 'megaSplash'
  | 'timeBonus';

export interface PowerUpDef {
  readonly id: PowerUpEffect;
  /** Icon key (from ICON_KEYS) rendered on the floating pickup. */
  readonly label: string;
  /** Display name for end-of-run summary. */
  readonly name: string;
  /** Duration in seconds; 0 = instant one-shot. */
  readonly duration: number;
  /** Effect identifier — PowerUp.ts dispatches on this. */
  readonly effect: PowerUpEffect;
}

export const POWERUP_DEFS: readonly PowerUpDef[] = [
  { id: 'doubleScore', label: 'icon_doublescore', name: 'Double Score', duration: 8, effect: 'doubleScore' },
  { id: 'speedBoost', label: 'icon_speedboost', name: 'Speed Boost', duration: 6, effect: 'speedBoost' },
  { id: 'waterRefill', label: 'icon_waterrefill', name: 'Water Refill', duration: 0, effect: 'waterRefill' },
  { id: 'megaSplash', label: 'icon_megasplash', name: 'Mega Splash', duration: 0, effect: 'megaSplash' },
  { id: 'timeBonus', label: 'icon_timebonus', name: 'Time Bonus', duration: 0, effect: 'timeBonus' },
];
