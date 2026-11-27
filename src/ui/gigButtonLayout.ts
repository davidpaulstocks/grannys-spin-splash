/**
 * The geometry of one small gig button (a round button with the gig number,
 * its stars underneath, an optional ring and an optional pointer above). Pure
 * numbers, no Phaser, so the results screen and Home can prove by arithmetic
 * that a row of them fits its card and a unit test can check it.
 */

/** Face on a lip, with a faint shadow below the lip. */
export const GIG_LIP = 5;
export const GIG_SHADOW_DROP = 3;
export const GIG_OUTLINE_PX = 3;
/** The pink ring on the gig just played (results) or selected (Home). */
export const GIG_RING_GAP = 5;
export const GIG_RING_PX = 3;
/** The pink pointer over the recommended gig. */
export const GIG_POINTER_HEIGHT = 6;
export const GIG_POINTER_WIDTH = 14;
export const GIG_POINTER_GAP = 1;
export const GIG_POINTER_OUTLINE_PX = 2;
/** The three small stars under the button. */
export const GIG_STAR_RADIUS = 6;
export const GIG_STAR_OUTLINE_PX = 2;
export const GIG_STAR_SPACING = 14;
/** From the disc's centre to the stars' centre, beyond the disc's radius: clears the lip and shadow. */
export const GIG_STAR_DROP = 16;

/** Radius of the marker ring's centreline. */
export function gigRingRadius(diameter: number): number {
  return diameter / 2 + GIG_RING_GAP;
}

export interface GigButtonExtent {
  /** Negative: how far the drawing reaches above the disc's centre. */
  readonly top: number;
  /** How far it reaches below (the stars' lower edge). */
  readonly bottom: number;
  /** Half the width of the widest part (the ring). */
  readonly halfWidth: number;
}

/** The furthest the whole button reaches from its disc's centre, pointer, ring and stars included. */
export function gigButtonExtent(diameter: number): GigButtonExtent {
  const ringOuter = gigRingRadius(diameter) + GIG_RING_PX / 2;
  return {
    top: -(ringOuter + GIG_POINTER_GAP + GIG_POINTER_HEIGHT + GIG_POINTER_OUTLINE_PX / 2),
    bottom: diameter / 2 + GIG_STAR_DROP + GIG_STAR_RADIUS + GIG_STAR_OUTLINE_PX,
    halfWidth: ringOuter,
  };
}
