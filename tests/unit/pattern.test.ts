import { describe, expect, it } from 'vitest';

import { compileBar, thinToBeats } from '../../src/audio/orchestra/pattern';

describe('pattern notation', () => {
  it('spreads tokens evenly across sixteen steps', () => {
    expect(compileBar('r t f o').map((e) => e.step)).toEqual([0, 4, 8, 12]);
    expect(compileBar('r . . . . . . t').map((e) => e.step)).toEqual([0, 14]);
  });

  it('rejects bars that do not divide evenly, and unknown tokens', () => {
    expect(() => compileBar('r t f')).toThrow();
    expect(() => compileBar('r q f o')).toThrow();
  });

  it('reads tone roles', () => {
    const [stack, window, bass, degree, hit] = compileBar('f c z 5 x . . .');
    expect(stack).toMatchObject({ kind: 'stack', index: 2 });
    expect(window).toMatchObject({ kind: 'window', index: 2 });
    expect(bass).toMatchObject({ kind: 'bass' });
    expect(degree).toMatchObject({ kind: 'degree', index: 5 });
    expect(hit).toMatchObject({ kind: 'hit' });
  });

  it('applies octave marks and dynamics', () => {
    const [up, down, accent, ghost] = compileBar("r'' t, f! o?");
    expect(up?.transpose).toBe(24);
    expect(down?.transpose).toBe(-12);
    expect(accent?.velocity).toBeGreaterThan(1);
    expect(ghost?.velocity).toBeLessThan(1);
  });

  it('extends a note across holds', () => {
    const [first, second] = compileBar('r - - t');
    expect(first?.lengthSteps).toBe(12);
    expect(second?.lengthSteps).toBe(4);
  });

  it('sounds joined tones together', () => {
    const events = compileBar('a+c - . .');
    expect(events).toHaveLength(2);
    expect(events.every((e) => e.step === 0 && e.lengthSteps === 8)).toBe(true);
  });

  it('thins a part to its on-beat outline', () => {
    const thinned = thinToBeats(compileBar('r t f o r t f o'));
    expect(thinned.map((e) => e.step)).toEqual([0, 4, 8, 12]);
    expect(thinned.every((e) => e.lengthSteps >= 4)).toBe(true);
  });
});
