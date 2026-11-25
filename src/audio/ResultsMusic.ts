/**
 * The results screen's handful of notes. The orchestra itself has stopped by
 * then — its closing chord is still ringing — so these are played straight
 * from the instrument bank: a glockenspiel note per star, climbing the home
 * chord, with a cymbal on the third.
 */

import { audioBus } from './AudioBus';
import { sampleBank } from './orchestra/SampleBank';

/** G major, climbing: the same home chord Garden resolves on, and bright in any key that follows it. */
const STAR_NOTES = [79, 83, 86] as const;
const HARP_OFFSET = -12;

/** The chime for the `index`-th star (0-based) landing. */
export function playStarChime(index: number): void {
  const ctx = audioBus.context;
  const master = audioBus.master;
  if (!ctx || !master || !audioBus.ready) return;
  const midi = STAR_NOTES[Math.min(index, STAR_NOTES.length - 1)] ?? STAR_NOTES[0];
  const at = ctx.currentTime + 0.01;
  sampleBank.play(ctx, master, 'glock', midi, at, { gain: 0.34 });
  sampleBank.play(ctx, master, 'harp', midi + HARP_OFFSET, at, { gain: 0.3 });
  if (index >= STAR_NOTES.length - 1) {
    sampleBank.play(ctx, master, 'cymbal_crash', 0, at, { gain: 0.22 });
    sampleBank.play(ctx, master, 'triangle', 0, at, { gain: 0.3 });
  }
}
