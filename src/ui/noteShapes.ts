/**
 * The drawn pieces of the note fountain, painted once into textures: five
 * note shapes (quaver, beamed pair, crotchet, semiquaver, treble clef) and
 * the effects that go with them (ribbon, ring, starburst, streak, spark).
 * Fills are white with a thin Ink outline, so tinting a texture with a
 * section's colour gives that colour on an Ink edge that reads on any backdrop.
 * Drawn at twice size and shown at half, so they stay sharp on a 2x canvas.
 */

import type Phaser from 'phaser';

import { RIBBON_LENGTH } from '../scenes/game/noteMotion';
import type { NoteShape } from '../scenes/game/noteFountainRules';
import { COLOUR } from '../utils/colour';

/** Texture keys for the fountain's pieces. */
export const NOTE_TEXTURE = {
  crotchet: 'fountain-crotchet',
  quaver: 'fountain-quaver',
  semiquaver: 'fountain-semiquaver',
  pair: 'fountain-pair',
  clef: 'fountain-clef',
  ribbon: 'fountain-ribbon',
  ring: 'fountain-ring',
  burst: 'fountain-burst',
  streak: 'fountain-streak',
  spark: 'fountain-spark',
} as const;

/** Textures are drawn this many times larger than they are shown. */
export const TEXTURE_SUPERSAMPLE = 2;

const S = TEXTURE_SUPERSAMPLE;
const OUTLINE = 2;
const WHITE = 0xffffff;

const RIBBON_HEIGHT = 36;
const RIBBON_HALF_WIDTH = 7;
const RIBBON_AMPLITUDE = 10;
const RIBBON_WAVES = 1.5;
const RIBBON_STEPS = 28;
const RING_SIZE = 64;
const RING_RADIUS = 28;
const BURST_RAYS = 12;
const SPARK_SIZE = 16;

type Pen = Phaser.GameObjects.Graphics;
/** Draws one layer of a shape, grown by `grow` px all round, in `colour`. */
type Layer = (g: Pen, grow: number, colour: number) => void;

const ellipse = (g: Pen, x: number, y: number, w: number, h: number): void => {
  g.fillEllipse(x * S, y * S, w * S, h * S);
};
const rect = (g: Pen, x: number, y: number, w: number, h: number): void => {
  g.fillRect(x * S, y * S, w * S, h * S);
};
const polygon = (g: Pen, pts: readonly (readonly [number, number])[]): void => {
  g.fillPoints(
    pts.map(([x, y]) => ({ x: x * S, y: y * S })),
    true,
  );
};

/** Paints an outline layer in Ink, then the fill layer, into a texture. */
function paint(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  layer: Layer,
  outline = true,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  if (outline) {
    g.fillStyle(COLOUR.ink, 1);
    g.lineStyle(OUTLINE * 2 * S + 1, COLOUR.ink, 1);
    layer(g, OUTLINE, COLOUR.ink);
  }
  g.fillStyle(WHITE, 1);
  g.lineStyle(2 * S, WHITE, 1);
  layer(g, 0, WHITE);
  g.generateTexture(key, w * S, h * S);
  g.destroy();
}

/** A head, a stem and optional flags — the shared body of the single notes. */
function single(flags: number): Layer {
  return (g, grow) => {
    ellipse(g, 12, 38, 14 + grow * 2, 10 + grow * 2);
    rect(g, 17 - grow, 8 - grow, 3 + grow * 2, 30 + grow * 2);
    for (let i = 0; i < flags; i++) {
      const y = 8 + i * 7;
      polygon(g, [
        [20 + grow, y - grow],
        [31 + grow, y + 12],
        [20 + grow, y + 16 + grow],
      ]);
    }
  };
}

const beamedPair: Layer = (g, grow) => {
  ellipse(g, 12, 42, 14 + grow * 2, 10 + grow * 2);
  ellipse(g, 40, 34, 14 + grow * 2, 10 + grow * 2);
  rect(g, 17 - grow, 12 - grow, 3 + grow * 2, 30 + grow * 2);
  rect(g, 45 - grow, 4 - grow, 3 + grow * 2, 30 + grow * 2);
  polygon(g, [
    [17 - grow, 12 - grow],
    [48 + grow, 4 - grow],
    [48 + grow, 11 + grow],
    [17 - grow, 19 + grow],
  ]);
};

