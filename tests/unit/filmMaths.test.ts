import { describe, expect, it } from 'vitest';

import {
  CLOSE_LENGTH_SCREENS,
  CONTENT_FRACTION,
  FILM_TIMING,
  HERO_CENTRE_Y,
  HERO_LENGTH_SHARE,
  NOZZLE_VIEW_X,
  PAN_START_INSET_PX,
  RECOIL_MS,
  SHAKE_MS,
  cubicInOut,
  cubicOut,
  filmCues,
  filmGeometry,
  filmPose,
  lerpZoom,
  panStartFocus,
  recoilAt,
  flashAlphaAt,
  FLASH_END_MS,
  FLASH_MAX_ALPHA,
  FLASH_PEAK_MS,
  TENSE_PX,
  screenPointOf,
  shakeAt,
  sineInOut,
} from '../../src/ui/reveal/filmMaths';

const SCREEN = { w: 1280, h: 720 };
const PLACE = { x: 330, y: 207 };
const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
/** A 1152x768 hero picture with the nozzle near the right edge, a little above centre. */
const geometry = () => filmGeometry(1152, 768, { x: 1059, y: 309 }, SCREEN, PLACE, 0.48);

describe('filmCues', () => {
  it('runs pan, fire, pull-back, hero hold, shrink in order', () => {
    for (const r of RARITIES) {
      const c = filmCues(r);
      expect(c.fireAt).toBeGreaterThan(c.panEnd);
      expect(c.pullAt).toBeGreaterThan(c.fireAt);
      expect(c.pullAt).toBeLessThan(c.fireEnd + 1);
      expect(c.pullEnd).toBeGreaterThan(c.pullAt);
      expect(c.shrinkAt).toBeGreaterThan(c.pullEnd);
      expect(c.shrinkEnd).toBeGreaterThan(c.shrinkAt);
    }
  });

  it('pans about 1.6 s for a common gun and up to about 2.4 s for a legendary one, rarer means slower', () => {
    expect(FILM_TIMING.common.panMs).toBe(1600);
    expect(FILM_TIMING.legendary.panMs).toBe(2400);
    expect(FILM_TIMING.rare.panMs).toBeGreaterThan(FILM_TIMING.common.panMs);
    expect(FILM_TIMING.epic.panMs).toBeGreaterThan(FILM_TIMING.rare.panMs);
    expect(FILM_TIMING.legendary.panMs).toBeGreaterThan(FILM_TIMING.epic.panMs);
  });

  it('holds a third of a second at the nozzle before firing', () => {
    const c = filmCues('common');
    expect(c.fireAt - c.panEnd).toBeGreaterThanOrEqual(300);
    expect(c.fireAt - c.panEnd).toBeLessThanOrEqual(400);
  });
});

describe('filmGeometry', () => {
  it('makes the whole gun its close-up length in the close-up and 800 px in the hero shot', () => {
    const g = geometry();
    expect(g.imageW * CONTENT_FRACTION * g.closeZoom).toBeCloseTo(
      CLOSE_LENGTH_SCREENS * SCREEN.w,
      5,
    );
    expect(g.imageW * CONTENT_FRACTION * g.heroZoom).toBeCloseTo(HERO_LENGTH_SHARE * SCREEN.w, 5);
    expect(HERO_LENGTH_SHARE * SCREEN.w).toBe(800);
  });

  it('measures the nozzle from the picture centre', () => {
    const g = geometry();
    expect(g.nozzle).toEqual({ x: 1059 - 576, y: 309 - 384 });
  });

  it('scales a small picture to a hero picture by plain multiplication (the anchor maps across)', () => {
    const small = filmGeometry(384, 256, { x: 353, y: 103 }, SCREEN, PLACE, 0.97);
    const hero = filmGeometry(1152, 768, { x: 1059, y: 309 }, SCREEN, PLACE, 0.485);
    expect(hero.nozzle.x).toBeCloseTo(small.nozzle.x * 3, 5);
    expect(hero.nozzle.y).toBeCloseTo(small.nozzle.y * 3, 5);
    // The same gun fills the same share of the screen at the same shot, whichever picture it is.
    expect(hero.imageW * hero.closeZoom).toBeCloseTo(small.imageW * small.closeZoom, 5);
  });
});

