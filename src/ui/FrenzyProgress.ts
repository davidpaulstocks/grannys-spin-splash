/**
 * "N of M spinning" — the goal, stated plainly, during play (2026-09-12).
 *
 * CLAUDE.md §15's North Star is Splash Frenzy: "does this get the player to
 * Splash Frenzy faster?" But nothing on screen ever told the player that
 * getting the WHOLE wall spinning at once was the point. `FrenzyMeterUI`'s
 * per-spinner rings show each spinner's own charge beautifully and read as
 * part of the wall (story 2.6) — but they deliberately don't aggregate, so
 * the player could never see "I'm 9 of 12 there, three to go". The game's
 * actual objective was invisible.
 *
 * This is the aggregate, and it's deliberately explicit rather than
 * atmospheric: a count, a bar, and marks at the 60%/80% mini-frenzy
 * thresholds so the milestones the audio already reacts to are visible too.
 * It goes gold and pulses when the wall is full.
 *
 * Sits in the top HUD band between the score pill and the pause button, not
 * over the wall — §5.8 keeps the spinners as the visual hero, and this is a
 * readout, not a competitor.
 */

import Phaser from 'phaser';

import { FRENZY_THRESHOLDS } from '../entities/spinner/spinner.data';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { EASE } from '../utils/tween';
import { drawStarIcon } from './icons';
import { textStyle } from '../utils/typography';

const BAR_WIDTH = 460;
const BAR_HEIGHT = 26;
const LABEL_GAP = 12;
/** Tick marks for the 60%/80% mini-frenzies the orchestra already responds to. */
const TICK_WIDTH = 3;
const TICK_ALPHA = 0.45;
/**
 * The three stars a gig can earn sit on the bar at the fill they are earned
 * at — 60%, 80% and full — so the bar is the rating meter: fill it to a star
 * and that star lights (docs/ENGAGEMENT_DESIGN.md §3).
 */
const STAR_MARKS = [FRENZY_THRESHOLDS.miniLow, FRENZY_THRESHOLDS.miniHigh, FRENZY_THRESHOLDS.full];
const STAR_RADIUS = 17;
const STAR_OUTLINE_PX = 4;
const STAR_UNLIT = 0xd8d4c6;
const STAR_POP_SCALE = 1.7;
const STAR_POP_MS = 320;

/** Pulse applied to the whole readout while the wall is full. */
const FULL_PULSE_HZ = 2.6;
const FULL_PULSE_DEPTH = 0.06;

export class FrenzyProgress {
  private readonly _scene: Phaser.Scene;
  private readonly _container: Phaser.GameObjects.Container;
  private readonly _fill: Phaser.GameObjects.Graphics;
  private readonly _label: Phaser.GameObjects.Text;
  private readonly _stars: Phaser.GameObjects.Graphics[] = [];
  private _lastFull = -1;
  private _lastTotal = -1;
  private _litStars = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this._scene = scene;

    const track = scene.add.graphics();
    track.fillStyle(COLOUR.cloud, 0.92);
    track.fillRoundedRect(
      -BAR_WIDTH / 2,
      -BAR_HEIGHT / 2,
      BAR_WIDTH,
      BAR_HEIGHT,
      pillRadius(BAR_WIDTH, BAR_HEIGHT),
    );
    track.lineStyle(3, COLOUR.ink, 1);
    track.strokeRoundedRect(
      -BAR_WIDTH / 2,
      -BAR_HEIGHT / 2,
      BAR_WIDTH,
      BAR_HEIGHT,
      pillRadius(BAR_WIDTH, BAR_HEIGHT),
    );

    this._fill = scene.add.graphics();

    const ticks = scene.add.graphics();
    ticks.fillStyle(COLOUR.ink, TICK_ALPHA);
    for (const t of [FRENZY_THRESHOLDS.miniLow, FRENZY_THRESHOLDS.miniHigh]) {
      ticks.fillRect(-BAR_WIDTH / 2 + BAR_WIDTH * t, -BAR_HEIGHT / 2, TICK_WIDTH, BAR_HEIGHT);
    }

    this._label = scene.add
      .text(0, BAR_HEIGHT / 2 + LABEL_GAP, '', textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5, 0);

    this._container = scene.add.container(x, y, [track, this._fill, ticks, this._label]);
    for (const mark of STAR_MARKS) {
      const star = scene.add.graphics({ x: -BAR_WIDTH / 2 + BAR_WIDTH * mark, y: 0 });
      this._drawStar(star, false);
      this._stars.push(star);
      this._container.add(star);
    }
  }

  /**
   * Call once per frame with how many spinners are at FULL and how many
   * there are. Redraws only when the count actually changes — the pulse at
   * 100% is the one thing that has to animate every frame.
   */
  update(fullCount: number, total: number, stars = 0): void {
    this._lightStars(stars);
    const complete = total > 0 && fullCount >= total;
    if (complete) {
      const phase = (this._scene.time.now / 1000) * FULL_PULSE_HZ * Math.PI * 2;
      this._container.setScale(1 + FULL_PULSE_DEPTH * (0.5 + 0.5 * Math.sin(phase)));
    } else if (this._container.scale !== 1) {
      this._container.setScale(1);
    }

    if (fullCount === this._lastFull && total === this._lastTotal) return;
    this._lastFull = fullCount;
    this._lastTotal = total;

    const fraction = total > 0 ? fullCount / total : 0;
    // Mint while building, gold once the wall is full — gold is §5.1's
    // Frenzy/reward colour, so the bar turning gold IS the payoff signal.
    const colour = complete ? COLOUR.sunnyGold : COLOUR.mintGreen;
    this._fill.clear();
    if (fraction > 0) {
      const width = Math.max(BAR_HEIGHT, BAR_WIDTH * fraction);
      this._fill.fillStyle(colour, 1);
      this._fill.fillRoundedRect(
        -BAR_WIDTH / 2,
        -BAR_HEIGHT / 2,
        width,
        BAR_HEIGHT,
        pillRadius(width, BAR_HEIGHT),
      );
    }

    this._label
      .setText(complete ? 'FULL BAND!' : `${fullCount} of ${total} playing`)
      .setColor(complete ? COLOUR_HEX.sunnyGold : COLOUR_HEX.ink);
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
      this._scene.tweens.add({
        targets: star,
        scale: 1,
        duration: STAR_POP_MS,
        ease: EASE.bouncy,
      });
    }
  }
}
