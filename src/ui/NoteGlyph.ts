/**
 * A little music note that floats up off a spinner when its musician plays —
 * the visible half of "every spinner is an instrument". Drawn, not typeset:
 * the game's font has no music symbols, and a drawn note can be tinted to
 * match the spinner it came from.
 */

import Phaser from 'phaser';

import { COLOUR } from '../utils/colour';
import { EASE } from '../utils/tween';

const HEAD_WIDTH = 13;
const HEAD_HEIGHT = 10;
const STEM_HEIGHT = 24;
const STEM_WIDTH = 3;
const OUTLINE_PX = 3;

const RISE_PX = 58;
const DRIFT_PX = 22;
const LIFE_MS = 820;
/** Drawn small and scaled up, so the outline scales with it. */
const NOTE_SCALE = 1.35;
/** Notes sit above the spinners and the jet, below the HUD's floating text. */
const NOTE_DEPTH = 160;
/** A hard cap on notes alive at once — a full wall plays far more notes than the screen should carry. */
const MAX_ALIVE = 14;

let _alive = 0;

function drawNote(g: Phaser.GameObjects.Graphics, colour: number): void {
  const stemX = HEAD_WIDTH / 2 - STEM_WIDTH / 2;
  // Ink underlay first, slightly larger, so the note reads on any background.
  g.fillStyle(COLOUR.ink, 0.9);
  g.fillEllipse(0, 0, HEAD_WIDTH + OUTLINE_PX * 2, HEAD_HEIGHT + OUTLINE_PX * 2);
  g.fillRect(
    stemX - OUTLINE_PX / 2,
    -STEM_HEIGHT - OUTLINE_PX / 2,
    STEM_WIDTH + OUTLINE_PX,
    STEM_HEIGHT + OUTLINE_PX,
  );
  g.fillTriangle(
    stemX,
    -STEM_HEIGHT - OUTLINE_PX,
    stemX + 14,
    -STEM_HEIGHT + 9,
    stemX,
    -STEM_HEIGHT + 13,
  );

  g.fillStyle(colour, 1);
  g.fillEllipse(0, 0, HEAD_WIDTH, HEAD_HEIGHT);
  g.fillRect(stemX, -STEM_HEIGHT, STEM_WIDTH, STEM_HEIGHT);
  g.fillTriangle(stemX, -STEM_HEIGHT, stemX + 10, -STEM_HEIGHT + 8, stemX, -STEM_HEIGHT + 9);
}

/** Spawns one note at (x, y) in `colour`; it rises, drifts, fades and removes itself. No-op past the alive cap. */
export function spawnNoteGlyph(scene: Phaser.Scene, x: number, y: number, colour: number): void {
  if (_alive >= MAX_ALIVE) return;
  _alive++;
  const note = scene.add.graphics({ x, y }).setDepth(NOTE_DEPTH).setScale(0.4);
  note.setRotation((Math.random() - 0.5) * 0.5);
  drawNote(note, colour);
  const release = (): void => {
    _alive = Math.max(0, _alive - 1);
  };
  // If the scene shuts down mid-flight the tween never completes; the
  // object's own destroy event still fires, so the count can't leak.
  note.once(Phaser.GameObjects.Events.DESTROY, release);
  scene.tweens.add({ targets: note, scale: NOTE_SCALE, duration: 140, ease: EASE.bouncy });
  scene.tweens.add({
    targets: note,
    x: x + (Math.random() - 0.5) * 2 * DRIFT_PX,
    y: y - RISE_PX,
    alpha: 0,
    duration: LIFE_MS,
    ease: EASE.standardOut,
    onComplete: () => note.destroy(),
  });
}
