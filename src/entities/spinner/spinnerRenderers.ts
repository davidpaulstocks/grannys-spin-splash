/**
 * Procedural draw routines for each spinner style, rewritten from the
 * reference prototype's `redrawSpinner`/`_drawCog`/`_drawDisco`/
 * `_drawGolden` (CLAUDE.md §2 — behavioural/visual reference, not a
 * verbatim port). Module-internal to Spinner.ts; not a shared type.
 *
 * Blade/body colours stay the prototype's own (kept for physics/
 * behavioural fidelity per data/spinners.ts's header); the state GLOW
 * re-skins to the production hero palette (Sprint 2 story 2.7/2.8) since
 * that's pure UI feedback, not tuned gameplay data.
 */

import Phaser from 'phaser';

import { MOUNT_RADIUS_SCALE } from './spinner.data';
import { SpinnerState, type SpinnerDef } from './spinner.types';
import { COLOUR } from '../../utils/colour';

/**
 * Brightness multiplier per state — dimmest at STOPPED, full colour at
 * FULL. Floor raised 2026-09-12 (0.38 -> 0.6 at STOPPED): the old values
 * were set while a cream scrim sat between the spinners and the
 * background, so heavy dimming still read as "a colour, just muted."
 * With the scrim gone and the real illustrations at full vibrancy behind
 * them, 0.38 turned every idle spinner into a near-black silhouette that
 * lost its world palette entirely. State is still legible without the
 * extra darkness — the glow ring, spin speed and wobble all carry it.
 */
const DIM_BY_STATE: Record<SpinnerState, number> = {
  [SpinnerState.STOPPED]: 0.6,
  [SpinnerState.SLOW]: 0.78,
  [SpinnerState.MEDIUM]: 0.9,
  [SpinnerState.FULL]: 1.0,
};

/**
 * Ink outline weight (2026-09-12, direct user feedback: spinners had to
 * "match scene style carefully so they feel native not add on"). Every
 * delivered world background is hand-illustrated with thick dark
 * outlines (CLAUDE.md §8.3: "hand-painted watercolour with thick black
 * outlines"), while these procedural shapes were flat untouched fills —
 * which is exactly what made them read as pasted-on vector art. Outlining
 * every shape in Ink at the §5.4 "4px emphasis" weight is the single
 * biggest thing that puts them *in* the scene.
 */
const OUTLINE_WIDTH = 3.5;
/** Contact shadow under each spinner so it sits on the wall rather than floating in front of it. */
const SHADOW_OFFSET = 4;
const SHADOW_ALPHA = 0.22;

/** Fills the current path, then strokes it in Ink — the house style for every spinner shape. */
function fillAndOutline(g: Phaser.GameObjects.Graphics): void {
  g.fillPath();
  g.lineStyle(OUTLINE_WIDTH, COLOUR.ink, 0.9);
  g.strokePath();
}

function dimColour(hex: number, dim: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * dim);
  const g = Math.floor(((hex >> 8) & 0xff) * dim);
  const b = Math.floor((hex & 0xff) * dim);
  return (r << 16) | (g << 8) | b;
}

function colourAt(def: SpinnerDef, index: number): number {
  return Phaser.Display.Color.HexStringToColor(def.colors[index % def.colors.length]).color;
}

function drawBlades(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  for (let i = 0; i < def.blades; i++) {
    const a = (i / def.blades) * Math.PI * 2;
    g.fillStyle(dimColour(colourAt(def, i), dim), 1);
    switch (def.style) {
      case 'pinwheel':
        drawPinwheelBlade(g, a, def.r);
        break;
      case 'fan':
        drawFanBlade(g, a, def.r);
        break;
      case 'windmill':
        drawWindmillBlade(g, a, def.r);
        break;
      case 'propeller':
        drawPropellerBlade(g, a, def.r);
        break;
      case 'whirligig':
        drawWhirligigBlade(g, a, def.r);
        break;
      default:
        break; // cog/disco/golden have their own draw functions, no per-blade loop.
    }
  }
}

function drawPinwheelBlade(g: Phaser.GameObjects.Graphics, a: number, r: number): void {
  const sweep = Math.PI * 0.44;
  g.beginPath();
  g.moveTo(0, 0);
  for (let t = 0; t <= 1.01; t += 0.1) {
    const ang = a + t * sweep;
    const d = r * (0.18 + t * 0.82);
    g.lineTo(Math.cos(ang) * d, Math.sin(ang) * d);
  }
  g.lineTo(Math.cos(a + sweep * 0.5) * r * 0.22, Math.sin(a + sweep * 0.5) * r * 0.22);
  g.closePath();
  fillAndOutline(g);
}