const trebleClef: Layer = (g, grow, colour) => {
  g.lineStyle((3 + grow * 2) * S, colour, 1);
  g.strokeCircle(18 * S, 40 * S, 7 * S);
  g.strokeEllipse(21 * S, 20 * S, 12 * S, 16 * S);
  g.lineBetween(22 * S, 4 * S, 17 * S, 46 * S);
  g.strokeCircle(14 * S, 50 * S, 2.5 * S);
};

const ribbonShape: Layer = (g, grow) => {
  const top: (readonly [number, number])[] = [];
  const bottom: (readonly [number, number])[] = [];
  for (let i = 0; i <= RIBBON_STEPS; i++) {
    const u = i / RIBBON_STEPS;
    const x = 4 + u * RIBBON_LENGTH;
    const cy = RIBBON_HEIGHT / 2 + Math.sin(u * Math.PI * 2 * RIBBON_WAVES) * RIBBON_AMPLITUDE;
    const half = RIBBON_HALF_WIDTH * (1 - u * 0.85) + grow;
    top.push([x, cy - half]);
    bottom.unshift([x, cy + half]);
  }
  polygon(g, [...top, ...bottom]);
};

const ringShape: Layer = (g, _grow, colour) => {
  g.lineStyle(3 * S, colour, 1);
  g.strokeCircle((RING_SIZE / 2) * S, (RING_SIZE / 2) * S, RING_RADIUS * S);
};

const burstShape: Layer = (g, grow, colour) => {
  g.lineStyle((2.5 + grow) * S, colour, 1);
  const c = (RING_SIZE / 2) * S;
  for (let i = 0; i < BURST_RAYS; i++) {
    const a = (i / BURST_RAYS) * Math.PI * 2;
    const inner = (i % 2 === 0 ? 10 : 15) * S;
    const outer = (i % 2 === 0 ? 29 : 22) * S;
    g.lineBetween(
      c + Math.cos(a) * inner,
      c + Math.sin(a) * inner,
      c + Math.cos(a) * outer,
      c + Math.sin(a) * outer,
    );
  }
};

const streakShape: Layer = (g, grow, colour) => {
  g.lineStyle((3 + grow) * S, colour, 1);
  g.lineBetween(4 * S, 6 * S, 28 * S, 6 * S);
};

const sparkShape: Layer = (g, grow) => {
  const c = SPARK_SIZE / 2;
  const long = 7 + grow;
  const short = 2 + grow * 0.5;
  const pts: (readonly [number, number])[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? long : short;
    pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
  }
  polygon(g, pts);
};

/** Paints every fountain texture the scene does not already have (they persist across scenes). */
export function ensureNoteTextures(scene: Phaser.Scene): void {
  paint(scene, NOTE_TEXTURE.crotchet, 36, 48, single(0));
  paint(scene, NOTE_TEXTURE.quaver, 36, 48, single(1));
  paint(scene, NOTE_TEXTURE.semiquaver, 36, 48, single(2));
  paint(scene, NOTE_TEXTURE.pair, 56, 52, beamedPair);
  paint(scene, NOTE_TEXTURE.clef, 36, 56, trebleClef);
  paint(scene, NOTE_TEXTURE.ribbon, RIBBON_LENGTH + 8, RIBBON_HEIGHT, ribbonShape);
  paint(scene, NOTE_TEXTURE.ring, RING_SIZE, RING_SIZE, ringShape, false);
  paint(scene, NOTE_TEXTURE.burst, RING_SIZE, RING_SIZE, burstShape);
  paint(scene, NOTE_TEXTURE.streak, 32, 12, streakShape);
  paint(scene, NOTE_TEXTURE.spark, SPARK_SIZE, SPARK_SIZE, sparkShape);
}

/** The texture key for a note shape. */
export function textureForShape(shape: NoteShape): string {
  return NOTE_TEXTURE[shape];
}
