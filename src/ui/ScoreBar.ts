/**
 * The score bar — the HUD's centrepiece (docs/REWARD_LOOP.md): the gig's coin
 * total as the largest text on screen, under it a bar filling toward the
 * third star with a star standing at each of the three targets, and beside
 * it the groove badge. It replaced the band meter, which counted musicians
 * awake; what the player earns now is coins, so coins are what it shows.
 *
 * Logical 1280x720 layout: the coin and number at y 34, the bar centred on
 * y 78, the badge to the left of the bar.
 */

import Phaser from 'phaser';

import type { HudRefreshData } from '../types/hud';
import { COLOUR } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { EASE } from '../utils/tween';
import { GrooveBadge } from './GrooveBadge';
import { drawStarIcon } from './icons';
import { ScoreCounter } from './ScoreCounter';

/** Where the coin beside the number sits — the coin fountain flies its coins here. */
export const SCORE_COIN_X = 556;
export const SCORE_COIN_Y = 34;

const BAR_LEFT = 440;
const BAR_WIDTH = 400;
const BAR_HEIGHT = 16;
const BAR_Y = 78;
const BAR_OUTLINE_PX = 4;
const BAR_FILL_INSET = 3;
/** How quickly the fill catches up with the coins, per second. */
const BAR_CATCH_UP_RATE = 10;
const BADGE_X = 372;
const BADGE_Y = 44;

const STAR_RADIUS = 14;
const STAR_OUTLINE_PX = 3;
const STAR_UNLIT = 0xd8d4c6;
const STAR_POP_SCALE = 1.8;
const STAR_POP_MS = 320;

export class ScoreBar {
  private readonly _scene: Phaser.Scene;
  private readonly _counter: ScoreCounter;
  private readonly _fill: Phaser.GameObjects.Graphics;
  private readonly _badge: GrooveBadge;
  private _stars: Phaser.GameObjects.Graphics[] = [];
  private _litStars = 0;
  private _frac = 0;
  private _drawnFrac = -1;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
    const track = scene.add.graphics();
    const radius = pillRadius(BAR_WIDTH, BAR_HEIGHT);
    track.fillStyle(COLOUR.cloud, 0.94);
    track.fillRoundedRect(BAR_LEFT, BAR_Y - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, radius);
    track.lineStyle(BAR_OUTLINE_PX, COLOUR.ink, 1);
    track.strokeRoundedRect(BAR_LEFT, BAR_Y - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, radius);
    this._fill = scene.add.graphics();
    this._counter = new ScoreCounter(scene, SCORE_COIN_X, SCORE_COIN_Y, 'bare');
    this._badge = new GrooveBadge(scene, BADGE_X, BADGE_Y);
  }

  /** Call once per frame with the HUD's snapshot and the time since the last call. */
  update(data: HudRefreshData, deltaMs: number): void {
    const [, , third] = data.starTargets;
    if (this._stars.length === 0) this._buildStars(data.starTargets);

    this._counter.update(data.coins, deltaMs);
    const target = third > 0 ? Math.min(1, data.coins / third) : 0;
    this._frac += (target - this._frac) * Math.min(1, (BAR_CATCH_UP_RATE * deltaMs) / 1000);
    if (Math.abs(target - this._frac) < 0.001) this._frac = target;
    this._drawFill();

    // A star lights only once the number on screen has passed its mark, so it
    // never pops ahead of the coins still flying to the counter.
    let lit = 0;
    data.starTargets.forEach((mark, i) => {
      if (data.stars > i && data.coins >= mark) lit = i + 1;
    });
    this._lightStars(lit);

    this._badge.update(data.grooveLevel, data.grooveRing, data.jackpot);
  }

  private _drawFill(): void {
    if (this._frac === this._drawnFrac) return;
    this._drawnFrac = this._frac;
    const g = this._fill;
    g.clear();
    const innerHeight = BAR_HEIGHT - BAR_FILL_INSET * 2;
    const width = (BAR_WIDTH - BAR_FILL_INSET * 2) * this._frac;
    if (width < innerHeight) return;
    g.fillStyle(COLOUR.sunnyGold, 1);
    g.fillRoundedRect(
      BAR_LEFT + BAR_FILL_INSET,
      BAR_Y - innerHeight / 2,
      width,
      innerHeight,
      pillRadius(width, innerHeight),
    );
  }

  /** One star standing on the bar at each target, spaced by coins: the third at the right-hand end. */
  private _buildStars(targets: readonly [number, number, number]): void {
    const third = targets[2];
    this._stars = targets.map((mark) => {
      const x = BAR_LEFT + (third > 0 ? (BAR_WIDTH * mark) / third : BAR_WIDTH);
      const star = this._scene.add.graphics({ x, y: BAR_Y });
      this._drawStar(star, false);
      return star;
    });
  }

  private _drawStar(star: Phaser.GameObjects.Graphics, lit: boolean): void {
    star.clear();
    drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
    drawStarIcon(star, STAR_RADIUS, lit ? COLOUR.sunnyGold : STAR_UNLIT);
  }

  /** Lights stars up to `count`, popping each newly earned one. Stars never go back out. */
  private _lightStars(count: number): void {
    while (this._litStars < Math.min(count, this._stars.length)) {
      const star = this._stars[this._litStars];
      this._litStars++;
      if (!star) continue;
      this._drawStar(star, true);
      star.setScale(STAR_POP_SCALE);
      this._scene.tweens.add({ targets: star, scale: 1, duration: STAR_POP_MS, ease: EASE.bouncy });
    }
  }
}
