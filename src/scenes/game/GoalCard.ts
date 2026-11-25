/**
 * The goal, stated before the first squirt of every gig: wake the whole
 * band, and what each star takes. It sits beside Granny, below the wall, so
 * it never covers a spinner, and it leaves the moment the player starts.
 *
 * The round does not begin until the first input, so reading it costs the
 * player no time.
 */

import type Phaser from 'phaser';

import { awakeNeededForStars } from '../../entities/world/gigs.data';
import { drawStarIcon } from '../../ui/icons';
import { createPanel } from '../../ui/Panel';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { textStyle } from '../../utils/typography';

/** Left of Granny, on the ground below the wall. */
const CARD_X = 286;
const CARD_Y = 568;
const CARD_WIDTH = 420;
const CARD_HEIGHT = 136;
const HEADLINE_OFFSET_Y = -22;
const STARS_OFFSET_Y = 30;
/** Three "stars + number" groups share the card's width evenly. */
const GROUP_SPACING = 132;
const STAR_RADIUS = 11;
const STAR_OUTLINE_PX = 3;
const STAR_PITCH = 22;
const NUMBER_GAP = 10;
const DEPTH = 150;
const FADE_MS = 220;

export class GoalCard {
  private readonly _scene: Phaser.Scene;
  private _parts: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  /** Shows the goal for a band of `band` musicians. */
  show(band: number): void {
    const scene = this._scene;
    const parts = createPanel(scene, {
      x: CARD_X,
      y: CARD_Y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      ribbon: 'YOUR GOAL',
      alpha: 0.95,
    });
    parts.push(
      scene.add
        .text(
          CARD_X,
          CARD_Y + HEADLINE_OFFSET_Y,
          'Wake the whole band!',
          textStyle('buttonM', COLOUR_HEX.ink, COLOUR_HEX.ink),
        )
        .setOrigin(0.5),
    );

    // One group per star rating: that many stars, then how many must be awake at once.
    awakeNeededForStars(band).forEach((needed, i) => {
      const stars = i + 1;
      const groupX = CARD_X + (i - 1) * GROUP_SPACING;
      const y = CARD_Y + STARS_OFFSET_Y;
      const number = scene.add
        .text(0, y, String(needed), textStyle('buttonM', COLOUR_HEX.ink, COLOUR_HEX.ink))
        .setOrigin(0, 0.5);
      const starsWidth = stars * STAR_PITCH;
      const left = groupX - (starsWidth + NUMBER_GAP + number.width) / 2;
      for (let s = 0; s < stars; s++) {
        const star = scene.add.graphics({ x: left + STAR_PITCH * (s + 0.5), y });
        drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
        drawStarIcon(star, STAR_RADIUS, COLOUR.sunnyGold);
        parts.push(star);
      }
      number.setX(left + starsWidth + NUMBER_GAP);
      parts.push(number);
    });

    for (const part of parts)
      (part as unknown as Phaser.GameObjects.Components.Depth).setDepth(DEPTH);
    this._parts = parts;
  }

  /** Fades the card out and removes it. Safe to call when nothing is showing. */
  dismiss(): void {
    const parts = this._parts;
    this._parts = [];
    if (parts.length === 0) return;
    this._scene.tweens.add({
      targets: parts,
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => {
        for (const part of parts) part.destroy();
      },
    });
  }
}
