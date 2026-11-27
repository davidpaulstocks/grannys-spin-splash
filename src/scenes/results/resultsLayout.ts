/**
 * Where everything on the results screen sits, on the 1280x720 canvas.
 * Pure numbers (no Phaser) so a unit test can prove by arithmetic that
 * nothing overlaps and nothing leaves the screen.
 *
 * Top to bottom: the score panel, ONE "what next" slot (the new-world card
 * or the reward card), the tour path, the "who joins" line, the button row.
 * A ribbon sits astride the top edge of a panel, half a ribbon above it.
 */

import { GIGS_PER_VENUE } from '../../entities/world/gigs.data';
import { gigButtonExtent } from '../../ui/gigButtonLayout';
import {
  PATH_GIG_DIAMETER,
  PATH_GIG_Y,
  PATH_TILE_CLEARANCE,
  PATH_TILE_FACE_Y,
  PATH_TILE_WIDTH,
  PATH_TILE_X,
  pathGigX,
  TOUR_PATH_HEIGHT,
} from '../../ui/tourPathLayout';

/** The logical canvas (the same as `GAME_WIDTH` x `GAME_HEIGHT` in config.ts, which cannot be imported without Phaser). */
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

export const SCREEN_MARGIN = 16;
export const MIN_GAP = 16;
export const CENTRE_X = CANVAS_WIDTH / 2;
export const SCREEN_BOTTOM = CANVAS_HEIGHT - SCREEN_MARGIN;

/** Width shared by every card in the column. */
export const CARD_WIDTH = 760;
/** How far a ribbon reaches above its panel's top edge (half the ribbon). */
export const RIBBON_RISE = 27;

export const SCORE_TOP = 48;
export const SCORE_HEIGHT = 176;
export const SCORE_BOTTOM = SCORE_TOP + SCORE_HEIGHT;

/** The "what next" slot. Its footprint (760x140, ribbon on top) is NextRewardCard's. */
export const SLOT_HEIGHT = 140;
export const SLOT_TOP = SCORE_BOTTOM + MIN_GAP + 4 + RIBBON_RISE;
export const SLOT_CENTRE_Y = SLOT_TOP + SLOT_HEIGHT / 2;
export const SLOT_BOTTOM = SLOT_TOP + SLOT_HEIGHT;

export const PATH_HEIGHT = TOUR_PATH_HEIGHT;
export const PATH_TOP = SLOT_BOTTOM + MIN_GAP + 4;
export const PATH_CENTRE_Y = PATH_TOP + PATH_HEIGHT / 2;
export const PATH_BOTTOM = PATH_TOP + PATH_HEIGHT;

/** The "The Marimba joins!" line: a bodyL text box about 30 px tall, above the main button. */
export const JOINS_HEIGHT = 30;
export const JOINS_TOP = PATH_BOTTOM + MIN_GAP;
export const JOINS_CENTRE_Y = JOINS_TOP + JOINS_HEIGHT / 2;
export const JOINS_MAX_WIDTH = CARD_WIDTH;

/** Main button: `lg` is 84 tall on a 9 px lip with a 6 px shadow under that. */
export const MAIN_HEIGHT = 84;
export const MAIN_LIP = 9;
export const MAIN_SHADOW = 6;
export const MAIN_MIN_WIDTH = 340;
export const ACTIONS_Y = 640;
export const MAIN_TOP = ACTIONS_Y - MAIN_HEIGHT / 2;
export const MAIN_BOTTOM = ACTIONS_Y + MAIN_HEIGHT / 2 + MAIN_LIP + MAIN_SHADOW;

/** Round Home and Retry buttons: 64 across on a 7 px lip and 6 px shadow. */
export const ICON_DIAMETER = 64;
export const ICON_REACH_BELOW = ICON_DIAMETER / 2 + 7 + 6;
export const HOME_X = 300;
export const RETRY_X = 380;

/** The coins pill, top left. */
export const PILL_X = 104;
export const PILL_Y = 50;
export const PILL_WIDTH = 150;
export const PILL_HEIGHT = 52;

