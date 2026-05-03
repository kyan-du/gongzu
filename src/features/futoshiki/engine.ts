import type { FutoshikiCheck, FutoshikiGrid, FutoshikiPuzzle, FutoshikiRelation } from './types';

export const cellKey = (row: number, col: number) => `${row},${col}`;
export const emptyFutoshikiGrid = (puzzle: FutoshikiPuzzle): FutoshikiGrid => Array.from({ length: puzzle.size }, (_, row) => Array.from({ length: puzzle.size }, (_, col) => puzzle.givens[cellKey(row, col)] ?? null));
export const isGiven = (puzzle: FutoshikiPuzzle, row: number, col: number) => puzzle.givens[cellKey(row, col)] !== undefined;
export const relationSatisfied = (relation: FutoshikiRelation, grid: FutoshikiGrid): boolean => {
  const a = grid[relation.a.row][relation.a.col];
  const b = grid[relation.b.row][relation.b.col];
  if (a === null || b === null) return true;
  return relation.op === '<' ? a < b : a > b;
};
export const hasRowColumnConflict = (grid: FutoshikiGrid, size: number): boolean => {
  for (let i = 0; i < size; i += 1) {
    const row = grid[i].filter((v): v is number => v !== null);
    const col = grid.map(r => r[i]).filter((v): v is number => v !== null);
    if (new Set(row).size !== row.length || new Set(col).size !== col.length) return true;
  }
  return false;
};
export function validateFutoshiki(puzzle: FutoshikiPuzzle, grid: FutoshikiGrid): FutoshikiCheck {
  if (grid.some(row => row.some(value => value === null))) return { ok: false, message: '还有空格没有填。' };
  if (grid.some(row => row.some(value => value === null || value < 1 || value > puzzle.size))) return { ok: false, message: `只能填 1 到 ${puzzle.size}。` };
  if (hasRowColumnConflict(grid, puzzle.size)) return { ok: false, message: '每行每列都不能有重复数字。' };
  const bad = puzzle.relations.find(relation => !relationSatisfied(relation, grid));
  if (bad) return { ok: false, message: `有一个不等号条件不满足。` };
  return { ok: true, message: '全部正确！' };
}
export const solutionGrid = (puzzle: FutoshikiPuzzle): FutoshikiGrid => puzzle.solution.map(row => [...row]);
export const findRightRelation = (puzzle: FutoshikiPuzzle, row: number, col: number) => puzzle.relations.find(r => r.a.row === row && r.a.col === col && r.b.row === row && r.b.col === col + 1);
export const findDownRelation = (puzzle: FutoshikiPuzzle, row: number, col: number) => puzzle.relations.find(r => r.a.row === row && r.a.col === col && r.b.row === row + 1 && r.b.col === col);