function drawFanBlade(g: Phaser.GameObjects.Graphics, a: number, r: number): void {
  const sweep = Math.PI * 0.3;
  const inner = r * 0.18;
  g.beginPath();
  g.moveTo(Math.cos(a - sweep / 2) * inner, Math.sin(a - sweep / 2) * inner);
  g.lineTo(Math.cos(a - sweep / 2) * r, Math.sin(a - sweep / 2) * r);
  g.lineTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
  g.lineTo(Math.cos(a + sweep / 2) * r, Math.sin(a + sweep / 2) * r);
  g.lineTo(Math.cos(a + sweep / 2) * inner, Math.sin(a + sweep / 2) * inner);
  g.closePath();
  fillAndOutline(g);
}

function drawWindmillBlade(g: Phaser.GameObjects.Graphics, a: number, r: number): void {
  const halfWidth = 9;
  const cx = Math.cos(a);
  const cy = Math.sin(a);
  const px = Math.cos(a + Math.PI / 2);
  const py = Math.sin(a + Math.PI / 2);
  g.beginPath();
  g.moveTo(px * halfWidth, py * halfWidth);
  g.lineTo(cx * r + px * halfWidth, cy * r + py * halfWidth);
  g.lineTo(cx * r - px * halfWidth, cy * r - py * halfWidth);
  g.lineTo(-px * halfWidth, -py * halfWidth);
  g.closePath();
  fillAndOutline(g);
}

function drawPropellerBlade(g: Phaser.GameObjects.Graphics, a: number, r: number): void {
  const sweep = Math.PI * 0.24;
  g.beginPath();
  g.moveTo(0, 0);
  for (let t = 0; t <= 1.01; t += 0.1) {
    const ang = a + t * sweep;
    const d = r * (0.1 + t * 0.9);
    g.lineTo(Math.cos(ang) * d, Math.sin(ang) * d);
  }
  for (let t = 1; t >= -0.01; t -= 0.1) {
    const ang = a + t * sweep + 0.38;
    const d = r * (0.1 + t * 0.9) * 0.5;
    g.lineTo(Math.cos(ang) * d, Math.sin(ang) * d);
  }
  g.closePath();
  fillAndOutline(g);
}

function drawWhirligigBlade(g: Phaser.GameObjects.Graphics, a: number, r: number): void {
  const sweep = Math.PI * 0.28;
  g.beginPath();
  g.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
  for (let t = 0; t <= 1.01; t += 0.1) {
    const ang = a + t * sweep;
    const d = r * (0.12 + t * 0.85);
    g.lineTo(Math.cos(ang) * d, Math.sin(ang) * d);
  }
  g.lineTo(Math.cos(a + sweep + 0.12) * r * 0.45, Math.sin(a + sweep + 0.12) * r * 0.45);
  g.lineTo(Math.cos(a + 0.18) * r * 0.12, Math.sin(a + 0.18) * r * 0.12);
  g.closePath();
  fillAndOutline(g);
}

function drawCog(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  const teeth = 10;
  const inner = r * 0.62;
  const toothWidth = (Math.PI / teeth) * 0.55;
  g.fillStyle(dimColour(colourAt(def, 0), dim), 1);
  g.beginPath();
  for (let i = 0; i < teeth; i++) {
    const base = (i / teeth) * Math.PI * 2;
    g.lineTo(Math.cos(base - toothWidth) * inner, Math.sin(base - toothWidth) * inner);
    g.lineTo(Math.cos(base - toothWidth) * r, Math.sin(base - toothWidth) * r);
    g.lineTo(Math.cos(base + toothWidth) * r, Math.sin(base + toothWidth) * r);
    g.lineTo(Math.cos(base + toothWidth) * inner, Math.sin(base + toothWidth) * inner);
  }
  g.closePath();
  fillAndOutline(g);
  g.lineStyle(1.5, dimColour(colourAt(def, 1), dim * 0.5), 0.7);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.lineBetween(
      Math.cos(a) * inner * 0.25,
      Math.sin(a) * inner * 0.25,
      Math.cos(a) * inner * 0.95,
      Math.sin(a) * inner * 0.95,
    );
  }
  g.fillStyle(dimColour(colourAt(def, 3), dim * 0.7), 1);
  g.fillCircle(0, 0, inner * 0.3);
}

