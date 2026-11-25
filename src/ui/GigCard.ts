/**
 * The home screen's card for the next gig: venue name, a row of dots
 * showing where in the venue's eight gigs the player is, who joins the band
 * for this gig, and Granny's current request along the bottom.
 */

import type Phaser from 'phaser';

import { musiciansJoining } from '../audio/scores';
import { gigFor, GIGS_PER_VENUE } from '../entities/world/gigs.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { currentMission } from '../systems/Missions';
import { venueStars } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';
import { createGigMissionBand } from './GigMissionBand';
import { createPanel } from './Panel';

export interface GigCardConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly venueId: string;
  readonly venueName: string;
  /** Zero-based gig within the venue. */
  readonly gig: number;
}

/**
 * Composition, top to bottom, all centred on the card: the ribbon, the venue
 * name, the dots, a one-line caption, the band's new musicians, and the
 * mission band along the card's bottom edge.
 */
export const GIG_CARD_WIDTH = 480;
export const GIG_CARD_HEIGHT = 336;
const RIBBON_LABEL = 'NEXT GIG';
const NAME_OFFSET_Y = -116;
const DOTS_OFFSET_Y = -62;
const CAPTION_OFFSET_Y = -26;
const NEW_LABEL_OFFSET_Y = 14;
const NEW_NAMES_OFFSET_Y = 44;
const NEW_NAMES_MARGIN = 28;

const DOT_RADIUS = 13;
const CURRENT_DOT_RADIUS = 16;
const DOT_SPACING = 44;
const DOT_OUTLINE_PX = 3;
const FUTURE_DOT = 0xd8d4c6;
const FUTURE_DOT_OUTLINE_ALPHA = 0.4;

/** Builds the card and returns everything it made, background first. */
export function createGigCard(
  scene: Phaser.Scene,
  config: GigCardConfig,
): Phaser.GameObjects.GameObject[] {
  const { x, y, venueId, gig } = config;
  const save = saveManager.load();
  const parts: Phaser.GameObjects.GameObject[] = createPanel(scene, {
    x,
    y,
    width: GIG_CARD_WIDTH,
    height: GIG_CARD_HEIGHT,
    ribbon: RIBBON_LABEL,
    alpha: 0.96,
  });

  parts.push(
    scene.add
      .text(
        x,
        y + NAME_OFFSET_Y,
        config.venueName.toUpperCase(),
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5),
  );

  parts.push(buildDots(scene, x, y + DOTS_OFFSET_Y, venueStars(save, venueId), gig));
  const isFinale = gig === GIGS_PER_VENUE - 1;
  parts.push(
    scene.add
      .text(
        x,
        y + CAPTION_OFFSET_Y,
        isFinale ? 'The Grand Concert' : `Gig ${gig + 1} of ${GIGS_PER_VENUE}`,
        textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5),
  );

  parts.push(...buildNewMusicians(scene, x, y, venueId, gig));

  parts.push(
    ...createGigMissionBand(scene, {
      cardX: x,
      cardY: y,
      cardWidth: GIG_CARD_WIDTH,
      cardHeight: GIG_CARD_HEIGHT,
      mission: currentMission(save),
      progress: save.mission.progress,
    }),
  );
  return parts;
}

/** One dot per gig: gold if passed, pink and larger if current, pale if still ahead. */
function buildDots(
  scene: Phaser.Scene,
  x: number,
  y: number,
  stars: readonly number[],
  current: number,
): Phaser.GameObjects.Graphics {
  const dots = scene.add.graphics();
  for (let i = 0; i < GIGS_PER_VENUE; i++) {
    const dotX = x + (i - (GIGS_PER_VENUE - 1) / 2) * DOT_SPACING;
    const isCurrent = i === current;
    const passed = (stars[i] ?? 0) > 0;
    const fill = isCurrent ? COLOUR.grannyPink : passed ? COLOUR.sunnyGold : FUTURE_DOT;
    const outlineAlpha = isCurrent || passed ? 1 : FUTURE_DOT_OUTLINE_ALPHA;
    const radius = isCurrent ? CURRENT_DOT_RADIUS : DOT_RADIUS;
    dots.fillStyle(fill, 1);
    dots.fillCircle(dotX, y, radius);
    dots.lineStyle(DOT_OUTLINE_PX, COLOUR.ink, outlineAlpha);
    dots.strokeCircle(dotX, y, radius);
  }
  return dots;
}

/** Who is new to the band for this gig; nothing when nobody is. */
function buildNewMusicians(
  scene: Phaser.Scene,
  x: number,
  y: number,
  venueId: string,
  gig: number,
): Phaser.GameObjects.Text[] {
  const world = WORLD_DEFS.find((w) => w.id === venueId);
  if (!world) return [];
  const band = gigFor(world, gig).band;
  const before = gig > 0 ? gigFor(world, gig - 1).band : 0;
  const joining = musiciansJoining(venueId, before, band);
  if (joining.length === 0) return [];

  const label = scene.add
    .text(
      x,
      y + NEW_LABEL_OFFSET_Y,
      gig === 0 ? 'MEET THE BAND' : joining.length === 1 ? 'NEW MUSICIAN' : 'NEW MUSICIANS',
      textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  const names = scene.add
    .text(x, y + NEW_NAMES_OFFSET_Y, joining.join('  ·  '), {
      ...textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
      align: 'center',
      wordWrap: { width: GIG_CARD_WIDTH - NEW_NAMES_MARGIN * 2 },
    })
    .setOrigin(0.5, 0);
  return [label, names];
}
