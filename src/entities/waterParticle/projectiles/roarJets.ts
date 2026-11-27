/**
 * The last two mythic projectiles, the loudest on the ladder: Robo-Rex's wide vortex beam (concentric
 * pink and blue rings travelling down a dark core, a mint glow at its edge) and the Phoenix Fury's
 * broad sweep of flame feathers in gold, orange and pink that fan out as they fly.
 */

import { COLOUR, shade } from '../../../utils/colour';
import { beamLine, hash01, lineLength, sampleAlong, smooth } from './drawKit';
import { flameLayers } from './fireJets';
import type { JetPoint, JetRenderer } from './projectile.types';

const VORTEX_GLOW_SCALE = 4.2;
const VORTEX_GLOW_ALPHA = 0.3;
const VORTEX_EDGE_SCALE = 3;
const VORTEX_CORE_SCALE = 2.2;
const VORTEX_RING_SPACING_PX = 46;
const VORTEX_RING_SPEED = 0.4;
const VORTEX_RING_THICKNESS = 0.22;
const VORTEX_RING_STROKE_PX = 3;
const VORTEX_RINGS_PER_SET = 3;
const VORTEX_RING_SHRINK = 0.3;
const VORTEX_RING_WIDEN = 0.5;
const VORTEX_PINK = shade(COLOUR.grannyPink, 1.1);

const PHOENIX_WIDTH_SCALE = 1.7;
const PHOENIX_FEATHER_SPACING_PX = 24;
const PHOENIX_FEATHER_LENGTH_PX = 78;
const PHOENIX_FEATHER_BASE_PX = 12;
const PHOENIX_FAN_NEAR = 0.25;
const PHOENIX_FAN_FAR = 0.95;
const PHOENIX_FEATHER_REACH = 0.55;
const PHOENIX_DRIFT_SPEED = 0.09;
const PHOENIX_FLUTTER_SPEED = 0.015;
const PHOENIX_FEATHER_COLOURS = [COLOUR.sunnyGold, COLOUR.heatOrange, COLOUR.grannyPink] as const;

/** Robo-Rex: a wide straight beam, a dark core with pink and blue rings running down it, a mint glow at the edge. */
export const drawVortex: JetRenderer = (f) => {
  for (const stream of f.streams) {
    const line = beamLine(stream);
    const a = line[0] as JetPoint;
    const b = line[1] as JetPoint;
    f.gfx.lineStyle(f.size * VORTEX_GLOW_SCALE, f.accent, VORTEX_GLOW_ALPHA);
    f.gfx.lineBetween(a.x, a.y, b.x, b.y);
    f.gfx.lineStyle(f.size * VORTEX_EDGE_SCALE, f.accent, 0.9);
    f.gfx.lineBetween(a.x, a.y, b.x, b.y);
    f.gfx.lineStyle(f.size * VORTEX_CORE_SCALE, COLOUR.ink, 1);
    f.gfx.lineBetween(a.x, a.y, b.x, b.y);
    if (lineLength(line) < 1) continue;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const phase = (f.time * VORTEX_RING_SPEED) % VORTEX_RING_SPACING_PX;
    for (const s of sampleAlong(line, VORTEX_RING_SPACING_PX, phase, Infinity)) {
      const reach = f.size * VORTEX_CORE_SCALE * (1 - 0.15 * s.t);
      f.gfx.save();
      f.gfx.translateCanvas(s.x, s.y);
      f.gfx.rotateCanvas(angle);
      for (let k = 0; k < VORTEX_RINGS_PER_SET; k++) {
        f.gfx.lineStyle(
          VORTEX_RING_STROKE_PX,
          k % 2 === 0 ? VORTEX_PINK : f.colour,
          0.95 * (1 - 0.5 * s.t),
        );
        f.gfx.strokeEllipse(
          0,
          0,
          reach * VORTEX_RING_THICKNESS * 2 * (1 + k * VORTEX_RING_WIDEN),
          reach * (1 - k * VORTEX_RING_SHRINK) * 2,
        );
      }
      f.gfx.restore();
    }
  }
};

/** Phoenix Fury: a big sheet of fire with flame feathers fanning off both sides, brighter than the dragon's. */
export const drawPhoenix: JetRenderer = (f) => {
  const fire = { ...f, colour: COLOUR.heatOrange, accent: f.colour };
  for (const stream of f.streams) {
    const pts = stream.map((p) => ({ ...p }));
    smooth(pts);
    flameLayers(fire, pts, PHOENIX_WIDTH_SCALE);
    const drift = (f.time * PHOENIX_DRIFT_SPEED) % PHOENIX_FEATHER_SPACING_PX;
    for (const s of sampleAlong(pts, PHOENIX_FEATHER_SPACING_PX, drift)) {
      const id = Math.floor(s.along / PHOENIX_FEATHER_SPACING_PX + f.time / 160);
      const dx = s.ny;
      const dy = -s.nx;
      const fan = PHOENIX_FAN_NEAR + (PHOENIX_FAN_FAR - PHOENIX_FAN_NEAR) * s.t;
      const len = PHOENIX_FEATHER_LENGTH_PX * (0.6 + 0.6 * hash01(id, 2)) * (0.6 + s.t);
      const base = PHOENIX_FEATHER_BASE_PX * (0.7 + 0.5 * s.t);
      for (const side of [-1, 1] as const) {
        const flutter = 1 + 0.18 * Math.sin(f.time * PHOENIX_FLUTTER_SPEED + id * 1.7 + side);
        const out = f.size * (0.4 + s.t * 1.5) * side;
        const bx = s.x + s.nx * out;
        const by = s.y + s.ny * out;
        const tipX = bx + (dx * Math.cos(fan) + s.nx * side * Math.sin(fan)) * len * flutter;
        const tipY = by + (dy * Math.cos(fan) + s.ny * side * Math.sin(fan)) * len * flutter;
        const colour = PHOENIX_FEATHER_COLOURS[(id + (side > 0 ? 1 : 0)) % 3] as number;
        f.gfx.fillStyle(colour, 0.92);
        f.gfx.fillTriangle(
          bx - s.nx * base,
          by - s.ny * base,
          bx + s.nx * base,
          by + s.ny * base,
          tipX,
          tipY,
        );
        f.gfx.fillStyle(COLOUR.cloud, 0.7);
        f.gfx.fillTriangle(
          bx - s.nx * base * 0.35,
          by - s.ny * base * 0.35,
          bx + s.nx * base * 0.35,
          by + s.ny * base * 0.35,
          bx + (tipX - bx) * PHOENIX_FEATHER_REACH,
          by + (tipY - by) * PHOENIX_FEATHER_REACH,
        );
      }
    }
  }
};
