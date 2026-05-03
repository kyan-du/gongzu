import type { KillerCage, KillerCheck, KillerGrid, KillerPuzzle } from './types';

export const emptyKillerGrid = (puzzle: KillerPuzzle): KillerGrid => Array.from({ length: puzzle.size }, () => Array.from({ length: puzzle.size }, () => null));
export const cageForCell = (puzzle: KillerPuzzle, row: number, col: number): KillerCage | undefined => puzzle.cages.find(cage => cage.cells.some(cell => cell.row === row && cell.col === col));
export const cagePositionClass = (cage: KillerCage, row: number, col: number): string => {
  const has = (r: number, c: number) => cage.cells.some(cell => cell.row === r && cell.col === c);
  return [!has(row - 1, col) ? 'border-t-2' : 'border-t', !has(row + 1, col) ? 'border-b-2' : 'border-b', !has(row, col - 1) ? 'border-l-2' : 'border-l', !has(row, col + 1) ? 'border-r-2' : 'border-r'].join(' ');
};
const hasDuplicate = (nums: number[]) => new Set(nums).size !== nums.length;
export function validateKillerSudoku(puzzle: KillerPuzzle, grid: KillerGrid): KillerCheck {
  for (let r = 0; r < puzzle.size; r += 1) for (let c = 0; c < puzzle.size; c += 1) {
    const value = grid[r][c];
    if (value === null) return { ok: false, message: '还有空格没有填。' };
    if (value < 1 || value > puzzle.size) return { ok: false, message: `只能填 1 到 ${puzzle.size}。` };
  }
  for (let i = 0; i < puzzle.size; i += 1) {
    if (hasDuplicate(grid[i] as number[])) return { ok: false, message: '每行不能有重复数字。' };
    const col = grid.map(row => row[i]) as number[];
    if (hasDuplicate(col)) return { ok: false, message: '每列不能有重复数字。' };
  }
  for (let br = 0; br < puzzle.size; br += puzzle.boxSize) for (let bc = 0; bc < puzzle.size; bc += puzzle.boxSize) {
    const nums: number[] = [];
    for (let r = br; r < br + puzzle.boxSize; r += 1) for (let c = bc; c < bc + puzzle.boxSize; c += 1) nums.push(grid[r][c] as number);
    if (hasDuplicate(nums)) return { ok: false, message: '每个小宫不能有重复数字。' };
  }
  const bad = puzzle.cages.find(cage => {
    const nums = cage.cells.map(cell => grid[cell.row][cell.col] as number);
    return nums.reduce((a, b) => a + b, 0) !== cage.sum || hasDuplicate(nums);
  });
  if (bad) return { ok: false, message: `有一个小笼的和不等于 ${bad.sum}，或小笼内有重复数字。` };
  return { ok: true, message: '全部正确！' };
}
export const solutionGrid = (puzzle: KillerPuzzle): KillerGrid => puzzle.solution.map(row => [...row]);
