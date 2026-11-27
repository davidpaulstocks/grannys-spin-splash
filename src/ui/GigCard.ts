/**
 * The home screen's card for the selected gig: venue name, a row of eight gig
 * buttons to pick from (`GigPicker`), a caption with the gig's number and the
 * stars still to win, who joins the band at this gig, and Granny's current
 * request along the bottom.
 */

import type Phaser from 'phaser';

import { musiciansJoining } from '../audio/scores';
import { gigFor } from '../entities/world/gigs.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { currentMission } from '../systems/Missions';
import { venueStars } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';
import {
  CAPTION_OFFSET_Y,
  CARD_TEXT_MARGIN,
  GIG_CARD_HEIGHT,
  GIG_CARD_WIDTH,
  GIG_ROW_OFFSET_Y,
  NAME_OFFSET_Y,
  NEW_LABEL_OFFSET_Y,
  NEW_NAMES_OFFSET_Y,
} from './gigCardLayout';
import { gigTitle, starsToWinLine } from './gigLines';
import { createGigMissionBand } from './GigMissionBand';
import { createGigPicker } from './GigPicker';
import { createPanel } from './Panel';

export interface GigCardConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly venueId: string;
  readonly venueName: string;
  /** Zero-based gig selected within the venue; PLAY starts this one. */
  readonly gig: number;
  /** `recommendedGig` for the venue, or null when it is complete. */
  readonly recommended: number | null;
  /** An open gig button was tapped. */
  readonly onSelect: (gig: number) => void;
}

const CAPTION_MAX_WIDTH = GIG_CARD_WIDTH - CARD_TEXT_MARGIN * 2;

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
    ribbon: config.gig === config.recommended ? 'NEXT GIG' : `GIG ${gig + 1}`,
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

  parts.push(
    ...createGigPicker(scene, {
      x,
      y: y + GIG_ROW_OFFSET_Y,
      save,
      venueId,
      selected: gig,
      recommended: config.recommended,
      onSelect: config.onSelect,
    }),
  );
  const caption = scene.add
    .text(
      x,
      y + CAPTION_OFFSET_Y,
      `${gigTitle(gig)}  ·  ${starsToWinLine(venueStars(save, venueId)[gig] ?? 0)}`,
      textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  if (caption.width > CAPTION_MAX_WIDTH) caption.setScale(CAPTION_MAX_WIDTH / caption.width);
  parts.push(caption);

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
    .text(
      x,
      y + NEW_NAMES_OFFSET_Y,
      joining.join('  ·  '),
      textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5, 0);
  // One line, shrunk to fit: a second line would run into the request band below.
  if (names.width > CAPTION_MAX_WIDTH) names.setScale(CAPTION_MAX_WIDTH / names.width);
  return [label, names];
}