function drawDisco(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  g.fillStyle(dimColour(colourAt(def, 0), dim), 1);
  g.fillCircle(0, 0, r);
  const tile = r / 4;
  for (let gx = -r; gx < r; gx += tile) {
    for (let gy = -r; gy < r; gy += tile) {
      const cx = gx + tile / 2;
      const cy = gy + tile / 2;
      if (Math.sqrt(cx * cx + cy * cy) >= r - 1) continue;
      const bright = (Math.floor(gx / tile) + Math.floor(gy / tile)) % 2 === 0;
      g.fillStyle(bright ? 0xffffff : 0x777777, dim * 0.65);
      g.fillRect(gx + 1, gy + 1, tile - 2, tile - 2);
    }
  }
  g.lineStyle(OUTLINE_WIDTH, COLOUR.ink, 0.9);
  g.strokeCircle(0, 0, r);
}

function drawStarPath(g: Phaser.GameObjects.Graphics, outer: number, inner: number): void {
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

function drawGolden(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  g.fillStyle(dimColour(colourAt(def, 0), dim), 1);
  drawStarPath(g, def.r, def.r * 0.4);
  fillAndOutline(g);
  g.fillStyle(dimColour(colourAt(def, 2), dim), 1);
  drawStarPath(g, def.r * 0.55, def.r * 0.4 * 0.55);
  g.fillPath();
}

/**
 * Kitchen's bespoke `fan` — a balloon whisk seen head-on: looped wires
 * bowing out from a central shaft rather than flat blades (2026-09-12,
 * direct user feedback that spinners should be "entertaining original
 * objects from each world," not one shared shape recoloured).
 */
function drawWhisk(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  const loops = Math.max(4, def.blades);
  for (let i = 0; i < loops; i++) {
    const a = (i / loops) * Math.PI * 2;
    // Each wire is a closed teardrop loop — filled and ink-outlined like
    // every other spinner shape. An earlier stroke-only version collapsed
    // into a dark blob once the wall's fit-scale shrank it.
    g.fillStyle(dimColour(colourAt(def, i), dim), 1);
    g.beginPath();
    for (let t = 0; t <= 1.001; t += 0.08) {
      const bow = Math.sin(t * Math.PI) * r * 0.34;
      const along = r * 0.1 + t * r * 0.9;
      g.lineTo(Math.cos(a) * along - Math.sin(a) * bow, Math.sin(a) * along + Math.cos(a) * bow);
    }
    for (let t = 1; t >= -0.001; t -= 0.08) {
      const bow = Math.sin(t * Math.PI) * r * 0.34 * 0.42;
      const along = r * 0.1 + t * r * 0.9;
      g.lineTo(Math.cos(a) * along + Math.sin(a) * bow, Math.sin(a) * along - Math.cos(a) * bow);
    }
    g.closePath();
    fillAndOutline(g);
  }
  // Chrome collar at the hub where the wires gather.
  g.fillStyle(dimColour(colourAt(def, 3), dim), 1);
  g.beginPath();
  g.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  g.closePath();
  fillAndOutline(g);
}

/**
 * Kitchen's bespoke `whirligig` — a citrus slice: pith-rimmed wedges around
 * a small core. Wedge geometry survives being shrunk far better than wire
 * detail does, so it stays legible at the wall's fit-scaled radius.
 */
function drawCitrus(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  const wedges = Math.max(6, def.blades);
  g.fillStyle(dimColour(colourAt(def, 0), dim), 1);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.closePath();
  fillAndOutline(g);

  const gap = 0.1;
  for (let i = 0; i < wedges; i++) {
    const from = (i / wedges) * Math.PI * 2 + gap;
    const to = ((i + 1) / wedges) * Math.PI * 2 - gap;
    g.fillStyle(dimColour(colourAt(def, 1 + (i % 2)), dim), 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, r * 0.82, from, to);
    g.closePath();
    g.fillPath();
  }
  g.fillStyle(dimColour(colourAt(def, 0), dim), 1);
  g.fillCircle(0, 0, r * 0.13);
}

/** Workshop's bespoke `whirligig` — a circular saw blade: hard angular teeth and an arbor hole. */
function drawSawBlade(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  const teeth = 12;
  g.fillStyle(dimColour(colourAt(def, 1), dim), 1);
  g.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const next = ((i + 1) / teeth) * Math.PI * 2;
    // Flat leading edge then a raked back edge — reads as a cutting tooth.
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    g.lineTo(
      Math.cos(a + (next - a) * 0.42) * r * 0.82,
      Math.sin(a + (next - a) * 0.42) * r * 0.82,
    );
    g.lineTo(Math.cos(next) * r * 0.78, Math.sin(next) * r * 0.78);
  }
  g.closePath();
  fillAndOutline(g);

  g.fillStyle(dimColour(colourAt(def, 2), dim * 0.85), 1);
  g.fillCircle(0, 0, r * 0.42);
  // Arbor hole punched through the middle.
  g.fillStyle(dimColour(colourAt(def, 0), dim * 0.4), 1);
  g.fillCircle(0, 0, r * 0.14);
}

