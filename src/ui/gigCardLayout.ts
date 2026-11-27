/**
 * Where everything sits on Home's next-gig card, as offsets from the card's
 * centre (y down). Pure numbers (no Phaser) so a unit test can prove by
 * arithmetic that nothing overlaps and that the gig buttons keep their 44 px
 * finger size.
 */

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import { gigButtonExtent } from './gigButtonLayout';

export const GIG_CARD_WIDTH = 480;
export const GIG_CARD_HEIGHT = 336;
/** The ribbon is 54 tall, centred on the card's top edge. */
export const GIG_CARD_RIBBON_BOTTOM = -GIG_CARD_HEIGHT / 2 + 27;
/** Granny's request band along the bottom edge (GigMissionBand's height). */
export const MISSION_BAND_HEIGHT = 64;
export const MISSION_BAND_TOP = GIG_CARD_HEIGHT / 2 - MISSION_BAND_HEIGHT;

/** Line boxes of the two type sizes used (displayM 32 px, bodyL 20 px), with their leading. */
export const DISPLAY_M_BOX = 42;
export const BODY_L_BOX = 30;

export const NAME_OFFSET_Y = -118;
export const GIG_ROW_OFFSET_Y = -50;
export const CAPTION_OFFSET_Y = 15;
export const NEW_LABEL_OFFSET_Y = 47;
/** The top of the one-line list of names (its origin is the top). */
export const NEW_NAMES_OFFSET_Y = 65;
export const CARD_TEXT_MARGIN = 28;

/** The picker: one row of eight, 48 across with 8 between. */
export const PICKER_DIAMETER = 48;
export const PICKER_GAP = 8;
export const PICKER_PITCH = PICKER_DIAMETER + PICKER_GAP;
export const PICKER_WIDTH = GIGS_PER_VENUE * PICKER_DIAMETER + (GIGS_PER_VENUE - 1) * PICKER_GAP;
/** What the row draws above and below its discs' centre (pointer, ring, stars). */
export const PICKER_EXTENT = gigButtonExtent(PICKER_DIAMETER);

export interface CardBand {
  readonly name: string;
  readonly top: number;
  readonly bottom: number;
}

/** The card's stacked bands, top to bottom, for the layout test. */
export const GIG_CARD_BANDS: readonly CardBand[] = [
  {
    name: 'venue name',
    top: NAME_OFFSET_Y - DISPLAY_M_BOX / 2,
    bottom: NAME_OFFSET_Y + DISPLAY_M_BOX / 2,
  },
  {
    name: 'gig buttons',
    top: GIG_ROW_OFFSET_Y + PICKER_EXTENT.top,
    bottom: GIG_ROW_OFFSET_Y + PICKER_EXTENT.bottom,
  },
  {
    name: 'caption',
    top: CAPTION_OFFSET_Y - BODY_L_BOX / 2,
    bottom: CAPTION_OFFSET_Y + BODY_L_BOX / 2,
  },
  {
    name: 'new musicians label',
    top: NEW_LABEL_OFFSET_Y - BODY_L_BOX / 2,
    bottom: NEW_LABEL_OFFSET_Y + BODY_L_BOX / 2,
  },
  {
    name: 'new musicians names',
    top: NEW_NAMES_OFFSET_Y,
    bottom: NEW_NAMES_OFFSET_Y + BODY_L_BOX,
  },
];
