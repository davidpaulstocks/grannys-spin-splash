/**
 * The results screen's action row. One large green button (what it says and
 * where it goes is `planMain`) is the only green thing on the screen, with
 * round Home (and, when the main button leads elsewhere, Retry) beside it. The
 * line that says why to press it sits ABOVE the main button, inside the screen.
 */

import type Phaser from 'phaser';

import type { TourStop } from '../../systems/Progress';
import { createButton } from '../../ui/Button';
import { drawHomeIcon, drawRetryIcon } from '../../ui/icons';
import { createIconButton } from '../../ui/IconButton';
import { COLOUR_HEX } from '../../utils/colour';
import { textStyle } from '../../utils/typography';
import {
  ACTIONS_Y,
  CENTRE_X,
  HOME_X,
  ICON_DIAMETER,
  JOINS_CENTRE_Y,
  JOINS_MAX_WIDTH,
  MAIN_MIN_WIDTH,
  RETRY_X,
} from './resultsLayout';
import type { MainPlan } from './resultsPlan';

export interface ResultsButtonsConfig {
  readonly plan: MainPlan;
  /** The gig just played (what the small Retry icon replays). */
  readonly here: TourStop;
  readonly onPlay: (stop: TourStop) => void;
  readonly onHome: () => void;
}

/** Builds the row and the line above it. */
export function buildResultsButtons(scene: Phaser.Scene, config: ResultsButtonsConfig): void {
  const { plan, here } = config;
  createButton(scene, {
    x: CENTRE_X,
    y: ACTIONS_Y,
    label: plan.label,
    variant: 'primary',
    size: 'lg',
    minWidth: MAIN_MIN_WIDTH,
    onClick: () => config.onPlay(plan.target),
  });
  if (plan.showRetry) {
    createIconButton(scene, {
      x: RETRY_X,
      y: ACTIONS_Y,
      icon: drawRetryIcon,
      diameter: ICON_DIAMETER,
      onClick: () => config.onPlay(here),
    });
  }
  addLine(scene, plan.line);
  createIconButton(scene, {
    x: HOME_X,
    y: ACTIONS_Y,
    icon: drawHomeIcon,
    diameter: ICON_DIAMETER,
    onClick: config.onHome,
  });
}

function addLine(scene: Phaser.Scene, line: string | null): void {
  if (!line) return;
  const text = scene.add
    .text(
      CENTRE_X,
      JOINS_CENTRE_Y,
      line,
      textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  if (text.width > JOINS_MAX_WIDTH) text.setScale(JOINS_MAX_WIDTH / text.width);
}
