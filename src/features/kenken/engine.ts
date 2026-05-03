import type { KenKenCage, KenKenCheck, KenKenGrid, KenKenPuzzle } from './types';

export const emptyKenKenGrid = (size: number): KenKenGrid => Array.from({ length: size }, () => Array.from({ length: size }, () => null));
export const cageLabel = (cage: KenKenCage) => `${cage.target}${cage.op === '=' ? '' : cage.op}`;

export function findCage(puzzle: KenKenPuzzle, row: number, col: number) {
  return puzzle.cages.find(cage => cage.cells.some(cell => cell.row === row && cell.col === col));
}

export function hasRowColumnConflict(grid: KenKenGrid, size: number): boolean {
  for (let i = 0; i < size; i += 1) {
    const row = grid[i].filter((v): v is number => v !== null);
    const col = grid.map(r => r[i]).filter((v): v is number => v !== null);
    if (new Set(row).size !== row.length || new Set(col).size !== col.length) return true;
  }
  return false;
}

export function cageSatisfied(cage: KenKenCage, values: number[]): boolean {
  if (values.length !== cage.cells.length) return false;
  if (cage.op === '=') return values.length === 1 && values[0] === cage.target;
  if (cage.op === '+') return values.reduce((a, b) => a + b, 0) === cage.target;
  if (cage.op === '×') return values.reduce((a, b) => a * b, 1) === cage.target;
  if (cage.op === '-') return values.length === 2 && Math.abs(values[0] - values[1]) === cage.target;
  if (cage.op === '÷') {
    if (values.length !== 2) return false;
    const [a, b] = values.sort((x, y) => y - x);
    return b !== 0 && a / b === cage.target;
  }
  return false;
}

export function validateKenKen(puzzle: KenKenPuzzle, grid: KenKenGrid): KenKenCheck {
  const { size } = puzzle;
  if (grid.some(row => row.some(value => value === null))) return { ok: false, message: '还有空格没有填。' };
  if (grid.some(row => row.some(value => value === null || value < 1 || value > size))) return { ok: false, message: `只能填 1 到 ${size}。` };
  if (hasRowColumnConflict(grid, size)) return { ok: false, message: '每行每列都不能有重复数字。' };
  for (const cage of puzzle.cages) {
    const values = cage.cells.map(cell => grid[cell.row][cell.col]);
    if (!cageSatisfied(cage, values as number[])) return { ok: false, message: `有一个 ${cageLabel(cage)} 笼子不满足条件。` };
  }
  return { ok: true, message: '全部正确！' };
}

export const solutionGrid = (puzzle: KenKenPuzzle): KenKenGrid => puzzle.solution.map(row => [...row]);
