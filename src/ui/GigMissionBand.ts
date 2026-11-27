/**
 * Granny's request, as a band along the bottom of the home screen's gig
 * card: what to do on the left, how far along on the right, and what it
 * pays at the far right. The three are measured from the right inwards so
 * they can never land on top of one another; if the request is too long
 * for the room left it is cut short with an ellipsis.
 */

import type Phaser from 'phaser';

import type { MissionDef } from '../systems/Missions';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { textStyle } from '../utils/typography';
import { MISSION_BAND_HEIGHT } from './gigCardLayout';
import { drawCoinIcon } from './icons';
import { PANEL_OUTLINE_PX, PANEL_RADIUS } from './Panel';

export interface GigMissionBandConfig {
  /** Centre of the card the band belongs to. */
  readonly cardX: number;
  readonly cardY: number;
  readonly cardWidth: number;
  readonly cardHeight: number;
  readonly mission: MissionDef;
  readonly progress: number;
}

const BAND_HEIGHT = MISSION_BAND_HEIGHT;
/** Keeps the tint inside the card's outline. */
const BAND_INSET = Math.ceil(PANEL_OUTLINE_PX / 2);
const BAND_TINT_ALPHA = 0.22;
const RULE_PX = 3;
const RULE_ALPHA = 0.25;
/** Space between the band's content and the card's left and right edges. */
const SIDE_MARGIN = 28;
/** Space kept clear between the request and the progress count. */
const TEXT_GAP = 16;
const COIN_RADIUS = 12;
const COIN_OUTLINE_PX = 3;
const COIN_OUTER_RADIUS = COIN_RADIUS + COIN_OUTLINE_PX;
const COIN_TEXT_GAP = 8;
const COIN_RIM_SHADE = 0.72;
const ELLIPSIS = '…';

/** Draws the band and its three readouts; returns what it made. */
export function createGigMissionBand(
  scene: Phaser.Scene,
  config: GigMissionBandConfig,
): Phaser.GameObjects.GameObject[] {
  const left = config.cardX - config.cardWidth / 2;
  const right = config.cardX + config.cardWidth / 2;
  const top = config.cardY + config.cardHeight / 2 - BAND_HEIGHT;
  const centreY = top + BAND_HEIGHT / 2;
  const body = textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud);

  const band = scene.add.graphics();
  band.fillStyle(COLOUR.sunnyGold, BAND_TINT_ALPHA);
  band.fillRoundedRect(
    left + BAND_INSET,
    top,
    config.cardWidth - BAND_INSET * 2,
    BAND_HEIGHT - BAND_INSET,
    {
      tl: 0,
      tr: 0,
      bl: PANEL_RADIUS - BAND_INSET,
      br: PANEL_RADIUS - BAND_INSET,
    },
  );
  band.lineStyle(RULE_PX, COLOUR.ink, RULE_ALPHA);
  band.lineBetween(left + BAND_INSET, top, right - BAND_INSET, top);

  // Right to left: the reward, the coin before it, the progress before that.
  const reward = scene.add
    .text(right - SIDE_MARGIN, centreY, `+${config.mission.reward}`, body)
    .setOrigin(1, 0.5);
  const coinX = reward.x - reward.width - COIN_TEXT_GAP - COIN_OUTER_RADIUS;
  const coin = scene.add.graphics({ x: coinX, y: centreY });
  drawCoinIcon(coin, COIN_OUTER_RADIUS, COLOUR.ink, COLOUR.ink);
  drawCoinIcon(coin, COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, COIN_RIM_SHADE));
  const progress = scene.add
    .text(
      coinX - COIN_OUTER_RADIUS - TEXT_GAP,
      centreY,
      `${config.progress} / ${config.mission.target}`,
      body,
    )
    .setOrigin(1, 0.5);

  const request = scene.add
    .text(
      left + SIDE_MARGIN,
      centreY,
      config.mission.text,
      textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0, 0.5);
  fitWidth(request, progress.x - progress.width - TEXT_GAP - request.x);

  return [band, request, progress, coin, reward];
}

/** Trims a text object to `maxWidth`, ending it with an ellipsis if anything was cut. */
function fitWidth(text: Phaser.GameObjects.Text, maxWidth: number): void {
  const full = text.text;
  let length = full.length;
  while (text.width > maxWidth && length > 1) {
    length -= 1;
    text.setText(`${full.slice(0, length).trimEnd()}${ELLIPSIS}`);
  }
}
