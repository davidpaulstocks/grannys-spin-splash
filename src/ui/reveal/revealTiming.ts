/**
 * The pure maths of the gun reveal (no Phaser): when each beat starts for a
 * rarity, where everything sits on the 1280x720 screen, how the demo range
 * decides when and at what to fire, and where the nozzle is. Unit-tested.
 */

import { GUN_SHOW_SCALE_MAX } from '../../entities/gun/gun.data';
import type { GunRarity } from '../../entities/gun/gun.types';
import { HERO_CENTRE_Y, filmCues, type FilmCues } from './filmMaths';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export const REVEAL_DEPTH = 1000;

/** How many shockwave rings the hero shot sends out: the rarest guns ring twice. */
export const RARITY_RINGS: Readonly<Record<GunRarity, number>> = {
  common: 1,
  rare: 1,
  epic: 1,
  legendary: 2,
};

/** After the gun has shrunk to its place: how long the blasting runs before the numbers. */
export const DEMO_BLAST_MS = 800;
/** Owned reveal, beat 3. */
export const POWER_COUNT_MS = 900;
export const ROWS_OFFSET_MS = 300;
export const ROW_STEP_MS = 300;
export const ROW_COUNT_MS = 380;
export const BUTTONS_AFTER_ROWS_MS = 150;
/** Preview, beat 3: how soon after the blast the price and the button appear. */
export const PREVIEW_BUTTONS_AFTER_MS = 350;
/** Extra shockwave and chime come this long after the first, for the rarest guns. */
export const SECOND_WAVE_DELAY_MS = 180;
/** The hero shot's name lands this long before the pull-back has quite settled. */
export const NAME_LEAD_MS = 60;
/** The rarity tag lands this long after the name. */
export const TAG_AFTER_NAME_MS = 260;

/** When each beat starts, in ms from the moment the film starts. */
export interface RevealTimeline {
  /** The film's cues: the pan, the fire at the nozzle, the pull-back, the shrink. */
  readonly film: FilmCues;
  /** The hero shot's name and tag landing. */
  readonly nameAt: number;
  readonly tagAt: number;
  /** The gun is in its place and starts blasting at the targets. */
  readonly beat2At: number;
  /** The blasting calms and the numbers begin. */
  readonly beat3At: number;
  /** When the USE IT / Later buttons appear for an owned gun. */
  readonly ownedButtonsAt: number;
  /** When the price and OK / BUY appear for a preview. */
  readonly previewButtonsAt: number;
}

/** When each beat starts, in ms from the moment the film starts. */
export function revealTimeline(rarity: GunRarity): RevealTimeline {
  const film = filmCues(rarity);
  const beat2At = film.shrinkEnd;
  const beat3At = beat2At + DEMO_BLAST_MS;
  const nameAt = film.pullEnd - NAME_LEAD_MS;
  return {
    film,
    nameAt,
    tagAt: nameAt + TAG_AFTER_NAME_MS,
    beat2At,
    beat3At,
    ownedButtonsAt:
      beat3At + ROWS_OFFSET_MS + ROW_STEP_MS * 2 + ROW_COUNT_MS + BUTTONS_AFTER_ROWS_MS,
    previewButtonsAt: beat3At + PREVIEW_BUTTONS_AFTER_MS,
  };
}

/** A tap skips to the numbers once the pull-back has started (so the opening is always seen up to the nozzle shot). */
export function canSkip(elapsedMs: number, timeline: RevealTimeline): boolean {
  return elapsedMs >= timeline.film.pullAt;
}

/** Where everything sits (logical px). Bands are checked for 16 px gaps in the unit test. */
export const REVEAL_LAYOUT = {
  headlineY: 44,
  headlineHeight: 38,
  gun: { x: 330, y: 207, maxW: 372, maxH: 208 },
  targetRadius: 40,
  targets: [
    { x: 850, y: 150 },
    { x: 1010, y: 236 },
    { x: 1160, y: 160 },
  ] as readonly Point[],
  /** The hero shot: the gun's centre, then the name, its underline and the rarity tag beneath it. */
  hero: { x: 640, y: HERO_CENTRE_Y, nameY: 556, underlineY: 606, tagY: 652 },
  nameY: 378,
  nameHeight: 58,
  tagRowY: 442,
  tagRowHeight: 38,
  rowsY: [496, 540, 584] as readonly number[],
  rowHeight: 30,
  previewBarY: 520,
  previewBarWidth: 520,
  previewBarHeight: 24,
  previewCountY: 566,
  buttonsY: 664,
  buttonsHeight: 64,
  minGap: 16,
} as const;

/** A gun's size on the reveal: the box it fits, scaled from 80% (pistol) to 100% (the biggest) by its `showScale`. */
export const GUN_SIZE_MIN = 0.8;

