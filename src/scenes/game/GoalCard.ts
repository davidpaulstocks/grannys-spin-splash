/**
 * The goal, stated before the first squirt of every gig: keep the band
 * playing, and how many coins each star takes. It sits beside Granny, below
 * the wall, so it never covers a spinner, and it leaves the moment the player
 * starts.
 *
 * The round does not begin until the first input, so reading it costs the
 * player no time.
 */

import type Phaser from 'phaser';

import { starTargets, type GigDef } from '../../entities/world/gigs.data';
import { drawCoinIcon, drawStarIcon } from '../../ui/icons';
import { createPanel } from '../../ui/Panel';
import { COLOUR, COLOUR_HEX, shade } from '../../utils/colour';
import { textStyle } from '../../utils/typography';

/** Left of Granny, on the ground below the wall. */
const CARD_X = 286;
const CARD_Y = 568;
const CARD_WIDTH = 450;
const CARD_HEIGHT = 136;
const HEADLINE_OFFSET_Y = -34;
const STARS_OFFSET_Y = 6;
const HINT_OFFSET_Y = 42;
/** Three "stars + number" groups share the card's width evenly. */
const GROUP_SPACING = 148;
const STAR_RADIUS = 9;
const STAR_OUTLINE_PX = 3;
const STAR_PITCH = 18;
const NUMBER_GAP = 8;
const COIN_RADIUS = 9;
const COIN_OUTLINE_PX = 2;
const COIN_GAP = 6;
const DEPTH = 150;
const FADE_MS = 220;

export class GoalCard {
  private readonly _scene: Phaser.Scene;
  private _parts: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  /** Shows the goal for `gig`: the coin targets of its three stars. */
  show(gig: GigDef): void {
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
          'Keep the band playing!',
          textStyle('buttonM', COLOUR_HEX.ink, COLOUR_HEX.ink),
        )
        .setOrigin(0.5),
    );

    // One group per star rating: that many stars, then the coins it takes.
    starTargets(gig).forEach((target, i) => {
      const stars = i + 1;
      const groupX = CARD_X + (i - 1) * GROUP_SPACING;
      const y = CARD_Y + STARS_OFFSET_Y;
      const number = scene.add
        .text(0, y, String(target), textStyle('buttonS', COLOUR_HEX.ink, COLOUR_HEX.ink))
        .setOrigin(0, 0.5);
      const coinWidth = (COIN_RADIUS + COIN_OUTLINE_PX) * 2;
      const starsWidth = stars * STAR_PITCH;
      const left = groupX - (starsWidth + NUMBER_GAP + coinWidth + COIN_GAP + number.width) / 2;
      for (let s = 0; s < stars; s++) {
        const star = scene.add.graphics({ x: left + STAR_PITCH * (s + 0.5), y });
        drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
        drawStarIcon(star, STAR_RADIUS, COLOUR.sunnyGold);
        parts.push(star);
      }
      const coinX = left + starsWidth + NUMBER_GAP + coinWidth / 2;
      const coin = scene.add.graphics({ x: coinX, y });
      drawCoinIcon(coin, COIN_RADIUS + COIN_OUTLINE_PX, COLOUR.ink, COLOUR.ink);
      drawCoinIcon(coin, COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, 0.72));
      parts.push(coin);
      number.setX(coinX + coinWidth / 2 + COIN_GAP);
      parts.push(number);
    });
    parts.push(
      scene.add
        .text(
          CARD_X,
          CARD_Y + HINT_OFFSET_Y,
          "Don't let one drop out",
          textStyle('bodyM', COLOUR_HEX.softSlate, COLOUR_HEX.softSlate),
        )
        .setOrigin(0.5),
    );

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
