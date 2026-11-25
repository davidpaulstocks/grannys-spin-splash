import { describe, expect, it } from 'vitest';

import {
  bassTone,
  chord,
  isInScale,
  pitchAtOrAbove,
  pitchClass,
  playbackRateFor,
  scaleDegree,
  stackedTone,
  windowVoicing,
} from '../../src/audio/orchestra/theory';

describe('theory', () => {
  it('parses note names including accidentals', () => {
    expect(pitchClass('C')).toBe(0);
    expect(pitchClass('F#')).toBe(6);
    expect(pitchClass('Bb')).toBe(10);
    expect(() => pitchClass('H')).toThrow();
  });

  it('parses chord symbols, qualities and slash basses', () => {
    expect(chord('G')).toEqual({ root: 7, quality: 'maj', bass: 7 });
    expect(chord('Em')).toEqual({ root: 4, quality: 'min', bass: 4 });
    expect(chord('D/F#')).toEqual({ root: 2, quality: 'maj', bass: 6 });
    expect(chord('Cmaj7').quality).toBe('maj7');
    expect(chord('A7').quality).toBe('dom7');
    expect(chord('Bm7').quality).toBe('min7');
    expect(chord('Dsus4').quality).toBe('sus4');
    expect(() => chord('Gdim')).toThrow();
  });

  it('places a pitch class at or above a floor', () => {
    expect(pitchAtOrAbove(7, 60)).toBe(67);
    expect(pitchAtOrAbove(0, 60)).toBe(60);
    expect(pitchAtOrAbove(11, 60)).toBe(71);
  });

  it('stacks chord tones from the root, with the octave standing in for a missing seventh', () => {
    const g = chord('G');
    expect([0, 1, 2, 3, 4].map((i) => stackedTone(g, i, 55))).toEqual([55, 59, 62, 67, 67]);
    const a7 = chord('A7');
    expect(stackedTone(a7, 3, 57)).toBe(67);
  });

  it('voices successive chords inside one octave so they move by small steps', () => {
    expect(windowVoicing(chord('G'), 55)).toEqual([55, 59, 62]);
    expect(windowVoicing(chord('C'), 55)).toEqual([55, 60, 64]);
    expect(windowVoicing(chord('D'), 55)).toEqual([57, 62, 66]);
  });

  it('uses the slash bass rather than the root', () => {
    expect(bassTone(chord('D/F#'), 31)).toBe(42);
    expect(bassTone(chord('G'), 31)).toBe(31);
  });

  it('resolves scale degrees in major and minor', () => {
    expect([1, 3, 5, 7].map((d) => scaleDegree(7, 'major', d, 67))).toEqual([67, 71, 74, 78]);
    expect([1, 3, 5, 7].map((d) => scaleDegree(9, 'minor', d, 57))).toEqual([57, 60, 64, 67]);
    expect(() => scaleDegree(0, 'major', 8, 60)).toThrow();
  });

  it('knows which notes belong to a key', () => {
    expect(isInScale(66, 7, 'major')).toBe(true); // F# in G major
    expect(isInScale(65, 7, 'major')).toBe(false); // F natural is not
  });

  it('retunes a sample to a target note, correcting for a sharp recording', () => {
    expect(playbackRateFor(69, 69)).toBeCloseTo(1);
    expect(playbackRateFor(81, 69)).toBeCloseTo(2);
    expect(playbackRateFor(69, 69, 100)).toBeCloseTo(Math.pow(2, -1 / 12));
  });
});
