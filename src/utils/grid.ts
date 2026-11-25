/** Evenly-spaced grid layout math — pure geometry, no Phaser dependency. */

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * How much of a grid cell's shorter side a spinner's diameter may occupy.
 * Below 0.5 two neighbours can never touch; the gap left over is what reads
 * as a laid-out wall rather than a pile.
 */
const FIT_FRACTION = 0.42;

/**
 * Uniform radius multiplier that keeps the largest spinner in a wall inside
 * its own grid cell. Never scales up — a world with room to spare keeps its
 * tuned radii exactly. Needed because the 4-row worlds (Kitchen, Funfair,
 * Disco) pack rows closer together than the tallest spinner kind's diameter,
 * which had neighbours visibly overlapping into one another.
 */
export function fitScaleForGrid(
  cols: number,
  rows: number,
  areaWidth: number,
  areaHeight: number,
  maxRadius: number,
): number {
  const shorterCellSide = Math.min(areaWidth / cols, areaHeight / rows);
  return Math.min(1, (shorterCellSide * FIT_FRACTION) / maxRadius);
}

/** Distributes `cols`×`rows` points evenly within the given rectangle, one point per cell centre. */
export function computeGridPositions(
  cols: number,
  rows: number,
  areaX: number,
  areaY: number,
  areaWidth: number,
  areaHeight: number,
): readonly GridPoint[] {
  const positions: GridPoint[] = [];
  const cellWidth = areaWidth / cols;
  const cellHeight = areaHeight / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: areaX + cellWidth * (col + 0.5),
        y: areaY + cellHeight * (row + 0.5),
      });
    }
  }
  return positions;
}

/** A band never needs more rows than this; walls are wider than they are tall. */
const MAX_PER_ROW = 5;
/** Small bands get big spinners, up to this multiple of their designed size. */
const MAX_BAND_FIT = 1.9;

export interface BandLayout {
  readonly positions: readonly GridPoint[];
  /** The widest row, and the row count — what a spinner has to fit inside. */
  readonly cols: number;
  readonly rows: number;
}

/**
 * Lays out any number of spinners as centred rows — a trio in a line, nine
 * as five over four, sixteen as a square. Unlike {@link computeGridPositions}
 * the count need not fill a rectangle, which is what lets a band grow one
 * musician at a time. Row-major, top row first.
 */
export function layoutBand(
  count: number,
  areaX: number,
  areaY: number,
  areaWidth: number,
  areaHeight: number,
): BandLayout {
  const rows = Math.max(1, Math.ceil(count / MAX_PER_ROW));
  const cols = Math.ceil(count / rows);
  const cellWidth = areaWidth / cols;
  const cellHeight = areaHeight / rows;
  const positions: GridPoint[] = [];
  let remaining = count;
  for (let row = 0; row < rows; row++) {
    const inRow = Math.ceil(remaining / (rows - row));
    remaining -= inRow;
    const rowStart = areaX + (areaWidth - inRow * cellWidth) / 2;
    for (let col = 0; col < inRow; col++) {
      positions.push({
        x: rowStart + cellWidth * (col + 0.5),
        y: areaY + cellHeight * (row + 0.5),
      });
    }
  }
  return { positions, cols, rows };
}

/** As {@link fitScaleForGrid}, but allowed to scale *up*: three spinners should fill the wall, not huddle in it. */
export function fitScaleForBand(
  cols: number,
  rows: number,
  areaWidth: number,
  areaHeight: number,
  maxRadius: number,
): number {
  const shorterCellSide = Math.min(areaWidth / cols, areaHeight / rows);
  return Math.min(MAX_BAND_FIT, (shorterCellSide * FIT_FRACTION) / maxRadius);
}
