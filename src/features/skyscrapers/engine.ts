import type { SkyscrapersCheck, SkyscrapersGrid, SkyscrapersPuzzle } from './types';

export const cellKey = (row: number, col: number) => `${row},${col}`;
export const visibleCount = (line: number[]): number => {
  let max = 0;
  let count = 0;
  for (const h of line) {
    if (h > max) { max = h; count += 1; }
  }
  return count;
};
export const emptySkyscrapersGrid = (puzzle: SkyscrapersPuzzle): SkyscrapersGrid => Array.from({ length: puzzle.size }, (_, row) => Array.from({ length: puzzle.size }, (_, col) => puzzle.givens[cellKey(row, col)] ?? null));
export const isGiven = (puzzle: SkyscrapersPuzzle, row: number, col: number) => puzzle.givens[cellKey(row, col)] !== undefined;
export const hasRowColumnConflict = (grid: SkyscrapersGrid, size: number): boolean => {
  for (let i = 0; i < size; i += 1) {
    const row = grid[i].filter((v): v is number => v !== null);
    const col = grid.map(r => r[i]).filter((v): v is number => v !== null);
    if (new Set(row).size !== row.length || new Set(col).size !== col.length) return true;
  }
  return false;
};
export function validateSkyscrapers(puzzle: SkyscrapersPuzzle, grid: SkyscrapersGrid): SkyscrapersCheck {
  const { size, clues } = puzzle;
  if (grid.some(row => row.some(value => value === null))) return { ok: false, message: '还有空格没有填。' };
  if (grid.some(row => row.some(value => value === null || value < 1 || value > size))) return { ok: false, message: `只能填 1 到 ${size}。` };
  if (hasRowColumnConflict(grid, size)) return { ok: false, message: '每行每列都不能有重复数字。' };
  for (let r = 0; r < size; r += 1) {
    const row = grid[r] as number[];
    if (clues.left[r] && visibleCount(row) !== clues.left[r]) return { ok: false, message: `第 ${r + 1} 行左侧视线提示不满足。` };
    if (clues.right[r] && visibleCount([...row].reverse()) !== clues.right[r]) return { ok: false, message: `第 ${r + 1} 行右侧视线提示不满足。` };
  }
  for (let c = 0; c < size; c += 1) {
    const col = grid.map(row => row[c]) as number[];
    if (clues.top[c] && visibleCount(col) !== clues.top[c]) return { ok: false, message: `第 ${c + 1} 列上方视线提示不满足。` };
    if (clues.bottom[c] && visibleCount([...col].reverse()) !== clues.bottom[c]) return { ok: false, message: `第 ${c + 1} 列下方视线提示不满足。` };
  }
  return { ok: true, message: '全部正确！' };
}
export const solutionGrid = (puzzle: SkyscrapersPuzzle): SkyscrapersGrid => puzzle.solution.map(row => [...row]);
export const cluesFromSolution = (solution: number[][]) => {
  const size = solution.length;
  return {
    top: Array.from({ length: size }, (_, c) => visibleCount(solution.map(row => row[c]))),
    right: solution.map(row => visibleCount([...row].reverse())),
    bottom: Array.from({ length: size }, (_, c) => visibleCount(solution.map(row => row[c]).reverse())),
    left: solution.map(row => visibleCount(row)),
  };
};
