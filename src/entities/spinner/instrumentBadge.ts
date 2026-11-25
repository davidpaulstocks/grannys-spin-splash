/**
 * The badge in a spinner's hub and the section colours of its blades — what
 * makes a spinner visibly *its instrument* (see audio/orchestra/families.ts).
 * The badge sits still while the blades turn, so it can always be read.
 *
 * Icons are drawn, not typeset or loaded: one silhouette per section, simple
 * enough to read at the size of a thumbnail. Painted badges per instrument
 * would be an upgrade and can replace these without touching anything else.
 */

import type Phaser from 'phaser';

import type { InstrumentFamily } from '../../audio/orchestra/families';
import { COLOUR } from '../../utils/colour';

/** Blade colours per section, darkest first — the same order SpinnerDef.colors uses. */
export const FAMILY_PALETTE: Readonly<Record<InstrumentFamily, readonly string[]>> = {
  strings: ['#D9482B', '#F2805A', '#FFC2A8'],
  bass: ['#8A5536', '#B9805A', '#E3B892'],
  woodwind: ['#2F9A68', '#6FCF9B', '#C6F1DA'],
  brass: ['#D79A00', '#FFC93C', '#FFE9A6'],
  plucked: ['#D94A8C', '#FF8FC0', '#FFD3E6'],
  keys: ['#7B4FD0', '#AE8BEE', '#E0D2FA'],
  percussion: ['#2B7FC4', '#6FB8EA', '#C6E4F8'],
};

const BADGE_RADIUS_FRACTION = 0.36;
const BADGE_MIN_RADIUS = 13;
const BADGE_MAX_RADIUS = 30;
const RING_PX = 4;
/** The icon fills this fraction of the badge's diameter. */
const ICON_FRACTION = 0.6;

type IconDrawer = (g: Phaser.GameObjects.Graphics, s: number, colour: number) => void;

/** A violin: two bouts, a neck and a scroll. */
const drawStrings: IconDrawer = (g, s, colour) => {
  g.fillStyle(colour, 1);
  g.fillEllipse(0, s * 0.24, s * 0.56, s * 0.48);
  g.fillEllipse(0, -s * 0.04, s * 0.42, s * 0.36);
  g.fillRect(-s * 0.05, -s * 0.5, s * 0.1, s * 0.44);
  g.fillCircle(0, -s * 0.5, s * 0.08);
};

/** A double bass: the violin's shape made heavy, standing on its spike. */
const drawBass: IconDrawer = (g, s, colour) => {
  g.fillStyle(colour, 1);
  g.fillEllipse(0, s * 0.16, s * 0.7, s * 0.56);
  g.fillEllipse(0, -s * 0.14, s * 0.5, s * 0.36);
  g.fillRect(-s * 0.05, -s * 0.52, s * 0.1, s * 0.4);
  g.fillRect(-s * 0.025, s * 0.4, s * 0.05, s * 0.12);
};

/** A woodwind: a straight tube with finger holes, flaring at the bell. */
const drawWoodwind: IconDrawer = (g, s, colour) => {
  g.fillStyle(colour, 1);
  g.fillRect(-s * 0.08, -s * 0.5, s * 0.16, s * 0.78);
  g.fillTriangle(-s * 0.22, s * 0.5, s * 0.22, s * 0.5, 0, s * 0.18);
  g.fillStyle(COLOUR.cloud, 1);
  for (const y of [-0.3, -0.1, 0.1]) g.fillCircle(0, s * y, s * 0.045);
};

/** Brass: a bell opening to the right, a tube, three valves. */
const drawBrass: IconDrawer = (g, s, colour) => {
  g.fillStyle(colour, 1);
  g.fillTriangle(s * 0.5, -s * 0.32, s * 0.5, s * 0.32, s * 0.02, s * 0.02);
  g.fillRect(-s * 0.5, -s * 0.05, s * 0.62, s * 0.14);
  for (const x of [-0.34, -0.2, -0.06]) g.fillRect(s * x, -s * 0.24, s * 0.08, s * 0.2);
};

/** A harp: a triangular frame strung top to bottom. */
const drawPlucked: IconDrawer = (g, s, colour) => {
  g.lineStyle(s * 0.11, colour, 1);
  g.strokeTriangle(-s * 0.32, -s * 0.46, -s * 0.32, s * 0.46, s * 0.36, -s * 0.34);
  g.lineStyle(s * 0.04, colour, 1);
  for (const x of [-0.16, 0, 0.16])
    g.lineBetween(s * x, -s * (0.4 - (x + 0.16) * 0.2), s * x, s * (0.24 - (x + 0.16) * 1.1));
};

/** Keys and mallets: bars stepping down in length. */
const drawKeys: IconDrawer = (g, s, colour) => {
  g.fillStyle(colour, 1);
  [0.92, 0.74, 0.56, 0.4].forEach((length, i) => {
    g.fillRoundedRect(-s * 0.46 + i * s * 0.25, -(s * length) / 2, s * 0.18, s * length, s * 0.05);
  });
};

/** A drum with two sticks. */
const drawPercussion: IconDrawer = (g, s, colour) => {
  g.fillStyle(colour, 1);
  g.fillRect(-s * 0.36, -s * 0.02, s * 0.72, s * 0.34);
  g.fillEllipse(0, s * 0.32, s * 0.72, s * 0.2);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillEllipse(0, -s * 0.02, s * 0.72, s * 0.2);
  g.lineStyle(s * 0.06, colour, 1);
  g.strokeEllipse(0, -s * 0.02, s * 0.72, s * 0.2);
  g.lineBetween(-s * 0.42, -s * 0.5, s * 0.02, -s * 0.06);
  g.lineBetween(s * 0.42, -s * 0.5, -s * 0.02, -s * 0.06);
};

const ICONS: Readonly<Record<InstrumentFamily, IconDrawer>> = {
  strings: drawStrings,
  bass: drawBass,
  woodwind: drawWoodwind,
  brass: drawBrass,
  plucked: drawPlucked,
  keys: drawKeys,
  percussion: drawPercussion,
};

/** Draws a section's badge centred on (0, 0) into `g`, sized for a spinner of radius `spinnerRadius`. */
export function drawInstrumentBadge(
  g: Phaser.GameObjects.Graphics,
  family: InstrumentFamily,
  spinnerRadius: number,
): void {
  const radius = Math.min(
    BADGE_MAX_RADIUS,
    Math.max(BADGE_MIN_RADIUS, spinnerRadius * BADGE_RADIUS_FRACTION),
  );
  const ring = Number.parseInt((FAMILY_PALETTE[family][0] ?? '#000000').slice(1), 16);
  g.fillStyle(COLOUR.ink, 1);
  g.fillCircle(0, 0, radius + RING_PX / 2 + 1.5);
  g.fillStyle(ring, 1);
  g.fillCircle(0, 0, radius + RING_PX / 2);
  g.fillStyle(COLOUR.cloud, 1);
  g.fillCircle(0, 0, radius - RING_PX / 2);
  ICONS[family](g, radius * 2 * ICON_FRACTION, COLOUR.ink);
}
