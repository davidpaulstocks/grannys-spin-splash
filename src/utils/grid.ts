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
