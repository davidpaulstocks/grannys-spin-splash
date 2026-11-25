import { describe, expect, it } from 'vitest';

import { Conductor } from '../../src/audio/orchestra/Conductor';
import type { OrchestraGraph } from '../../src/audio/orchestra/OrchestraGraph';
import { STEPS_PER_BAR } from '../../src/audio/orchestra/pattern';
import type { SampleBank } from '../../src/audio/orchestra/SampleBank';
import { BARS_PER_FORM } from '../../src/audio/orchestra/score.types';
import { isInScale, pitchClass } from '../../src/audio/orchestra/theory';
import { resolveScore, SCORES } from '../../src/audio/scores';

interface Played {
  readonly instrument: string;
  readonly midi: number;
  readonly gain: number;
}

/** Runs a score through its whole form with every musician at the given charge and records each note. */
function perform(
  scoreId: string,
  charge: number,
  flags = { frenzy: false, finale: false },
): Played[] {
  const played: Played[] = [];
  const bank = {
    play: (
      _c: unknown,
      _d: unknown,
      instrument: string,
      midi: number,
      _w: number,
      o: { gain: number },
    ) => played.push({ instrument, midi, gain: o.gain }),
  } as unknown as SampleBank;
  const graph = { channel: () => ({}) } as unknown as OrchestraGraph;
  const score = resolveScore(scoreId);
  const conductor = new Conductor(score, bank);
  const charges = new Array<number>(conductor.seatCount).fill(charge);
  for (let step = 0; step < STEPS_PER_BAR * BARS_PER_FORM; step++) {
    conductor.scheduleStep({} as BaseAudioContext, graph, step, step, { charges, ...flags });
  }
  return played;
}

describe.each(SCORES.map((score) => [score.id, score] as const))('score: %s', (id, score) => {
  it('compiles', () => {
    expect(() => perform(id, 1)).not.toThrow();
  });

  it('stays in its key in every tier, the finale and the frenzy', () => {
    const tonic = pitchClass(score.tonic);
    const everything = [
      ...perform(id, 0.2),
      ...perform(id, 0.6),
      ...perform(id, 1, { frenzy: true, finale: true }),
    ];
    const strays = everything.filter((n) => n.midi > 0 && !isInScale(n.midi, tonic, score.mode));
    expect(strays).toEqual([]);
  });

  it('keeps every pitched note inside a playable range', () => {
    const pitched = perform(id, 1, { frenzy: true, finale: true }).filter((n) => n.midi > 0);
    expect(Math.min(...pitched.map((n) => n.midi))).toBeGreaterThanOrEqual(26);
    expect(Math.max(...pitched.map((n) => n.midi))).toBeLessThanOrEqual(100);
  });

  it('adds music as musicians wake: silent wall < waking < spinning < full speed', () => {
    const counts = [0, 0.2, 0.6, 1].map((charge) => perform(id, charge).length);
    expect(counts[0]).toBeGreaterThan(0); // the bed never stops
    expect(counts[1]).toBeGreaterThan(counts[0] ?? 0);
    expect(counts[2]).toBeGreaterThan(counts[1] ?? 0);
    expect(counts[3]).toBeGreaterThan(counts[2] ?? 0);
  });

  it('gives every seat a unique id and a name to show the player', () => {
    const ids = score.seats.map((seat) => seat.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(score.seats.every((seat) => seat.name.length > 0)).toBe(true);
  });
});
