/**
 * The pure maths of the gun reveal's "product film" (no Phaser): when each
 * shot of the film starts for a rarity, and where the camera is at any moment.
 *
 * The film is four shots: an extreme close-up that glides from the handle to
 * the nozzle, the gun firing at the nozzle, a fast pull-back to the whole gun
 * (the hero shot, where the name lands), and the gun shrinking to its place for
 * the numbers. Nothing in the picture moves by tweens: the rig asks
 * `filmPose(rarity, elapsedMs, geometry)` for where the gun is NOW, so the
 * motion is a pure function of the clock (no drift, no stutter, and a skip is
 * just "ask for the last pose"). Unit-tested in tests/unit/filmMaths.test.ts.
 *
 * The camera is expressed the way a film camera is: a zoom (screen px per
 * picture px), a focus (a point of the picture) and the place on the screen
 * where that focus is shown. The picture's centre then sits at
 * `view - zoom * focus`.
 */

import type { GunRarity } from '../../entities/gun/gun.types';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The whole gun is this many screen widths long in the extreme close-up. */
export const CLOSE_LENGTH_SCREENS = 2.2;
/** The gun's length in the hero shot, as a share of the screen's width (two thirds). */
export const HERO_LENGTH_SHARE = 0.625;
/** How much of the picture's width the gun itself fills (measured: 0.92 to 0.93 of every gun picture). */
export const CONTENT_FRACTION = 0.93;
/** The close-up starts this much further out and pushes in to full size during the pan. */
export const PAN_ZOOM_FROM = 0.94;
/** At the start of the pan the gun's left end sits this far (px) inside the screen's left edge. */
export const PAN_START_INSET_PX = 90;
/** Where the nozzle is shown at the end of the pan, as a share of the screen's width (left of centre). */
export const NOZZLE_VIEW_X = 0.37;
/** The hero shot's gun centre (logical px); the name, underline and tag sit under it. */
export const HERO_CENTRE_Y = 262;
/** The hero shot drifts in by this much while it holds, so it is never a frozen frame. */
export const HERO_DRIFT = 0.025;

/** Seconds of dark before the gun begins to fade up, and how long the fade takes. */
export const FADE_START_MS = 150;
export const FADE_MS = 450;
/** The light sweeps the paintwork from here until the pan ends. */
export const SHEEN_START_MS = 300;
/** The beat at the nozzle before it fires. */
export const NOZZLE_HOLD_MS = 330;
/** How long the gun fires in the close-up. */
export const FIRE_MS = 800;
/** The pull-back starts this long after the firing starts (the shots are still streaming). */
export const PULL_AFTER_FIRE_MS = 600;
export const PULL_MS = 700;
export const SHRINK_MS = 550;
/** The camera shake when it fires. */
export const SHAKE_MS = 240;
export const SHAKE_PX = 9;
export const SHAKE_X_RATE = 0.09;
export const SHAKE_Y_RATE = 0.13;
/** The gun's kick when it fires (screen px, backwards) and how long the kick lasts. */
export const RECOIL_PX = 34;
export const RECOIL_MS = 380;
export const RECOIL_PEAK = 0.12;

/** How long each rarity's pan takes (the rarest guns pan more slowly) and how long its hero shot holds. */
export interface FilmTiming {
  readonly panMs: number;
  readonly heroHoldMs: number;
}

export const FILM_TIMING: Readonly<Record<GunRarity, FilmTiming>> = {
  common: { panMs: 1600, heroHoldMs: 850 },
  rare: { panMs: 1900, heroHoldMs: 900 },
  epic: { panMs: 2100, heroHoldMs: 950 },
  legendary: { panMs: 2400, heroHoldMs: 1100 },
};

/** When each shot of the film starts, in ms from the moment it starts. */
export interface FilmCues {
  readonly panEnd: number;
  readonly fireAt: number;
  readonly fireEnd: number;
  readonly pullAt: number;
  readonly pullEnd: number;
  readonly shrinkAt: number;
  readonly shrinkEnd: number;
}

