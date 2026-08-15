const TABLES_PER_ROW = 4
const TABLE_COLUMN_WIDTH = 280
const TABLE_ROW_HEIGHT = 240

export function gridPosition(index: number): { x: number; y: number } {
  return {
    x: (index % TABLES_PER_ROW) * TABLE_COLUMN_WIDTH,
    y: Math.floor(index / TABLES_PER_ROW) * TABLE_ROW_HEIGHT,
  }
}