describe('filmPose', () => {
  it('starts dark and fades the gun up', () => {
    const g = geometry();
    expect(filmPose('common', 0, g).imageAlpha).toBe(0);
    expect(filmPose('common', 100, g).imageAlpha).toBe(0);
    expect(filmPose('common', 800, g).imageAlpha).toBe(1);
  });

  it('shows the gun so large that only part of it fits, its left end near the screen edge at the start', () => {
    const g = geometry();
    const p = filmPose('common', 0, g);
    const left = screenPointOf(p, { x: -(g.imageW * CONTENT_FRACTION) / 2, y: 0 });
    expect(left.x).toBeCloseTo(PAN_START_INSET_PX, 3);
    const right = screenPointOf(p, { x: (g.imageW * CONTENT_FRACTION) / 2, y: 0 });
    // The nozzle end starts off the right-hand edge, so the pan has something to arrive at.
    expect(right.x).toBeGreaterThan(SCREEN.w);
  });

  it('ends the pan with the nozzle on screen with room to fire, mid-screen vertically', () => {
    const g = geometry();
    for (const r of RARITIES) {
      const c = filmCues(r);
      const p = filmPose(r, c.panEnd, g);
      const n = screenPointOf(p, g.nozzle);
      expect(n.x).toBeCloseTo(SCREEN.w * NOZZLE_VIEW_X, 3);
      expect(n.y).toBeCloseTo(SCREEN.h / 2, 3);
      expect(n.x).toBeLessThan(SCREEN.w * 0.7);
    }
  });

  it('holds still at the nozzle until the shot is fired', () => {
    const g = geometry();
    const c = filmCues('common');
    const a = screenPointOf(filmPose('common', c.panEnd, g), g.nozzle);
    const b = screenPointOf(filmPose('common', c.fireAt - 1, g), g.nozzle);
    expect(b.x).toBeCloseTo(a.x, 3);
    expect(b.y).toBeCloseTo(a.y, 3);
  });

  it('pans in one direction (the nozzle never drifts back) with no jumps between frames', () => {
    const g = geometry();
    const c = filmCues('legendary');
    let last = screenPointOf(filmPose('legendary', 0, g), g.nozzle).x;
    let biggest = 0;
    for (let t = 16; t <= c.panEnd; t += 16) {
      const x = screenPointOf(filmPose('legendary', t, g), g.nozzle).x;
      expect(x).toBeLessThanOrEqual(last + 1e-6);
      biggest = Math.max(biggest, last - x);
      last = x;
    }
    // Sine in-out: the fastest frame is well under a tenth of the whole travel.
    const travel =
      screenPointOf(filmPose('legendary', 0, g), g.nozzle).x - SCREEN.w * NOZZLE_VIEW_X;
    expect(biggest).toBeLessThan(travel * 0.1);
  });

  it('is continuous at every cue, with no jump of more than a pixel and a half between neighbouring milliseconds', () => {
    const g = geometry();
    for (const r of RARITIES) {
      const c = filmCues(r);
      for (const at of [c.panEnd, c.fireAt, c.pullAt, c.pullEnd, c.shrinkAt, c.shrinkEnd]) {
        const before = filmPose(r, at - 1, g);
        const after = filmPose(r, at + 1, g);
        // Shake and recoil begin at fireAt; they are zero there, so the picture is still continuous.
        expect(Math.abs(after.x - before.x)).toBeLessThan(40);
        expect(Math.abs(after.y - before.y)).toBeLessThan(40);
        expect(Math.abs(Math.log(after.zoom / before.zoom))).toBeLessThan(0.02);
      }
    }
  });

  it('pulls back to the whole gun, centred, 800 px long, with the vignette gone', () => {
    const g = geometry();
    const c = filmCues('epic');
    const p = filmPose('epic', c.pullEnd, g);
    expect(p.shot).toBe('hero');
    expect(p.x).toBeCloseTo(SCREEN.w / 2, 3);
    expect(p.y).toBeCloseTo(HERO_CENTRE_Y, 3);
    expect(g.imageW * CONTENT_FRACTION * p.zoom).toBeCloseTo(800, 0);
    expect(p.vignette).toBe(0);
  });

  it('zooms out fast: most of the pull-back happens in its first half', () => {
    const g = geometry();
    const c = filmCues('common');
    const mid = filmPose('common', (c.pullAt + c.pullEnd) / 2, g);
    const progress = Math.log(g.closeZoom / mid.zoom) / Math.log(g.closeZoom / g.heroZoom);
    expect(progress).toBeGreaterThan(0.8);
  });

  it('shrinks the gun to its place and ends there, still', () => {
    const g = geometry();
    for (const r of RARITIES) {
      const c = filmCues(r);
      const end = filmPose(r, c.shrinkEnd + 50, g);
      expect(end.shot).toBe('done');
      expect(end.x).toBeCloseTo(PLACE.x, 3);
      expect(end.y).toBeCloseTo(PLACE.y, 3);
      expect(end.zoom).toBeCloseTo(g.placeZoom, 5);
      // Everything but the clock readings (charge, sinceFire) is the same however late you ask.
      expect({ ...filmPose(r, 1e9, g), sinceFire: 0 }).toEqual({ ...end, sinceFire: 0 });
    }
  });

  it('streams the real projectile from the pull-back to the end of the hero hold, and the sheen sweeps only during the pan', () => {
    const g = geometry();
    const c = filmCues('common');
    expect(filmPose('common', c.fireAt + 1, g).streaming).toBe(false);
    expect(filmPose('common', c.pullAt + 1, g).streaming).toBe(true);
    expect(filmPose('common', c.shrinkAt - 1, g).streaming).toBe(true);
    expect(filmPose('common', c.shrinkAt + 1, g).streaming).toBe(false);
    expect(filmPose('common', 100, g).sheen).toBeNull();
    expect(filmPose('common', c.panEnd / 2 + 150, g).sheen).toBeGreaterThan(0);
    expect(filmPose('common', c.fireAt, g).sheen).toBeNull();
  });
});