/** Funfair's bespoke `propeller` — a candy-cane spiral: alternating striped arms curling out from the centre. */
function drawCandySwirl(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  const arms = Math.max(3, def.blades);
  for (let i = 0; i < arms; i++) {
    const base = (i / arms) * Math.PI * 2;
    // Stripe pairs: each arm is drawn twice, offset, in two palette colours.
    for (const [offset, colourIndex, width, ink] of [
      [0, i, 11, true],
      [0, i, 7, false],
      [0.16, i + 1, 4, false],
    ] as const) {
      g.lineStyle(width, ink ? COLOUR.ink : dimColour(colourAt(def, colourIndex), dim), 1);
      g.beginPath();
      for (let t = 0; t <= 1.001; t += 0.08) {
        const a = base + offset + t * 1.5; // curl as it goes out
        const d = t * r;
        if (t === 0) g.moveTo(Math.cos(a) * d, Math.sin(a) * d);
        else g.lineTo(Math.cos(a) * d, Math.sin(a) * d);
      }
      g.strokePath();
    }
  }
  g.fillStyle(dimColour(colourAt(def, 2), dim), 1);
  g.fillCircle(0, 0, r * 0.16);
}

/**
 * Garden's bespoke `fan` — a daisy: fat rounded petals around a seeded
 * centre. The shared `fan` shape is a grey-blue extractor blade, which read
 * as workshop hardware bolted onto a flower bed; a garden's spinning thing
 * is a flower head.
 */
function drawDaisy(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  const petals = Math.max(5, def.blades);
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    g.fillStyle(dimColour(colourAt(def, i), dim), 1);
    g.beginPath();
    // A rounded lobe: out along the petal axis, bulging either side.
    for (let t = 0; t <= 1.001; t += 0.08) {
      const along = r * 0.18 + t * r * 0.94;
      const bulge = Math.sin(t * Math.PI) * r * 0.38;
      g.lineTo(
        Math.cos(a) * along - Math.sin(a) * bulge,
        Math.sin(a) * along + Math.cos(a) * bulge,
      );
    }
    for (let t = 1; t >= -0.001; t -= 0.08) {
      const along = r * 0.18 + t * r * 0.94;
      const bulge = Math.sin(t * Math.PI) * r * 0.38;
      g.lineTo(
        Math.cos(a) * along + Math.sin(a) * bulge,
        Math.sin(a) * along - Math.cos(a) * bulge,
      );
    }
    g.closePath();
    fillAndOutline(g);
  }
  g.fillStyle(dimColour(0xffc93c, dim), 1);
  g.beginPath();
  g.arc(0, 0, r * 0.34, 0, Math.PI * 2);
  g.closePath();
  fillAndOutline(g);
  // Seed stipple in the centre.
  g.fillStyle(COLOUR.ink, dim * 0.35);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillCircle(Math.cos(a) * r * 0.17, Math.sin(a) * r * 0.17, 1.8);
  }
}

/**
 * Disco's bespoke `pinwheel` — a vinyl record: black disc, concentric
 * grooves, coloured centre label and a spindle hole. Reads unmistakably as
 * the dancefloor's own object where a child's pinwheel did not.
 */
function drawRecord(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  g.fillStyle(dimColour(0x1f2138, Math.max(dim, 0.75)), 1);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.closePath();
  fillAndOutline(g);

  g.lineStyle(1, COLOUR.cloud, dim * 0.22);
  for (let i = 1; i <= 4; i++) {
    g.strokeCircle(0, 0, r * (0.5 + i * 0.11));
  }
  // A single bright sheen arc — the light catching the vinyl as it turns.
  g.lineStyle(3, COLOUR.cloud, dim * 0.3);
  g.beginPath();
  g.arc(0, 0, r * 0.82, -Math.PI * 0.85, -Math.PI * 0.45);
  g.strokePath();

  g.fillStyle(dimColour(colourAt(def, 0), dim), 1);
  g.beginPath();
  g.arc(0, 0, r * 0.38, 0, Math.PI * 2);
  g.closePath();
  fillAndOutline(g);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(0, 0, r * 0.08);
}

