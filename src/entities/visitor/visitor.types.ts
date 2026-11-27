/** Visitor ids and kinds — the surprises that wander across the wall (see visitor.data.ts). */

/** Every visitor there is, in the order the painted sheets list them. */
export const VISITOR_IDS = [
  'cat',
  'seagull',
  'bloomers',
  'umbrella',
  'balloons',
  'flamingo',
  'rubber_duck',
  'watering_can',
  'cupcake',
  'piggy_bank',
  'candyfloss',
  'trophy',
  'dust_sheet',
  'squirrel',
  'tea_towel',
  'pigeon',
  'gnome',
  'dodgem',
  // Sheet 4 — the Pirate Ship
  'ship_sail',
  'fishing_net',
  'parrot',
  'crab',
  'treasure_chest',
  'golden_compass',
] as const;

export type VisitorId = (typeof VISITOR_IDS)[number];

/**
 * What a visitor does: a blocker drifts across and stops water, a sitter
 * (a thief) lands on an instrument, silences it and steals coins until
 * shooed, a treat flies across
 * and pays out when hit.
 */
export type VisitorKind = 'blocker' | 'sitter' | 'treat';

/** Where a visitor is in its visit. */
export type VisitorPhase = 'telegraph' | 'drop' | 'active' | 'leaving' | 'done';

/** What one water hit on a visitor meant, so the director can pay and cheer. */
export type VisitorHit = 'absorbed' | 'balloon' | 'treat' | 'shoo';

/** Everything the scene needs to describe one visitor (visitor.data.ts). */
export interface VisitorDef {
  readonly id: VisitorId;
  readonly kind: VisitorKind;
  /** The short word that floats up when it is dealt with ("Shoo!", "Yum!"). */
  readonly word: string;
  /** Longest side of the painted picture on screen, px. */
  readonly artPx: number;
  /** Scale of the drawn stand-in, which is authored at its own natural size. */
  readonly drawScale: number;
  /** Half width and height of the part that stops or takes water, px (a sitter uses its instrument instead). */
  readonly hitRx: number;
  readonly hitRy: number;
  /** Drop of the hit area's middle below the visitor's origin, px. */
  readonly hitOffsetY: number;
  /** Seagull-like sitters rise as they leave, px per second. */
  readonly exitRisePxPerS: number;
  /**
   * A thief that is carrying something of its own (the crab's gold coin) drops it when squirted off:
   * this share of the gig's third-star target, in place of the small standard shoo bonus.
   */
  readonly shooFraction?: number;
}
