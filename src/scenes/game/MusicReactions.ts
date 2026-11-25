/**
 * How the wall answers the music: each note kicks its own spinner, now and
 * then floats a note glyph off it, and the first time a spinner sounds its
 * musician is introduced by name. Also owns the pre-play "NEW" labels over
 * the musicians who join at this gig.
 */

import Phaser from 'phaser';

import { musiciansJoining } from '../../audio/scores';
import { audioOrchestra } from '../../audio/AudioOrchestra';
import type { Spinner } from '../../entities/spinner/Spinner';
import { newMusicianCount, type GigDef } from '../../entities/world/gigs.data';
import type { WorldDef } from '../../entities/world/world.types';
import { spawnFloatingText } from '../../ui/FloatingText';
import { spawnNoteGlyph } from '../../ui/NoteGlyph';
import { COLOUR_HEX } from '../../utils/colour';
import { textStyle } from '../../utils/typography';
import { EASE } from '../../utils/tween';

/** How hard a spinner kicks when it is sprayed into sounding, and on its own written notes. */
const SPRAY_PULSE = 0.85;
const NOTE_PULSE = 0.6;
/** One floating note per spinner at most this often — the pulse carries every note, the glyph only some. */
const NOTE_GLYPH_MIN_INTERVAL_MS = 420;
/** Gap below a spinner for its musician's name, clear of the "+N ★" text that rises from above it. */
const MUSICIAN_NAME_OFFSET = 18;

const INTRO_LABEL_GAP = 14;
const INTRO_LABEL_DEPTH = 165;
const INTRO_TAG_BOB_PX = 8;
const INTRO_TAG_BOB_MS = 520;
const INTRO_FADE_MS = 260;

export class MusicReactions {
  /** The "NEW" tags and names over this gig's new musicians, shown until the first squirt. */
  private _introLabels: Phaser.GameObjects.Text[] = [];
  /** Spinners whose musician has already been introduced by name this round. */
  private readonly _joined = new Set<number>();
  private readonly _lastNoteGlyphAt = new Map<number, number>();

  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _world: WorldDef,
    private readonly _gig: GigDef,
  ) {}

  /**
   * Before the first squirt, the musicians who are new at this gig are
   * labelled on their own spinners — "NEW" above, their name below. At the
   * first gig that is the whole trio, which is also how a first-time player
   * learns that the spinners are a band.
   */
  showGigIntro(spinners: readonly Spinner[]): void {
    const joining = newMusicianCount(this._world, this._gig.index);
    const firstNew = this._gig.band - joining;
    const names = musiciansJoining(this._world.id, firstNew, this._gig.band);
    names.forEach((name, i) => {
      const spinner = spinners[firstNew + i];
      if (!spinner) return;
      const tag = this._scene.add
        .text(
          spinner.x,
          spinner.y - spinner.def.r - INTRO_LABEL_GAP,
          'NEW',
          textStyle('buttonS', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
        )
        .setOrigin(0.5, 1)
        .setDepth(INTRO_LABEL_DEPTH);
      const label = this._scene.add
        .text(
          spinner.x,
          spinner.y + spinner.def.r + INTRO_LABEL_GAP,
          name,
          textStyle('buttonS', COLOUR_HEX.cloud, COLOUR_HEX.ink),
        )
        .setOrigin(0.5, 0)
        .setDepth(INTRO_LABEL_DEPTH);
      this._scene.tweens.add({
        targets: tag,
        y: tag.y - INTRO_TAG_BOB_PX,
        duration: INTRO_TAG_BOB_MS,
        ease: EASE.standardOut,
        yoyo: true,
        repeat: -1,
      });
      this._introLabels.push(tag, label);
    });
  }

  /** Fades the intro labels out — called on the first squirt. */
  dismissGigIntro(): void {
    for (const label of this._introLabels) {
      this._scene.tweens.killTweensOf(label);
      this._scene.tweens.add({
        targets: label,
        alpha: 0,
        duration: INTRO_FADE_MS,
        onComplete: () => label.destroy(),
      });
    }
    this._introLabels = [];
  }

  /**
   * Makes the wall move with the music: each note a musician plays kicks its
   * own spinner and, now and then, sends a little note floating off it. The
   * first time a spinner sounds in a round, its musician is introduced by name.
   */
  react(time: number, spinners: readonly Spinner[]): void {
    for (const note of audioOrchestra.pollNotes()) {
      const spinner = spinners[note.spinner];
      if (!spinner) continue;
      spinner.pulse(note.spray ? SPRAY_PULSE : NOTE_PULSE * note.velocity);

      if (!this._joined.has(spinner.id)) {
        this._joined.add(spinner.id);
        spawnFloatingText(
          this._scene,
          spinner.x,
          spinner.y + spinner.def.r + MUSICIAN_NAME_OFFSET,
          audioOrchestra.seatName(note.spinner),
          COLOUR_HEX.cloud,
        );
      }
      const last = this._lastNoteGlyphAt.get(spinner.id) ?? -Infinity;
      if (time - last < NOTE_GLYPH_MIN_INTERVAL_MS) continue;
      this._lastNoteGlyphAt.set(spinner.id, time);
      spawnNoteGlyph(
        this._scene,
        spinner.x + (Math.random() - 0.5) * spinner.def.r,
        spinner.y - spinner.def.r,
        Phaser.Display.Color.HexStringToColor(spinner.def.colors[0] ?? '#ffffff').color,
      );
    }
  }
}