/** Granny, left of the column. */
export const GRANNY_X = 130;
export const GRANNY_Y = 480;
export const GRANNY_HEIGHT = 300;

/** Toasts and confetti. */
export const REQUEST_TOAST_X = 150;
export const REQUEST_TOAST_Y = 120;

export interface LayoutBox {
  readonly name: string;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

function box(name: string, cx: number, top: number, width: number, height: number): LayoutBox {
  return { name, left: cx - width / 2, top, right: cx + width / 2, bottom: top + height };
}

/** The column of cards and the action row, as boxes (ribbons included), for the layout test and the report. */
export const COLUMN_BOXES: readonly LayoutBox[] = [
  box(
    'score panel + ribbon',
    CENTRE_X,
    SCORE_TOP - RIBBON_RISE,
    CARD_WIDTH,
    SCORE_HEIGHT + RIBBON_RISE,
  ),
  box(
    'what-next card + ribbon',
    CENTRE_X,
    SLOT_TOP - RIBBON_RISE,
    CARD_WIDTH,
    SLOT_HEIGHT + RIBBON_RISE,
  ),
  box('tour path', CENTRE_X, PATH_TOP, CARD_WIDTH, PATH_HEIGHT),
  box('joins line', CENTRE_X, JOINS_TOP, JOINS_MAX_WIDTH, JOINS_HEIGHT),
  box('main button', CENTRE_X, MAIN_TOP, MAIN_MIN_WIDTH, MAIN_BOTTOM - MAIN_TOP),
];

/** The panel's outline is 5 px, centred on its edge; nothing but a ribbon may cross it. */
export const PANEL_INNER_INSET = 3;
/** A gig button's pointer, ring and stars reach this far from its disc (`gigButtonExtent`). */
export const PATH_GIG_EXTENT = gigButtonExtent(PATH_GIG_DIAMETER);

/** The path card's centre, as an absolute position: gig buttons are positioned relative to it. */
function pathBox(
  name: string,
  cx: number,
  top: number,
  right: number,
  bottom: number,
  left: number,
): LayoutBox {
  return {
    name,
    left: cx + left,
    top: PATH_CENTRE_Y + top,
    right: cx + right,
    bottom: PATH_CENTRE_Y + bottom,
  };
}

/** The eight gig discs (lip and shadow included below), as boxes on the canvas, for the layout test. */
export function pathDiscBoxes(withTile: boolean): readonly LayoutBox[] {
  const r = PATH_GIG_DIAMETER / 2;
  return Array.from({ length: GIGS_PER_VENUE }, (_, i) => {
    const x = pathGigX(i, withTile);
    return pathBox(`gig ${i + 1}`, CENTRE_X, PATH_GIG_Y - r, x + r, PATH_GIG_Y + r, x - r);
  });
}

/** Everything one gig draws (pointer, ring, stars), as boxes on the canvas. */
export function pathExtentBoxes(withTile: boolean): readonly LayoutBox[] {
  return Array.from({ length: GIGS_PER_VENUE }, (_, i) => {
    const x = pathGigX(i, withTile);
    return pathBox(
      `gig ${i + 1} reach`,
      CENTRE_X,
      PATH_GIG_Y + PATH_GIG_EXTENT.top,
      x + PATH_GIG_EXTENT.halfWidth,
      PATH_GIG_Y + PATH_GIG_EXTENT.bottom,
      x - PATH_GIG_EXTENT.halfWidth,
    );
  });
}

/** The next-venue tile (face, lip and shadow) as a box on the canvas. */
export function pathTileBox(): LayoutBox {
  const half = PATH_TILE_WIDTH / 2;
  const lipReach = 6 + 4;
  const faceHalfHeight = 37;
  return pathBox(
    'next-venue tile',
    CENTRE_X,
    PATH_TILE_FACE_Y - faceHalfHeight,
    PATH_TILE_X + half,
    PATH_TILE_FACE_Y + faceHalfHeight + lipReach,
    PATH_TILE_X - half,
  );
}

/** Minimum air between the last gig's reach and the tile. */
export const PATH_TILE_MIN_GAP = PATH_TILE_CLEARANCE;
