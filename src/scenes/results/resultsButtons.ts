/**
 * The results screen's action row. One large green button — NEXT GIG after a
 * pass, TRY AGAIN after a miss — is the only green thing on the screen, with
 * round Home (and, after a pass, Retry) beside it. Who joins the band sits
 * ABOVE the main button, inside the screen.
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

export interface ResultsButtonsConfig {
  readonly passed: boolean;
  /** Where the main button goes after a pass; null when nowhere new is open yet. */
  readonly onward: TourStop | null;
  /** The gig just played. */
  readonly here: TourStop;
  /** "The Marimba joins!" or null. */
  readonly joins: string | null;
  readonly onPlay: (stop: TourStop) => void;
  readonly onHome: () => void;
}

/** The label of the main button for a state. */
export function mainLabel(passed: boolean, hasOnward: boolean): string {
  if (!passed) return 'TRY AGAIN';
  return hasOnward ? 'NEXT GIG' : 'PLAY AGAIN';
}

/** Builds the row and the joins line above it. */
export function buildResultsButtons(scene: Phaser.Scene, config: ResultsButtonsConfig): void {
  const { passed, onward, here } = config;
  createButton(scene, {
    x: CENTRE_X,
    y: ACTIONS_Y,
    label: mainLabel(passed, onward !== null),
    variant: 'primary',
    size: 'lg',
    minWidth: MAIN_MIN_WIDTH,
    onClick: () => config.onPlay(passed && onward ? onward : here),
  });
  if (passed && onward) {
    createIconButton(scene, {
      x: RETRY_X,
      y: ACTIONS_Y,
      icon: drawRetryIcon,
      diameter: ICON_DIAMETER,
      onClick: () => config.onPlay(here),
    });
    addJoins(scene, config.joins);
  }
  createIconButton(scene, {
    x: HOME_X,
    y: ACTIONS_Y,
    icon: drawHomeIcon,
    diameter: ICON_DIAMETER,
    onClick: config.onHome,
  });
}

function addJoins(scene: Phaser.Scene, line: string | null): void {
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