/** The cues for a rarity. */
export function filmCues(rarity: GunRarity): FilmCues {
  const { panMs, heroHoldMs } = FILM_TIMING[rarity];
  const fireAt = panMs + NOZZLE_HOLD_MS;
  const pullAt = fireAt + PULL_AFTER_FIRE_MS;
  const pullEnd = pullAt + PULL_MS;
  const shrinkAt = pullEnd + heroHoldMs;
  return {
    panEnd: panMs,
    fireAt,
    fireEnd: fireAt + FIRE_MS,
    pullAt,
    pullEnd,
    shrinkAt,
    shrinkEnd: shrinkAt + SHRINK_MS,
  };
}

/** What the camera needs to know about the picture and the screen. All picture points are from the picture's centre, in picture px. */
export interface FilmGeometry {
  readonly screen: { readonly w: number; readonly h: number };
  readonly imageW: number;
  readonly imageH: number;
  /** The nozzle, from the picture's centre. */
  readonly nozzle: Point;
  readonly closeZoom: number;
  readonly heroZoom: number;
  /** Where the picture's centre ends up when the numbers show, and its zoom there (screen px per picture px). */
  readonly place: Point;
  readonly placeZoom: number;
}

/**
 * Builds the geometry for a picture `imageW` x `imageH` whose nozzle is at
 * `anchor` (px from the picture's top-left), on a `screenW` x `screenH` screen.
 */
export function filmGeometry(
  imageW: number,
  imageH: number,
  anchor: Point,
  screen: { readonly w: number; readonly h: number },
  place: Point,
  placeZoom: number,
): FilmGeometry {
  const content = imageW * CONTENT_FRACTION;
  return {
    screen,
    imageW,
    imageH,
    nozzle: { x: anchor.x - imageW / 2, y: anchor.y - imageH / 2 },
    closeZoom: (CLOSE_LENGTH_SCREENS * screen.w) / content,
    heroZoom: (HERO_LENGTH_SHARE * screen.w) / content,
    place,
    placeZoom,
  };
}

/** Where everything is at one moment of the film. */
export interface FilmPose {
  /** The picture's scale (screen px per picture px) and where its centre is (screen px), shake included. */
  readonly zoom: number;
  readonly x: number;
  readonly y: number;
  /** The picture's alpha (the fade up from dark). */
  readonly imageAlpha: number;
  /** The vignette's strength, 0 to 1. */
  readonly vignette: number;
  /** The kick backwards of the gun alone (screen px, negative x). */
  readonly recoil: number;
  /** The sweep of light across the paintwork, 0 to 1 across the picture, or null when it is not showing. */
  readonly sheen: number | null;
  /** True while the gun is firing in the close-up. */
  readonly firing: boolean;
  /** The shot the film is in. */
  readonly shot: 'pan' | 'fire' | 'pull' | 'hero' | 'shrink' | 'done';
}

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Sine.InOut: slow, smooth, slow. */
export const sineInOut = (t: number): number => 0.5 - Math.cos(Math.PI * clamp01(t)) / 2;
/** Cubic.Out: fast, then settling. */
export const cubicOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
/** Cubic.InOut. */
export const cubicInOut = (t: number): number => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** Interpolates a zoom so it feels even to the eye (equal ratios in equal times). */
export const lerpZoom = (a: number, b: number, t: number): number =>
  Math.exp(lerp(Math.log(a), Math.log(b), t));

/** Where the gun's left end is shown at the start, and where the nozzle is shown at the end, of the pan. */
export function panViews(g: FilmGeometry): { from: Point; to: Point } {
  return {
    from: { x: g.screen.w / 2, y: g.screen.h / 2 },
    to: { x: g.screen.w * NOZZLE_VIEW_X, y: g.screen.h / 2 },
  };
}

/** The point of the picture the camera looks at when the pan starts: the gun's left end, inset from the edge. */
export function panStartFocus(g: FilmGeometry): Point {
  const zoom = g.closeZoom * PAN_ZOOM_FROM;
  const left = -(g.imageW * CONTENT_FRACTION) / 2;
  const { from } = panViews(g);
  return { x: left + (from.x - PAN_START_INSET_PX) / zoom, y: 0 };
}

/** The camera shake at `sinceFireMs`: a short, decaying shake (screen px). Zero before the shot and after it. */
export function shakeAt(sinceFireMs: number): Point {
  if (sinceFireMs < 0 || sinceFireMs > SHAKE_MS) return { x: 0, y: 0 };
  const fade = Math.pow(1 - sinceFireMs / SHAKE_MS, 2);
  return {
    x: SHAKE_PX * fade * Math.sin(sinceFireMs * SHAKE_X_RATE * 2 * Math.PI),
    y: SHAKE_PX * fade * Math.sin(sinceFireMs * SHAKE_Y_RATE * 2 * Math.PI + 1),
  };
}

