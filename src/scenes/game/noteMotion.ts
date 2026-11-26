/**
 * Where a note-fountain visual is, how big and how visible, at a point in its
 * life. Pure maths over 0..1 life, so the fountain just applies the result.
 */

import { BOUNCE_OVERSHOOT } from '../../utils/tween';

/** The ways a visual can travel. */
export type MotionKind =
  | 'rise'
  | 'ribbon'
  | 'ribbonNote'
  | 'spiral'
  | 'sideways'
  | 'stairs'
  | 'streak'
  | 'ring'
  | 'burst'
  | 'spark';

export interface MotionParams {
  readonly kind: MotionKind;
  /** Where it starts. */
  readonly ox: number;
  readonly oy: number;
  /** Unit direction of travel. */
  readonly dx: number;
  readonly dy: number;
  /** How far it travels over its life, in px. */
  readonly dist: number;
  /** Wobble, curl or step size, in px. */
  readonly amp: number;
  /** Final size multiplier. */
  readonly scale: number;
  /** Starting rotation, radians. */
  readonly rot: number;
}

export interface Pose {
  readonly x: number;
  readonly y: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotation: number;
  readonly alpha: number;
}

/** Length of the ribbon texture, in design px (see ui/noteShapes.ts). */
export const RIBBON_LENGTH = 90;
/** The fraction of a ribbon's life spent unfurling. */
const UNFURL_FRACTION = 0.5;
/** Life fraction after which a visual starts to fade. */
const FADE_START = 0.55;
const POP_FRACTION = 0.16;
const SPIRAL_TURNS = 1.4;
const STAIR_STEPS = 4;
const STAIR_HOP_PX = 7;
const RING_START_SCALE = 0.3;
const RING_ALPHA = 0.6;
const BURST_START_SCALE = 0.25;
const BURST_SPIN = 0.9;
const STREAK_TRAVEL = 0.45;
const SPARK_END_SCALE = 0.3;
const DEFAULT_SQUEEZE = 0.5;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

/** Back-out easing with the project's overshoot, for the pop-in. */
function popIn(t: number): number {
  const c3 = BOUNCE_OVERSHOOT + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + BOUNCE_OVERSHOOT * u * u;
}

function fade(t: number): number {
  return 1 - clamp01((t - FADE_START) / (1 - FADE_START));
}

/** The pose of a visual at life fraction `t` (0 = just born, 1 = gone). */
export function poseAt(m: MotionParams, t: number): Pose {
  const e = easeOut(t);
  const pop = clamp01(t / POP_FRACTION);
  const grow = m.scale * (pop >= 1 ? 1 : Math.max(0.2, popIn(pop)));
  const base = { scaleX: grow, scaleY: grow, rotation: m.rot, alpha: fade(t) };
  switch (m.kind) {
    case 'ribbon': {
      const f = easeOut(clamp01(t / UNFURL_FRACTION));
      return {
        ...base,
        x: m.ox + m.dx * m.dist * t * DEFAULT_SQUEEZE,
        y: m.oy + m.dy * m.dist * t * DEFAULT_SQUEEZE,
        scaleX: m.scale * f,
        scaleY: m.scale,
        rotation: Math.atan2(m.dy, m.dx),
        alpha: fade(t) * 0.9,
      };
    }
    case 'ribbonNote': {
      const f = easeOut(clamp01(t / UNFURL_FRACTION));
      const reach = RIBBON_LENGTH * m.scale * f;
      return {
        ...base,
        x: m.ox + m.dx * (m.dist * t * DEFAULT_SQUEEZE + reach),
        y: m.oy + m.dy * (m.dist * t * DEFAULT_SQUEEZE + reach),
        rotation: m.rot + Math.sin(t * Math.PI * 3) * 0.25,
      };
    }
    case 'spiral': {
      const phase = m.rot + t * Math.PI * 2 * SPIRAL_TURNS;
      const radius = m.amp * (0.3 + t);
      return {
        ...base,
        x: m.ox + m.dx * m.dist * e + Math.cos(phase) * radius,
        y: m.oy + m.dy * m.dist * e + Math.sin(phase) * radius * 0.5,
        rotation: Math.cos(phase) * 0.35,
      };
    }
    case 'sideways':
      return {
        ...base,
        x: m.ox + m.dx * m.dist * e,
        y: m.oy + m.dy * m.dist * e,
        rotation: m.rot * (1 - t),
        alpha: fade(t),
      };
    case 'stairs': {
      const step = Math.min(STAIR_STEPS, Math.floor(t * STAIR_STEPS) + 1);
      const within = t * STAIR_STEPS - Math.floor(t * STAIR_STEPS);
      const hop = Math.sin(within * Math.PI) * STAIR_HOP_PX;
      return {
        ...base,
        x: m.ox + m.dx * m.amp * step,
        y: m.oy + m.dy * m.amp * step - hop,
        rotation: 0,
      };
    }
    case 'streak':
      return {
        ...base,
        x: m.ox + m.dx * m.dist * e * STREAK_TRAVEL,
        y: m.oy + m.dy * m.dist * e * STREAK_TRAVEL,
        scaleX: m.scale * (1 - t * 0.6),
        scaleY: m.scale,
        rotation: Math.atan2(m.dy, m.dx),
        alpha: 1 - t,
      };
    case 'ring': {
      const s = m.scale * (RING_START_SCALE + (1 - RING_START_SCALE) * e);
      return { x: m.ox, y: m.oy, scaleX: s, scaleY: s, rotation: 0, alpha: RING_ALPHA * (1 - t) };
    }
    case 'burst': {
      const s = m.scale * (BURST_START_SCALE + (1 - BURST_START_SCALE) * e);
      return {
        x: m.ox,
        y: m.oy,
        scaleX: s,
        scaleY: s,
        rotation: m.rot + t * BURST_SPIN,
        alpha: 1 - t,
      };
    }
    case 'spark': {
      const s = m.scale * (1 - (1 - SPARK_END_SCALE) * t);
      return {
        x: m.ox + m.dx * m.dist * e,
        y: m.oy + m.dy * m.dist * e,
        scaleX: s,
        scaleY: s,
        rotation: m.rot + t * 2,
        alpha: 1 - t * t,
      };
    }
    default:
      return {
        ...base,
        x: m.ox + m.dx * m.dist * e,
        y: m.oy + m.dy * m.dist * e,
        rotation: m.rot * (1 - t),
      };
  }
}
