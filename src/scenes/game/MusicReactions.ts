/**
 * How the wall answers the music: each note kicks its own spinner, now and
 * then throws a note visual off it (the note fountain). Also owns the name pills under the
 * musicians who join at this gig.
 */

import Phaser from 'phaser';

import { musiciansJoining } from '../../audio/scores';
import { audioOrchestra } from '../../audio/AudioOrchestra';
import type { Spinner } from '../../entities/spinner/Spinner';
import { newMusicianCount, type GigDef } from '../../entities/world/gigs.data';
import type { WorldDef } from '../../entities/world/world.types';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { pillRadius } from '../../utils/math';
import { textStyle } from '../../utils/typography';
import { NoteFountain } from './NoteFountain';

/** How hard a spinner kicks when it is sprayed into sounding, and on its own written notes. */
const SPRAY_PULSE = 0.85;
const NOTE_PULSE = 0.6;
/** How hard the whole wall kicks together on each beat of Splash Frenzy. */
const BEAT_PULSE = 0.35;
/** A beat phase that falls by more than this has wrapped round to the next beat. */
const BEAT_WRAP_DROP = 0.5;

const INTRO_LABEL_GAP = 14;
const INTRO_LABEL_DEPTH = 165;
/** The pills show this long after the gig opens, then fade over INTRO_FADE_MS. */
const INTRO_SHOW_MS = 2000;
const INTRO_FADE_MS = 400;
const PILL_HEIGHT = 32;
const PILL_PADDING_X = 12;
const PILL_TAG_GAP = 8;
const PILL_NUDGE_GAP = 4;
const PILL_ALPHA = 0.88;

export class MusicReactions {
  private readonly _fountain: NoteFountain;
  private _lastBeatPhase = 0;

  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _world: WorldDef,
    private readonly _gig: GigDef,
  ) {
    this._fountain = new NoteFountain(_scene);
  }

  /**
   * When the gig opens, each musician who is new at this gig gets one small
   * pill under their instrument: their name, with a tiny gold "NEW". It shows
   * for about two seconds and fades. At the first gig that is the whole trio,
   * which is also how a first-time player learns that the spinners are a
   * band. Pills that would overlap are nudged down so none covers another.
   */
  showGigIntro(spinners: readonly Spinner[]): void {
    const joining = newMusicianCount(this._world, this._gig.index);
    const firstNew = this._gig.band - joining;
    const names = musiciansJoining(this._world.id, firstNew, this._gig.band);
    const placed: Phaser.Geom.Rectangle[] = [];
    names.forEach((name, i) => {
      const spinner = spinners[firstNew + i];
      if (!spinner) return;
      const top = spinner.y + spinner.def.r + INTRO_LABEL_GAP;
      const { pill, width } = this._buildPill(name, spinner.x, top);
      const box = new Phaser.Geom.Rectangle(spinner.x - width / 2, top, width, PILL_HEIGHT);
      while (placed.some((other) => Phaser.Geom.Rectangle.Overlaps(other, box))) {
        pill.y += PILL_HEIGHT + PILL_NUDGE_GAP;
        box.y += PILL_HEIGHT + PILL_NUDGE_GAP;
      }
      placed.push(box);
      this._scene.tweens.add({
        targets: pill,
        alpha: 0,
        delay: INTRO_SHOW_MS,
        duration: INTRO_FADE_MS,
        onComplete: () => pill.destroy(),
      });
    });
  }

  /** One pill, top-centred on (x, y): a dark rounded plate with the name in Cloud and "NEW" in gold. */
  private _buildPill(
    name: string,
    x: number,
    y: number,
  ): { pill: Phaser.GameObjects.Container; width: number } {
    const scene = this._scene;
    const label = scene.add
      .text(0, 0, name, textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const tag = scene.add
      .text(0, 0, 'NEW', textStyle('caption', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const width = PILL_PADDING_X * 2 + label.width + PILL_TAG_GAP + tag.width;
    label.setX(-width / 2 + PILL_PADDING_X);
    tag.setX(label.x + label.width + PILL_TAG_GAP);
    const plate = scene.add.graphics();
    plate.fillStyle(COLOUR.ink, PILL_ALPHA);
    plate.fillRoundedRect(
      -width / 2,
      -PILL_HEIGHT / 2,
      width,
      PILL_HEIGHT,
      pillRadius(width, PILL_HEIGHT),
    );
    const pill = scene.add
      .container(x, y + PILL_HEIGHT / 2, [plate, label, tag])
      .setDepth(INTRO_LABEL_DEPTH);
    return { pill, width };
  }

  /**
   * Makes the wall move with the music: each note a musician plays kicks its
   * own spinner and throws a visual from its instrument, landing on the note.
   * In Splash Frenzy the fountain turns gold and the whole wall pulses
   * on every beat.
   */
  react(time: number, spinners: readonly Spinner[], frenzy: boolean): void {
    this._fountain.update(time);
    const centre = wallCentre(spinners);
    for (const note of audioOrchestra.pollNotes()) {
      const spinner = spinners[note.spinner];
      if (!spinner || spinner.silenced) continue; // a sat-on instrument makes no sound
      spinner.pulse(note.spray ? SPRAY_PULSE : NOTE_PULSE * note.velocity);

      this._fountain.note(spinner, note, centre, frenzy);
    }
    this._pulseOnBeat(spinners, frenzy);
  }

  /** On each beat of Splash Frenzy every spinner kicks together, slightly. */
  private _pulseOnBeat(spinners: readonly Spinner[], frenzy: boolean): void {
    const phase = audioOrchestra.beatPhase();
    const wrapped = this._lastBeatPhase - phase > BEAT_WRAP_DROP;
    this._lastBeatPhase = phase;
    if (!frenzy || !wrapped) return;
    for (const spinner of spinners) spinner.pulse(BEAT_PULSE);
  }
}

/** The middle of the wall, which the fountain's visuals rise away from. */
function wallCentre(spinners: readonly Spinner[]): { x: number; y: number } {
  if (spinners.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const s of spinners) {
    x += s.x;
    y += s.y;
  }
  return { x: x / spinners.length, y: y / spinners.length };
}
