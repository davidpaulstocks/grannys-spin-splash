/**
 * The band meter — the goal, shown as a thing you can count. One light per
 * musician; each lights as a musician is brought wide awake (its spinner at
 * full speed), filling left to right. Three stars stand above the lights
 * that earn them, so "how many more for the next star" is read off the
 * meter, not worked out.
 *
 * It replaced a plain progress bar with "n of 12 playing" under it
 * (2026-11-25, direct user feedback: "I'm not entirely sure what the purpose
 * of the game is… what I'm trying to accomplish"). A bar says how full
 * something is; it does not say what the something is.
 */

import Phaser from 'phaser';

import { awakeNeededForStars } from '../entities/world/gigs.data';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { drawStarIcon } from './icons';

const TRACK_WIDTH = 468;
const TRACK_HEIGHT = 34;
const TRACK_PADDING_X = 16;
const MAX_LIGHT_RADIUS = 11;
/** Gap kept between neighbouring lights, however many there are. */
const LIGHT_GAP = 4;
const LIGHT_OFF = 0xd8d4c6;
const LIGHT_POP_SCALE = 1.6;
const LIGHT_POP_MS = 240;

const STAR_RADIUS = 15;
const STAR_OUTLINE_PX = 4;
/** Stars sit this far above the track's centre, on a short stalk down to their light. */
const STAR_LIFT = 36;
const STALK_WIDTH = 3;
/** Centre-to-centre spacing of stars that share one light. */
const SHARED_STAR_PITCH = 36;
const STAR_POP_SCALE = 1.8;
const STAR_POP_MS = 320;

const LABEL_GAP = 10;
/** Pulse applied to the whole meter while the full band is awake. */
const FULL_PULSE_HZ = 2.6;
const FULL_PULSE_DEPTH = 0.05;

export class BandMeter {
  private readonly _scene: Phaser.Scene;
  private readonly _container: Phaser.GameObjects.Container;
  private readonly _label: Phaser.GameObjects.Text;
  private _lights: Phaser.GameObjects.Arc[] = [];
  private _stars: Phaser.GameObjects.Graphics[] = [];
  private _total = -1;
  private _awake = -1;
  private _litStars = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this._scene = scene;
    const track = scene.add.graphics();
    const radius = pillRadius(TRACK_WIDTH, TRACK_HEIGHT);
    track.fillStyle(COLOUR.cloud, 0.94);
    track.fillRoundedRect(-TRACK_WIDTH / 2, -TRACK_HEIGHT / 2, TRACK_WIDTH, TRACK_HEIGHT, radius);
    track.lineStyle(4, COLOUR.ink, 1);
    track.strokeRoundedRect(-TRACK_WIDTH / 2, -TRACK_HEIGHT / 2, TRACK_WIDTH, TRACK_HEIGHT, radius);

    this._label = scene.add
      .text(
        0,
        TRACK_HEIGHT / 2 + LABEL_GAP,
        '',
        textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
      )
      .setOrigin(0.5, 0);
    this._container = scene.add.container(x, y, [track, this._label]);
  }

  /**
   * Call once per frame with how many musicians are wide awake, how many
   * there are, and the stars locked in so far. Rebuilds the lights only when
   * the band size changes, and redraws only on a change of count.
   */
  update(awake: number, total: number, stars = 0): void {
    if (total !== this._total) this._build(total);
    this._lightStars(stars);

    const complete = total > 0 && awake >= total;
    if (complete) {
      const phase = (this._scene.time.now / 1000) * FULL_PULSE_HZ * Math.PI * 2;
      this._container.setScale(1 + FULL_PULSE_DEPTH * (0.5 + 0.5 * Math.sin(phase)));
    } else if (this._container.scale !== 1) {
      this._container.setScale(1);
    }
    if (awake === this._awake) return;

    this._lights.forEach((light, i) => {
      const lit = i < awake;
      const wasLit = i < this._awake;
      light.setFillStyle(lit ? COLOUR.sunnyGold : LIGHT_OFF);
      if (lit && !wasLit) {
        light.setScale(LIGHT_POP_SCALE);
        this._scene.tweens.add({
          targets: light,
          scale: 1,
          duration: LIGHT_POP_MS,
          ease: EASE.bouncy,
        });
      }
    });
    this._awake = awake;
    this._label
      .setText(complete ? 'FULL BAND!' : `${awake} of ${total} awake`)
      .setColor(complete ? COLOUR_HEX.sunnyGold : COLOUR_HEX.cloud);
  }

  /** Lays out one light per musician and the three stars above the lights that earn them. */
  private _build(total: number): void {
    for (const old of [...this._lights, ...this._stars]) old.destroy();
    this._lights = [];
    this._stars = [];
    this._total = total;
    this._awake = -1;
    this._litStars = 0;
    if (total <= 0) return;

    const usable = TRACK_WIDTH - TRACK_PADDING_X * 2;
    const pitch = usable / total;
    const lightRadius = Math.min(MAX_LIGHT_RADIUS, (pitch - LIGHT_GAP) / 2);
    const xOf = (index: number): number => -usable / 2 + pitch * (index + 0.5);

    for (let i = 0; i < total; i++) {
      const light = this._scene.add
        .circle(xOf(i), 0, lightRadius, LIGHT_OFF)
        .setStrokeStyle(2, COLOUR.ink);
      this._lights.push(light);
      this._container.add(light);
    }
    const thresholds = awakeNeededForStars(total);
    thresholds.forEach((needed, i) => {
      // In a small band two stars can be earned by the same light; they then
      // stand side by side above it instead of one hiding the other.
      const sharing = thresholds.filter((other) => other === needed).length;
      const place = thresholds.slice(0, i).filter((other) => other === needed).length;
      const x = xOf(needed - 1) + (place - (sharing - 1) / 2) * SHARED_STAR_PITCH;
      const star = this._scene.add.graphics({ x, y: -STAR_LIFT });
      star.fillStyle(COLOUR.ink, 1);
      star.fillRect(-STALK_WIDTH / 2, STAR_RADIUS * 0.5, STALK_WIDTH, STAR_LIFT - TRACK_HEIGHT / 2);
      this._drawStar(star, false);
      this._stars.push(star);
      this._container.add(star);
    });
  }

  private _drawStar(star: Phaser.GameObjects.Graphics, lit: boolean): void {
    drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
    drawStarIcon(star, STAR_RADIUS, lit ? COLOUR.sunnyGold : LIGHT_OFF);
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
