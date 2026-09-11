/** Evenly-spaced grid layout math — pure geometry, no Phaser dependency. */

export interface GridPoint {
  readonly x: number;
  readonly y: number;
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
