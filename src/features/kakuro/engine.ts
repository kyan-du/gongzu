import type { KakuroCheck, KakuroGrid, KakuroPuzzle, KakuroRun } from './types';

export const emptyKakuroGrid = (puzzle: KakuroPuzzle): KakuroGrid => puzzle.cells.map(row => row.map(cell => cell.kind === 'play' ? null : null));
export const isPlayCell = (puzzle: KakuroPuzzle, row: number, col: number) => puzzle.cells[row][col].kind === 'play';
export const runSatisfied = (run: KakuroRun, grid: KakuroGrid): boolean => {
  const values = run.cells.map(cell => grid[cell.row][cell.col]);
  if (values.some(value => value === null)) return false;
  const nums = values as number[];
  return nums.reduce((a, b) => a + b, 0) === run.clue && new Set(nums).size === nums.length;
};
export function validateKakuro(puzzle: KakuroPuzzle, grid: KakuroGrid): KakuroCheck {
  for (let r = 0; r < puzzle.rows; r += 1) for (let c = 0; c < puzzle.cols; c += 1) {
    if (isPlayCell(puzzle, r, c)) {
      const v = grid[r][c];
      if (v === null) return { ok: false, message: '还有空格没有填。' };
      if (v < 1 || v > 9) return { ok: false, message: '只能填 1 到 9。' };
    }
  }
  const badAcross = puzzle.acrossRuns.find(run => !runSatisfied(run, grid));
  if (badAcross) return { ok: false, message: `有一段横向和不等于 ${badAcross.clue}，或出现重复数字。` };
  const badDown = puzzle.downRuns.find(run => !runSatisfied(run, grid));
  if (badDown) return { ok: false, message: `有一段纵向和不等于 ${badDown.clue}，或出现重复数字。` };
  return { ok: true, message: '全部正确！' };
}
export const solutionGrid = (puzzle: KakuroPuzzle): KakuroGrid => puzzle.solution.map(row => [...row]);