/** Disco-world extra: a scatter of glitter specks over whatever shape already drew (SpinnerDef.sparkle). */
function drawSparkleOverlay(g: Phaser.GameObjects.Graphics, def: SpinnerDef, dim: number): void {
  const r = def.r;
  // Fixed offsets, not random — a spinner redraws on every state change and
  // twinkling positions jumping around on each redraw would read as noise.
  const specks: readonly (readonly [number, number, number])[] = [
    [0.55, 0.3, 2.4],
    [-0.4, 0.62, 1.8],
    [0.12, -0.7, 2.1],
    [-0.68, -0.22, 1.6],
    [0.74, -0.34, 1.5],
  ];
  for (const [fx, fy, size] of specks) {
    g.fillStyle(COLOUR.cloud, Math.min(1, dim + 0.25));
    g.fillCircle(fx * r, fy * r, size);
  }
}

/** Funfair's backing plate — a shooting-gallery target board (SpinnerDef.mount). */
function drawTargetMount(g: Phaser.GameObjects.Graphics, def: SpinnerDef): void {
  const r = def.r * MOUNT_RADIUS_SCALE;
  g.fillStyle(COLOUR.cloud, 0.92);
  g.fillCircle(0, 0, r);
  g.fillStyle(COLOUR.grannyPink, 0.85);
  g.fillCircle(0, 0, r * 0.78);
  g.fillStyle(COLOUR.cloud, 0.92);
  g.fillCircle(0, 0, r * 0.56);
  g.lineStyle(OUTLINE_WIDTH, COLOUR.ink, 0.85);
  g.strokeCircle(0, 0, r);
}

function drawGlow(g: Phaser.GameObjects.Graphics, def: SpinnerDef, state: SpinnerState): void {
  const r = def.r;
  if (state === SpinnerState.FULL) {
    const glowColour = def.style === 'disco' ? COLOUR.grannyPink : COLOUR.sunnyGold;
    g.fillStyle(glowColour, def.style === 'golden' ? 0.4 : 0.22);
    g.fillCircle(0, 0, r + 14);
    g.fillStyle(COLOUR.sunnyGold, 0.1);
    g.fillCircle(0, 0, r + 28);
  } else if (state === SpinnerState.MEDIUM) {
    g.fillStyle(COLOUR.waterBlue, 0.14);
    g.fillCircle(0, 0, r + 8);
  } else if (state === SpinnerState.SLOW) {
    g.fillStyle(COLOUR.heatOrange, 0.08);
    g.fillCircle(0, 0, r + 4);
  }
}

/** Redraws a spinner's blade + glow graphics for its current def/state. Call once per state change. */
export function drawSpinner(
  bladeGfx: Phaser.GameObjects.Graphics,
  glowGfx: Phaser.GameObjects.Graphics,
  def: SpinnerDef,
  state: SpinnerState,
): void {
  bladeGfx.clear();
  const dim = DIM_BY_STATE[state];
  if (def.style === 'cog') drawCog(bladeGfx, def, dim);
  else if (def.style === 'disco') drawDisco(bladeGfx, def, dim);
  else if (def.style === 'golden') drawGolden(bladeGfx, def, dim);
  else if (def.style === 'whisk') drawWhisk(bladeGfx, def, dim);
  else if (def.style === 'sawblade') drawSawBlade(bladeGfx, def, dim);
  else if (def.style === 'candyswirl') drawCandySwirl(bladeGfx, def, dim);
  else if (def.style === 'daisy') drawDaisy(bladeGfx, def, dim);
  else if (def.style === 'record') drawRecord(bladeGfx, def, dim);
  else if (def.style === 'citrus') drawCitrus(bladeGfx, def, dim);
  else drawBlades(bladeGfx, def, dim);
  if (def.sparkle) drawSparkleOverlay(bladeGfx, def, dim);

  glowGfx.clear();
  // Contact shadow first, under the glow — lower-right per CLAUDE.md §5.4's
  // single upper-left light source, so the spinner reads as mounted on the
  // wall behind it rather than hovering in front of the illustration.
  glowGfx.fillStyle(COLOUR.ink, SHADOW_ALPHA);
  glowGfx.fillCircle(
    SHADOW_OFFSET,
    SHADOW_OFFSET,
    (def.mount ? def.r * MOUNT_RADIUS_SCALE : def.r) * 0.92,
  );
  if (def.mount === 'target') drawTargetMount(glowGfx, def);
  drawGlow(glowGfx, def, state);
}
