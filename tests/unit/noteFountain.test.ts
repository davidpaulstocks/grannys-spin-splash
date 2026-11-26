import { describe, expect, it } from 'vitest';

import { SpinnerState } from '../../src/entities/spinner/spinner.types';
import { poseAt, type MotionParams } from '../../src/scenes/game/noteMotion';
import {
  CLEF_CHANCE,
  HUD_BAND_Y,
  MAX_LIVE_VISUALS,
  SECTION_STYLE,
  decideCap,
  hudFade,
  noteScale,
  pickShape,
  priorityFor,
  shouldSpawn,
  throwsNotes,
} from '../../src/scenes/game/noteFountainRules';

const count = (state: SpinnerState, live = 0, n = 120): number =>
  Array.from({ length: n }, (_, i) => i).filter((i) => shouldSpawn(state, i, live)).length;

describe('section styles', () => {
  it('gives every section but percussion notes to throw', () => {
    expect(throwsNotes(SECTION_STYLE.percussion)).toBe(false);
    expect(throwsNotes(SECTION_STYLE.keys)).toBe(true);
    expect(SECTION_STYLE.keys.shapes).toEqual(['pair']);
    expect(SECTION_STYLE.brass.scale).toBeGreaterThan(SECTION_STYLE.strings.scale);
    expect(SECTION_STYLE.bass.scale).toBeGreaterThan(SECTION_STYLE.brass.scale);
  });

  it('keeps every visual alive between 600 and 1100 ms', () => {
    for (const style of Object.values(SECTION_STYLE)) {
      expect(style.lifeMs).toBeGreaterThanOrEqual(600);
      expect(style.lifeMs).toBeLessThanOrEqual(1100);
    }
  });
});

describe('thinning', () => {
  it('gives about a third of slow notes, most medium and all full notes a visual', () => {
    expect(count(SpinnerState.SLOW)).toBe(40);
    expect(count(SpinnerState.MEDIUM)).toBe(90);
    expect(count(SpinnerState.FULL)).toBe(120);
    expect(count(SpinnerState.STOPPED)).toBe(0);
  });

  it('thins slow and medium near the cap but never full', () => {
    const near = MAX_LIVE_VISUALS;
    expect(count(SpinnerState.SLOW, near)).toBe(0);
    expect(count(SpinnerState.MEDIUM, near)).toBe(60);
    expect(count(SpinnerState.FULL, near)).toBe(120);
  });
});

describe('shapes', () => {
  it('cycles a section through its shapes', () => {
    const style = SECTION_STYLE.strings;
    expect(pickShape(style, SpinnerState.MEDIUM, 0, 0)).toBe('quaver');
    expect(pickShape(style, SpinnerState.MEDIUM, 1, 0)).toBe('crotchet');
  });

  it('allows the treble clef only from an instrument at full speed', () => {
    const style = SECTION_STYLE.woodwind;
    expect(pickShape(style, SpinnerState.FULL, 0, CLEF_CHANCE / 2)).toBe('clef');
    expect(pickShape(style, SpinnerState.FULL, 0, CLEF_CHANCE * 2)).not.toBe('clef');
    expect(pickShape(style, SpinnerState.MEDIUM, 0, 0)).not.toBe('clef');
  });

  it('draws harder notes bigger', () => {
    expect(noteScale(1, SECTION_STYLE.strings)).toBeGreaterThan(
      noteScale(0, SECTION_STYLE.strings),
    );
  });
});

describe('the cap', () => {
  const live = (priority: number, size: number, age: number) => ({ priority, size, age });

  it('admits freely below the cap', () => {
    expect(decideCap([live(1, 1, 5)], 1, 3)).toEqual({ admit: true, evict: -1 });
  });

  it('drops the lowest priority, then smallest, then oldest', () => {
    const all = [live(3, 1, 900), live(1, 1, 100), live(1, 0.7, 50), live(1, 0.7, 400)];
    expect(decideCap(all, 2, 4)).toEqual({ admit: true, evict: 3 });
  });

  it('drops the newcomer when everything alive matters more', () => {
    const all = [live(3, 1, 10), live(3, 1, 20)];
    expect(decideCap(all, 1, 2).admit).toBe(false);
  });

  it('ranks squirts and full-speed notes above the rest', () => {
    expect(priorityFor(SpinnerState.SLOW, true)).toBeGreaterThan(
      priorityFor(SpinnerState.MEDIUM, false),
    );
    expect(priorityFor(SpinnerState.FULL, false)).toBeGreaterThan(
      priorityFor(SpinnerState.MEDIUM, false),
    );
    expect(priorityFor(SpinnerState.MEDIUM, false)).toBeGreaterThan(
      priorityFor(SpinnerState.SLOW, false),
    );
  });
});

describe('the HUD band', () => {
  it('hides anything at or above the HUD band and shows it clear of it', () => {
    expect(hudFade(HUD_BAND_Y)).toBe(0);
    expect(hudFade(0)).toBe(0);
    expect(hudFade(HUD_BAND_Y + 500)).toBe(1);
  });
});

describe('motion', () => {
  const base: MotionParams = {
    kind: 'rise',
    ox: 100,
    oy: 300,
    dx: 0,
    dy: -1,
    dist: 70,
    amp: 0,
    rot: 0,
    scale: 1,
  };

  it('rises away from where it started and fades out', () => {
    const mid = poseAt(base, 0.5);
    expect(mid.y).toBeLessThan(300);
    expect(poseAt(base, 0.99).alpha).toBeLessThan(0.1);
    expect(poseAt(base, 0.1).alpha).toBe(1);
  });

  it('steps up the stairs in whole steps', () => {
    const stairs: MotionParams = { ...base, kind: 'stairs', dx: 1, dy: -0.85, dist: 0, amp: 14 };
    expect(poseAt(stairs, 0.01).x).toBe(poseAt(stairs, 0.2).x);
    expect(poseAt(stairs, 0.3).x).toBeGreaterThan(poseAt(stairs, 0.2).x);
  });
});