/** Scale that fits a picture of `w` x `h` into the gun box, bigger guns bigger. */
export function revealGunScale(w: number, h: number, showScale: number): number {
  const { maxW, maxH } = REVEAL_LAYOUT.gun;
  const along = Math.min(1, Math.max(0, (showScale - 1) / (GUN_SHOW_SCALE_MAX - 1)));
  return Math.min(maxW / w, maxH / h) * (GUN_SIZE_MIN + (1 - GUN_SIZE_MIN) * along);
}

/** Where a nozzle at picture pixel `anchor` ends up when the picture (centre `centre`, scale `scale`) is turned by `angle`. */
export function nozzlePoint(
  centre: Point,
  frame: { readonly width: number; readonly height: number },
  anchor: Point,
  scale: number,
  angle: number,
): Point {
  const lx = (anchor.x - frame.width / 2) * scale;
  const ly = (anchor.y - frame.height / 2) * scale;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: centre.x + lx * cos - ly * sin, y: centre.y + lx * sin + ly * cos };
}

/** Turns `current` toward `target` (radians), exponentially, `rate` per second. */
export function easeAngle(current: number, target: number, dtMs: number, rate: number): number {
  return current + (target - current) * (1 - Math.exp((-rate * dtMs) / 1000));
}

export type DemoMode = 'blast' | 'idle';
export const BLAST_BURST_MS = 520;
export const BLAST_GAP_MS = 120;
/** While the gun is still between targets it already turns to the next one this far ahead. */
export const BLAST_LEAD_MS = 220;
export const IDLE_PERIOD_MS = 2200;
export const IDLE_BURST_MS = 600;

export interface DemoPhase {
  /** Which target the shots go to. */
  readonly fireIndex: number;
  /** Which target the gun turns toward (the next one, during the gap). */
  readonly aimIndex: number;
  readonly firing: boolean;
}

/**
 * What the demo gun is doing `elapsedMs` into a mode. Blast: a burst at each
 * target in turn with a short gap. Idle: a rest, then one burst, at the next
 * target, every couple of seconds.
 */
export function demoPhase(elapsedMs: number, mode: DemoMode, targetCount: number): DemoPhase {
  const n = Math.max(1, targetCount);
  if (mode === 'blast') {
    const slot = BLAST_BURST_MS + BLAST_GAP_MS;
    const at = Math.max(0, elapsedMs);
    return {
      fireIndex: Math.floor(at / slot) % n,
      aimIndex: Math.floor((at + BLAST_LEAD_MS) / slot) % n,
      firing: at % slot < BLAST_BURST_MS,
    };
  }
  const at = Math.max(0, elapsedMs);
  const index = Math.floor(at / IDLE_PERIOD_MS) % n;
  return {
    fireIndex: index,
    aimIndex: index,
    firing: at % IDLE_PERIOD_MS >= IDLE_PERIOD_MS - IDLE_BURST_MS,
  };
}

/** A vertical band of the layout: what it is and where it starts and ends. */
export interface LayoutBand {
  readonly name: string;
  readonly top: number;
  readonly bottom: number;
}

/** The vertical bands from top to bottom (the stage is widened for the gun's swing). */
export function revealBands(): LayoutBand[] {
  const L = REVEAL_LAYOUT;
  const swing = Math.sin(maxAimAngle()) * (L.gun.maxW / 2);
  const targetTop = Math.min(...L.targets.map((t) => t.y)) - L.targetRadius;
  const targetBottom = Math.max(...L.targets.map((t) => t.y)) + L.targetRadius;
  return [
    {
      name: 'headline',
      top: L.headlineY - L.headlineHeight / 2,
      bottom: L.headlineY + L.headlineHeight / 2,
    },
    {
      name: 'stage',
      top: Math.min(targetTop, L.gun.y - L.gun.maxH / 2 - swing),
      bottom: Math.max(targetBottom, L.gun.y + L.gun.maxH / 2 + swing),
    },
    { name: 'name', top: L.nameY - L.nameHeight / 2, bottom: L.nameY + L.nameHeight / 2 },
    {
      name: 'tags',
      top: L.tagRowY - L.tagRowHeight / 2,
      bottom: L.tagRowY + L.tagRowHeight / 2,
    },
    {
      name: 'rows',
      top: (L.rowsY[0] ?? 0) - L.rowHeight / 2,
      bottom: (L.rowsY[L.rowsY.length - 1] ?? 0) + L.rowHeight / 2,
    },
    {
      name: 'buttons',
      top: L.buttonsY - L.buttonsHeight / 2,
      bottom: L.buttonsY + L.buttonsHeight / 2,
    },
  ];
}

/** The steepest turn the gun makes: from its centre to the highest or lowest target. */
export function maxAimAngle(): number {
  const { gun, targets } = REVEAL_LAYOUT;
  return Math.max(...targets.map((t) => Math.abs(Math.atan2(t.y - gun.y, t.x - gun.x))));
}
