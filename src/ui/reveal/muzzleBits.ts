/**
 * The flying bits of the muzzle burst, drawn at screen scale (never a small
 * picture scaled up): one small routine per `BitShape`. Each draws one bit at
 * (x, y), `size` px across, turned to `rot`, into a Graphics.
 */

import type Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import type { BitShape } from './muzzleStyles.data';

const STAR_POINTS = 5;
const STAR_INNER = 0.45;
const DROP_TAIL = 3.2;
const FLAME_TIP = 2.8;
const JAG_STEPS = 4;
const JAG_LENGTH = 5.5;
const JAG_KINK = 1.1;
const BAND_LENGTH = 3.4;
const BAND_STRIPES = 3;
const SHARD_LENGTH = 2.4;
const SHARD_WIDTH = 0.7;
const BUBBLE_RING_PX = 2.5;
const BUBBLE_FILL = 0.18;
const HIGHLIGHT = 0.36;

/** What one bit looks like this frame. */
export interface BitLook {
  readonly shape: BitShape;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rot: number;
  readonly alpha: number;
  readonly colour: number;
  readonly accent: number;
  /** A small whole number, so a bit keeps its own lumps and kinks from frame to frame. */
  readonly seed: number;
  /** The colours a banded bit cycles through. */
  readonly palette: readonly number[];
}

type Gfx = Phaser.GameObjects.Graphics;

const wobble = (seed: number, k: number): number => Math.sin(seed * 12.9898 + k * 78.233);

function drop(g: Gfx, b: BitLook): void {
  const dx = Math.cos(b.rot);
  const dy = Math.sin(b.rot);
  g.fillStyle(b.colour, b.alpha);
  g.fillCircle(b.x, b.y, b.size);
  g.fillTriangle(
    b.x - dy * b.size * 0.95,
    b.y + dx * b.size * 0.95,
    b.x + dy * b.size * 0.95,
    b.y - dx * b.size * 0.95,
    b.x - dx * b.size * DROP_TAIL,
    b.y - dy * b.size * DROP_TAIL,
  );
  g.fillStyle(COLOUR.cloud, b.alpha * 0.85);
  g.fillCircle(
    b.x + dx * b.size * 0.25 + dy * b.size * 0.3,
    b.y + dy * b.size * 0.25 - dx * b.size * 0.3,
    b.size * HIGHLIGHT,
  );
}

function bubble(g: Gfx, b: BitLook): void {
  g.fillStyle(b.colour, b.alpha * BUBBLE_FILL);
  g.fillCircle(b.x, b.y, b.size * 1.2);
  g.lineStyle(BUBBLE_RING_PX, b.colour, b.alpha);
  g.strokeCircle(b.x, b.y, b.size * 1.2);
  g.fillStyle(COLOUR.cloud, b.alpha);
  g.fillCircle(b.x - b.size * 0.4, b.y - b.size * 0.45, b.size * 0.25);
}

function blob(g: Gfx, b: BitLook): void {
  g.fillStyle(b.colour, b.alpha);
  g.fillCircle(b.x, b.y, b.size * 1.1);
  g.fillCircle(
    b.x - Math.cos(b.rot) * b.size * 1.1,
    b.y - Math.sin(b.rot) * b.size * 1.1,
    b.size * 0.7,
  );
  g.fillCircle(b.x + wobble(b.seed, 1) * b.size, b.y + wobble(b.seed, 2) * b.size, b.size * 0.55);
  g.fillStyle(b.accent, b.alpha * 0.9);
  g.fillCircle(b.x - b.size * 0.3, b.y - b.size * 0.35, b.size * 0.38);
}

function jag(g: Gfx, b: BitLook): void {
  const dx = Math.cos(b.rot);
  const dy = Math.sin(b.rot);
  const step = (b.size * JAG_LENGTH) / JAG_STEPS;
  const path: { x: number; y: number }[] = [];
  for (let i = 0; i <= JAG_STEPS; i++) {
    const kink = i === 0 || i === JAG_STEPS ? 0 : wobble(b.seed, i) * b.size * JAG_KINK;
    path.push({ x: b.x - dx * step * i - dy * kink, y: b.y - dy * step * i + dx * kink });
  }
  const stroke = (width: number, colour: number): void => {
    g.lineStyle(width, colour, b.alpha);
    g.beginPath();
    path.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
    g.strokePath();
  };
  stroke(b.size * 0.55, b.colour);
  stroke(b.size * 0.2, COLOUR.cloud);
}

function flame(g: Gfx, b: BitLook): void {
  const lean = Math.cos(b.rot) * b.size * 0.6;
  const tongue = (scale: number, colour: number, alpha: number): void => {
    const s = b.size * scale;
    g.fillStyle(colour, alpha);
    g.fillCircle(b.x, b.y, s);
    g.fillTriangle(b.x - s, b.y, b.x + s, b.y, b.x + lean * scale, b.y - s * FLAME_TIP);
  };
  tongue(1, b.colour, b.alpha);
  tongue(0.55, b.accent, b.alpha);
}

function star(g: Gfx, b: BitLook): void {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < STAR_POINTS * 2; i++) {
    const r = (i % 2 === 0 ? 1.5 : 1.5 * STAR_INNER) * b.size;
    const a = b.rot + (i / (STAR_POINTS * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r });
  }
  g.fillStyle(b.colour, b.alpha);
  g.fillPoints(pts, true);
  g.fillStyle(b.accent, b.alpha);
  g.fillCircle(b.x, b.y, b.size * 0.4);
}

function shard(g: Gfx, b: BitLook): void {
  const dx = Math.cos(b.rot);
  const dy = Math.sin(b.rot);
  const l = b.size * SHARD_LENGTH;
  const w = b.size * SHARD_WIDTH;
  const pts = [
    { x: b.x + dx * l, y: b.y + dy * l },
    { x: b.x - dy * w, y: b.y + dx * w },
    { x: b.x - dx * l * 0.7, y: b.y - dy * l * 0.7 },
    { x: b.x + dy * w, y: b.y - dx * w },
  ];
  g.fillStyle(b.colour, b.alpha);
  g.fillPoints(pts, true);
  g.lineStyle(b.size * 0.2, COLOUR.cloud, b.alpha);
  g.lineBetween(b.x - dx * l * 0.3, b.y - dy * l * 0.3, b.x + dx * l * 0.7, b.y + dy * l * 0.7);
}

function band(g: Gfx, b: BitLook): void {
  const dx = Math.cos(b.rot);
  const dy = Math.sin(b.rot);
  const half = (b.size * BAND_LENGTH) / 2;
  const width = b.size * 0.9;
  for (let k = 0; k < BAND_STRIPES; k++) {
    const off = (k - (BAND_STRIPES - 1) / 2) * width * 0.8;
    const colour =
      b.palette.length > 0 ? (b.palette[(b.seed + k) % b.palette.length] ?? b.colour) : b.colour;
    g.lineStyle(width, colour, b.alpha);
    g.lineBetween(
      b.x - dx * half - dy * off,
      b.y - dy * half + dx * off,
      b.x + dx * half - dy * off,
      b.y + dy * half + dx * off,
    );
  }
}

const DRAWERS: Readonly<Record<BitShape, (g: Gfx, b: BitLook) => void>> = {
  drop,
  bubble,
  blob,
  jag,
  flame,
  star,
  shard,
  band,
};

/** Draws one bit. */
export function drawBit(g: Gfx, b: BitLook): void {
  DRAWERS[b.shape](g, b);
}
