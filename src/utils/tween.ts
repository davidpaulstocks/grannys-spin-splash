/** Standard animation timings + easing (CLAUDE.md §5.6). Shared so no scene invents its own durations. */

export const DURATION = {
  hoverPress: 100,
  stateChange: 200,
  sceneTransition: 300,
  celebration: 600,
} as const;

export const EASE = {
  standardIn: 'Quad.In',
  standardOut: 'Quad.Out',
  /** Celebratory moments only — CLAUDE.md §5.6 (Frenzy banner, level reveal, unlocks). */
  bouncy: 'Back.Out',
} as const;

/** Overshoot factor for EASE.bouncy (CLAUDE.md §5.6: "Back.Out (overshoot 1.6)"). */
export const BOUNCE_OVERSHOOT = 1.6;
