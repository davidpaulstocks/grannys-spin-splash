/**
 * Procedural draw routines for each spinner style, rewritten from the
 * reference prototype's `redrawSpinner`/`_drawCog`/`_drawDisco`/
 * `_drawGolden` (CLAUDE.md §2 — behavioural/visual reference, not a
 * verbatim port). Module-internal to Spinner.ts; not a shared type.
 * Sprint 1 scope: visually distinct per state, not yet re-skinned to the
 * production hero palette (Sprint 2 story 2.7/2.8 does that pass).
 */

import Phaser from 'phaser';

import { SpinnerState, type SpinnerDef } from '../types/spinner';

/** Brightness multiplier per state — darkest at STOPPED, full colour at FULL. */
const DIM_BY_STATE: Record<SpinnerState, number> = {
  [SpinnerState.STOPPED]: 0.38,
  [SpinnerState.SLOW]: 0.65,
  [SpinnerState.MEDIUM]: 0.85,
  [SpinnerState.FULL]: 1.0,
};

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
  g.fillPath();
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
  g.fillPath();
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
  g.fillPath();
  g.lineStyle(1.5, 0x000000, 0.2);
  g.strokePath();
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
  g.fillPath();
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
  g.fillPath();
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
  g.fillPath();
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
  g.lineStyle(1.5, 0x444444, 0.4);
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
  g.fillPath();
  g.fillStyle(dimColour(colourAt(def, 2), dim), 1);
  drawStarPath(g, def.r * 0.55, def.r * 0.4 * 0.55);
  g.fillPath();
}

function drawGlow(g: Phaser.GameObjects.Graphics, def: SpinnerDef, state: SpinnerState): void {
  const r = def.r;
  if (state === SpinnerState.FULL) {
    const glowColour =
      def.style === 'golden' ? 0xffff00 : def.style === 'disco' ? 0xff88ff : 0xffdd00;
    g.fillStyle(glowColour, def.style === 'golden' ? 0.4 : 0.22);
    g.fillCircle(0, 0, r + 14);
    g.fillStyle(0xffff88, 0.1);
    g.fillCircle(0, 0, r + 28);
  } else if (state === SpinnerState.MEDIUM) {
    g.fillStyle(0xccccff, 0.14);
    g.fillCircle(0, 0, r + 8);
  } else if (state === SpinnerState.SLOW) {
    g.fillStyle(0xffbb44, 0.08);
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
  else drawBlades(bladeGfx, def, dim);

  glowGfx.clear();
  drawGlow(glowGfx, def, state);
}