/** The gun's kick backwards (screen px, 0 or negative) at `sinceFireMs`: a quick jolt back, then easing home. */
export function recoilAt(sinceFireMs: number): number {
  if (sinceFireMs < 0 || sinceFireMs > RECOIL_MS) return 0;
  const u = sinceFireMs / RECOIL_MS;
  const kick =
    u < RECOIL_PEAK ? u / RECOIL_PEAK : 1 - cubicOut((u - RECOIL_PEAK) / (1 - RECOIL_PEAK));
  return -RECOIL_PX * kick;
}

/** The screen position of a picture point (px from the picture's centre) under a pose. */
export function screenPointOf(pose: FilmPose, local: Point): Point {
  return { x: pose.x + pose.zoom * local.x, y: pose.y + pose.zoom * local.y };
}

/**
 * Where the camera is `elapsedMs` into the film for a gun of `rarity`.
 * Every segment is continuous with the next (the pan ends exactly where the
 * fire holds, the pull-back starts exactly there, and so on).
 */
export function filmPose(rarity: GunRarity, elapsedMs: number, g: FilmGeometry): FilmPose {
  const cues = filmCues(rarity);
  const t = Math.max(0, elapsedMs);
  const views = panViews(g);
  const focus0 = panStartFocus(g);
  const hero = { x: g.screen.w / 2, y: HERO_CENTRE_Y };
  const imageAlpha = sineInOut((t - FADE_START_MS) / FADE_MS);
  const shake = shakeAt(t - cues.fireAt);
  const recoil = recoilAt(t - cues.fireAt);
  const sheenSpan = cues.panEnd - SHEEN_START_MS;
  const sheen = t >= SHEEN_START_MS && t <= cues.panEnd ? (t - SHEEN_START_MS) / sheenSpan : null;
  const firing = t >= cues.fireAt && t < cues.fireEnd;

  const place = (
    zoom: number,
    focus: Point,
    view: Point,
    vignette: number,
    shot: FilmPose['shot'],
  ): FilmPose => ({
    zoom,
    x: view.x - zoom * focus.x + shake.x,
    y: view.y - zoom * focus.y + shake.y,
    imageAlpha,
    vignette,
    recoil,
    sheen,
    firing,
    shot,
  });

  if (t < cues.pullAt) {
    const p = sineInOut(t / cues.panEnd);
    const zoom = g.closeZoom * lerp(PAN_ZOOM_FROM, 1, p);
    const focus = { x: lerp(focus0.x, g.nozzle.x, p), y: lerp(focus0.y, g.nozzle.y, p) };
    const view = { x: lerp(views.from.x, views.to.x, p), y: lerp(views.from.y, views.to.y, p) };
    return place(zoom, focus, view, 1, t < cues.fireAt ? 'pan' : 'fire');
  }
  if (t < cues.pullEnd) {
    const e = cubicOut((t - cues.pullAt) / PULL_MS);
    const zoom = lerpZoom(g.closeZoom, g.heroZoom, e);
    const focus = { x: lerp(g.nozzle.x, 0, e), y: lerp(g.nozzle.y, 0, e) };
    const view = { x: lerp(views.to.x, hero.x, e), y: lerp(views.to.y, hero.y, e) };
    return place(zoom, focus, view, 1 - e, 'pull');
  }
  const heroZoom = (u: number): number => g.heroZoom * (1 + HERO_DRIFT * u);
  const holdSpan = cues.shrinkAt - cues.pullEnd;
  if (t < cues.shrinkAt) {
    const u = sineInOut((t - cues.pullEnd) / holdSpan);
    return place(heroZoom(u), { x: 0, y: 0 }, hero, 0, 'hero');
  }
  const s = cubicInOut((t - cues.shrinkAt) / SHRINK_MS);
  const zoom = lerpZoom(heroZoom(1), g.placeZoom, s);
  const view = { x: lerp(hero.x, g.place.x, s), y: lerp(hero.y, g.place.y, s) };
  return place(zoom, { x: 0, y: 0 }, view, 0, t < cues.shrinkEnd ? 'shrink' : 'done');
}
