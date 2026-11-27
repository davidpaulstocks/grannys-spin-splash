import { describe, expect, it } from 'vitest';

import {
  BLAST_BURST_MS,
  BLAST_GAP_MS,
  IDLE_BURST_MS,
  IDLE_PERIOD_MS,
  REVEAL_LAYOUT,
  canSkip,
  demoPhase,
  easeAngle,
  nozzlePoint,
  revealBands,
  revealGunScale,
  revealTimeline,
} from '../../src/ui/reveal/revealTiming';

/** The logical screen height (config.ts GAME_HEIGHT; not imported because config pulls in Phaser). */
const SCREEN_HEIGHT = 720;

describe('revealTimeline', () => {
  it('runs the film, then the blast, then the numbers, in order', () => {
    for (const rarity of ['common', 'rare', 'epic', 'legendary', 'mythic'] as const) {
      const t = revealTimeline(rarity);
      expect(t.film.fireAt).toBeGreaterThan(t.film.panEnd);
      expect(t.film.pullAt).toBeGreaterThan(t.film.fireAt);
      expect(t.nameAt).toBeGreaterThan(t.film.pullAt);
      expect(t.tagAt).toBeGreaterThan(t.nameAt);
      expect(t.film.shrinkAt).toBeGreaterThan(t.tagAt);
      expect(t.beat2At).toBe(t.film.shrinkEnd);
      expect(t.beat3At).toBeGreaterThan(t.beat2At);
      expect(t.ownedButtonsAt).toBeGreaterThan(t.beat3At);
      expect(t.previewButtonsAt).toBeGreaterThan(t.beat3At);
    }
  });

  it('pans the rarest guns more slowly', () => {
    expect(revealTimeline('legendary').film.panEnd).toBeGreaterThan(
      revealTimeline('epic').film.panEnd,
    );
    expect(revealTimeline('epic').film.panEnd).toBeGreaterThan(
      revealTimeline('common').film.panEnd,
    );
  });

  it('reaches the buttons in about 6 to 7 seconds for a common gun and about 8 for a legendary one', () => {
    const common = revealTimeline('common').ownedButtonsAt;
    const legendary = revealTimeline('legendary').ownedButtonsAt;
    expect(common).toBeGreaterThan(6000);
    expect(common).toBeLessThan(7200);
    expect(legendary).toBeGreaterThan(7500);
    expect(legendary).toBeLessThan(8500);
  });

  it('allows a skip only once the pull-back has started', () => {
    const t = revealTimeline('epic');
    expect(canSkip(t.film.fireAt, t)).toBe(false);
    expect(canSkip(t.film.pullAt - 1, t)).toBe(false);
    expect(canSkip(t.film.pullAt, t)).toBe(true);
  });
});

describe('demoPhase', () => {
  it('blasts at each target in turn with a short gap between', () => {
    const slot = BLAST_BURST_MS + BLAST_GAP_MS;
    expect(demoPhase(0, 'blast', 3)).toMatchObject({ fireIndex: 0, firing: true });
    expect(demoPhase(BLAST_BURST_MS + 1, 'blast', 3).firing).toBe(false);
    expect(demoPhase(slot + 10, 'blast', 3)).toMatchObject({ fireIndex: 1, firing: true });
    expect(demoPhase(slot * 3 + 10, 'blast', 3).fireIndex).toBe(0);
  });

  it('turns to the next target during the gap before it', () => {
    const inGap = demoPhase(BLAST_BURST_MS + BLAST_GAP_MS - 10, 'blast', 3);
    expect(inGap.firing).toBe(false);
    expect(inGap.aimIndex).toBe(1);
  });

  it('idles: rests, then one short burst a period, at the next target', () => {
    expect(demoPhase(0, 'idle', 3).firing).toBe(false);
    expect(demoPhase(IDLE_PERIOD_MS - IDLE_BURST_MS + 1, 'idle', 3).firing).toBe(true);
    expect(demoPhase(IDLE_PERIOD_MS + 1, 'idle', 3)).toMatchObject({ fireIndex: 1, firing: false });
  });

  it('copes with no targets and negative time', () => {
    expect(demoPhase(-5, 'blast', 0).fireIndex).toBe(0);
  });
});

describe('nozzlePoint', () => {
  const frame = { width: 200, height: 100 };
  const centre = { x: 300, y: 200 };

  it('puts a nozzle at the right edge half a picture to the right when level', () => {
    const p = nozzlePoint(centre, frame, { x: 200, y: 50 }, 2, 0);
    expect(p.x).toBeCloseTo(300 + 200);
    expect(p.y).toBeCloseTo(200);
  });

  it('turns with the gun', () => {
    const p = nozzlePoint(centre, frame, { x: 200, y: 50 }, 1, Math.PI / 2);
    expect(p.x).toBeCloseTo(300);
    expect(p.y).toBeCloseTo(300);
  });
});

describe('easeAngle', () => {
  it('moves toward the target and never past it', () => {
    const a = easeAngle(0, 1, 16, 14);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(1);
    expect(easeAngle(0, 1, 5000, 14)).toBeCloseTo(1, 3);
  });
});

describe('revealGunScale', () => {
  it('fits the box, with bigger guns bigger', () => {
    const small = revealGunScale(400, 200, 1);
    const big = revealGunScale(400, 200, 1.5);
    expect(big).toBeGreaterThan(small);
    expect(400 * big).toBeLessThanOrEqual(REVEAL_LAYOUT.gun.maxW);
    expect(200 * big).toBeLessThanOrEqual(REVEAL_LAYOUT.gun.maxH);
  });
});

describe('layout', () => {
  it('keeps 16 px between every band and stays on screen', () => {
    const bands = revealBands();
    for (let i = 1; i < bands.length; i++) {
      const gap = (bands[i]?.top ?? 0) - (bands[i - 1]?.bottom ?? 0);
      expect(gap, `${bands[i - 1]?.name} to ${bands[i]?.name}`).toBeGreaterThanOrEqual(
        REVEAL_LAYOUT.minGap,
      );
    }
    expect(bands[0]?.top).toBeGreaterThan(0);
    expect(bands[bands.length - 1]?.bottom).toBeLessThan(SCREEN_HEIGHT);
  });

  it('keeps the targets to the right of the gun', () => {
    for (const t of REVEAL_LAYOUT.targets) {
      expect(t.x - REVEAL_LAYOUT.targetRadius).toBeGreaterThan(
        REVEAL_LAYOUT.gun.x + REVEAL_LAYOUT.gun.maxW / 2,
      );
    }
  });
});