describe('panStartFocus', () => {
  it("looks at the gun's left end, inset from the screen edge", () => {
    const g = geometry();
    expect(panStartFocus(g).x).toBeLessThan(0);
  });
});

describe('shake and recoil', () => {
  it('shakes briefly and then holds perfectly still', () => {
    expect(shakeAt(-10)).toEqual({ x: 0, y: 0 });
    expect(shakeAt(SHAKE_MS + 1)).toEqual({ x: 0, y: 0 });
    let moved = false;
    for (let t = 5; t < SHAKE_MS; t += 5) if (Math.abs(shakeAt(t).x) > 0.5) moved = true;
    expect(moved).toBe(true);
  });

  it('kicks the gun back and eases it home', () => {
    expect(recoilAt(-1)).toBe(0);
    expect(recoilAt(RECOIL_MS + 1)).toBe(0);
    expect(recoilAt(RECOIL_MS * 0.12)).toBeLessThan(-20);
    expect(Math.abs(recoilAt(RECOIL_MS * 0.9))).toBeLessThan(Math.abs(recoilAt(RECOIL_MS * 0.3)));
  });
});

describe('charge-up and flash', () => {
  it('charges across the hold and tenses the gun back without a jump at the shot', () => {
    const g = geometry();
    const c = filmCues('common');
    expect(filmPose('common', c.panEnd - 1, g).charge).toBe(0);
    expect(filmPose('common', c.fireAt - 1, g).charge).toBeGreaterThan(0.99);
    const before = filmPose('common', c.fireAt - 1, g).recoil;
    expect(before).toBeLessThan(-TENSE_PX * 0.98);
    expect(Math.abs(filmPose('common', c.fireAt, g).recoil - before)).toBeLessThan(0.2);
  });

  it('flashes as a quick pop that never hides the gun', () => {
    expect(flashAlphaAt(-1)).toBe(0);
    expect(flashAlphaAt(FLASH_PEAK_MS)).toBeCloseTo(FLASH_MAX_ALPHA, 5);
    expect(flashAlphaAt(FLASH_END_MS)).toBe(0);
    for (let t = 0; t < FLASH_END_MS; t++) expect(flashAlphaAt(t)).toBeLessThanOrEqual(0.55);
    expect(FLASH_PEAK_MS).toBeLessThan(60);
    expect(FLASH_END_MS).toBeLessThanOrEqual(180);
  });
});

describe('easing', () => {
  it('runs 0 to 1 and never overshoots', () => {
    for (const f of [sineInOut, cubicOut, cubicInOut]) {
      expect(f(0)).toBeCloseTo(0, 10);
      expect(f(1)).toBeCloseTo(1, 10);
      for (let t = 0; t <= 1; t += 0.05) {
        expect(f(t)).toBeGreaterThanOrEqual(0);
        expect(f(t)).toBeLessThanOrEqual(1 + 1e-12);
      }
    }
  });

  it('interpolates zoom by equal ratios', () => {
    expect(lerpZoom(4, 1, 0.5)).toBeCloseTo(2, 10);
  });
});
