/**
 * GRANNY_LEVELS — rank ladder revealed at game over (CLAUDE.md §7.2).
 * Thresholds, labels, descriptions, and colours are extracted verbatim
 * from the reference prototype's `GRANNY_LEVELS` table
 * (`game prototype/granny-spin-splash.html`) — its emoji are replaced
 * with icon keys per CLAUDE.md §7.3 rule 8 (no emoji in user-facing UI).
 *
 * Note: the top tier's label is "GOLDEN GRANNY", same name as the
 * post-launch 10,000★ vault character unlock (CLAUDE.md §4, §13 C5) —
 * they are unrelated systems that happen to share a name in both the
 * prototype and the spec. This ladder is a per-run score rank; the
 * post-launch unlock is a permanent roster addition.
 */

export interface GrannyLevel {
  /** Minimum score required to reach this level. */
  readonly min: number;
  /** Short rank label rendered on the level-reveal banner. */
  readonly label: string;
  /** Icon key (from ICON_KEYS) shown alongside the label. */
  readonly iconKey: string;
  /** Tint colour in #RRGGBB. */
  readonly col: string;
  /** Flavour text beneath the label. */
  readonly desc: string;
  /** True only for the top tier — gets the celebratory gold treatment. */
  readonly isTopTier?: boolean;
}

export const GRANNY_LEVELS: readonly GrannyLevel[] = [
  {
    min: 0,
    label: 'Soggy Granny',
    iconKey: 'icon_level_soggy',
    col: '#6699BB',
    desc: 'A valiant first splash!',
  },
  {
    min: 100,
    label: 'Garden Granny',
    iconKey: 'icon_level_garden',
    col: '#88CC55',
    desc: "You're getting the hang of it!",
  },
  {
    min: 250,
    label: 'Splash Rookie',
    iconKey: 'icon_level_rookie',
    col: '#55AADD',
    desc: 'Nice and steady soaking!',
  },
  {
    min: 480,
    label: 'Wave Rider',
    iconKey: 'icon_level_waverider',
    col: '#4488FF',
    desc: 'Riding the spray beautifully!',
  },
  {
    min: 800,
    label: 'Power Sprayer',
    iconKey: 'icon_level_powersprayer',
    col: '#FFCC33',
    desc: 'Electrifying aim and power!',
  },
  {
    min: 1200,
    label: 'Spin Queen',
    iconKey: 'icon_level_spinqueen',
    col: '#FFAA44',
    desc: 'You rule the spinning wall!',
  },
  {
    min: 1700,
    label: 'Legendary Granny',
    iconKey: 'icon_level_legendary',
    col: '#FF6622',
    desc: 'A true splash LEGEND!',
  },
  {
    min: 2400,
    label: 'GOLDEN GRANNY',
    iconKey: 'icon_level_goldengranny',
    col: '#FFD700',
    desc: 'THE ULTIMATE WATER WARRIOR!!',
    isTopTier: true,
  },
];

/** The highest rank this score reaches. Always returns one — the ladder starts at 0. */
export function levelForScore(score: number): GrannyLevel {
  let reached = GRANNY_LEVELS[0];
  for (const level of GRANNY_LEVELS) {
    if (score >= level.min) reached = level;
  }
  return reached;
}
