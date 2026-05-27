/**
 * GRANNY_LEVELS — rank ladder revealed at game over (CLAUDE.md §7.2).
 * The prototype used emoji here; this version stores icon keys per
 * §7.3 rule 8 (resolved to SVG by HUD/Banner in Sprint 2).
 *
 * Score thresholds are placeholder values — tune in Sprint 2 once
 * spinner pacing is locked in story 2.8.
 */

export interface GrannyLevel {
  /** Minimum score required to reach this level. */
  readonly min: number;
  /** Short rank label rendered on the level-reveal banner. */
  readonly label: string;
  /** Icon key (from ICON_KEYS) shown alongside the label. */
  readonly iconKey: string;
  /** Phaser tint colour in #RRGGBB. */
  readonly col: string;
  /** Flavour text beneath the label. */
  readonly desc: string;
}

export const GRANNY_LEVELS: readonly GrannyLevel[] = [
  { min: 0, label: 'Apprentice Granny', iconKey: 'icon_level_apprentice', col: '#7FD9A8', desc: 'Just getting started!' },
  { min: 100, label: 'Splash Cadet', iconKey: 'icon_level_cadet', col: '#4DB3E5', desc: 'Finding your aim.' },
  { min: 400, label: 'Spin Master', iconKey: 'icon_level_master', col: '#FFC93C', desc: 'The wall fears you.' },
  { min: 1200, label: 'Drench Queen', iconKey: 'icon_level_queen', col: '#FF6BA8', desc: 'Royalty of the rotation.' },
  { min: 3000, label: 'Legendary Granny', iconKey: 'icon_level_legendary', col: '#FF8A3D', desc: 'You are the Frenzy.' },
];
