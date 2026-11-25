/**
 * Granny's request as a small card, for the results screen: how far the gig
 * just played moved the mission and — when the gig finished it — the reward
 * landing, then the next request taking its place.
 */

import type Phaser from 'phaser';

import { playStarChime } from '../audio/ResultsMusic';
import { currentMission, type MissionUpdate } from '../systems/Missions';
import { saveManager } from '../systems/SaveManager';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const WIDTH = 232;
const HEIGHT = 190;
const RADIUS = 26;
const TEXT_WRAP = WIDTH - 36;
const HEADING_OFFSET_Y = -62;
const BODY_OFFSET_Y = -14;
const STATUS_OFFSET_Y = 52;
/** How long a finished mission is celebrated before the card turns to the next one. */
const NEXT_AFTER_MS = 1800;

export interface MissionCardOptions {
  /** When to celebrate a completed mission — after the stars and the coin count-up have had their turn. */
  readonly celebrateAfterMs: number;
  /** Called as the reward lands, so the caller can refresh any coin readout. */
  readonly onReward: () => void;
}

/** Builds the card centred on (x, y). Fire-and-forget: it animates itself. */
export function showMissionCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  update: MissionUpdate,
  options: MissionCardOptions,
): void {
  const card = scene.add.graphics();
  card.fillStyle(COLOUR.cloud, 0.97);
  card.fillRoundedRect(x - WIDTH / 2, y - HEIGHT / 2, WIDTH, HEIGHT, RADIUS);
  card.lineStyle(5, COLOUR.ink, 1);
  card.strokeRoundedRect(x - WIDTH / 2, y - HEIGHT / 2, WIDTH, HEIGHT, RADIUS);

  const heading = scene.add
    .text(
      x,
      y + HEADING_OFFSET_Y,
      'MISSION',
      textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  const body = scene.add
    .text(x, y + BODY_OFFSET_Y, update.mission.text, {
      ...textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      align: 'center',
      wordWrap: { width: TEXT_WRAP },
    })
    .setOrigin(0.5);
  const status = scene.add
    .text(
      x,
      y + STATUS_OFFSET_Y,
      `${update.progress} / ${update.mission.target}`,
      textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  if (!update.completed) return;

  scene.time.delayedCall(options.celebrateAfterMs, () => {
    heading.setText('MISSION DONE!').setColor(COLOUR_HEX.grannyPink);
    status.setText(`+${update.mission.reward}`).setColor(COLOUR_HEX.sunnyGold).setScale(0.5);
    scene.tweens.add({
      targets: status,
      scale: 1,
      duration: DURATION.celebration,
      ease: EASE.bouncy,
    });
    playStarChime(0);
    options.onReward();
  });
  scene.time.delayedCall(options.celebrateAfterMs + NEXT_AFTER_MS, () => {
    const next = currentMission(saveManager.load());
    heading.setText('NEXT MISSION').setColor(COLOUR_HEX.softSlate);
    body.setText(next.text);
    status.setText(`0 / ${next.target}`).setColor(COLOUR_HEX.ink);
  });
}
