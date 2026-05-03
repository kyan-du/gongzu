import { describe, expect, it } from 'vitest';
import { cageForCell, solutionGrid, validateKillerSudoku } from './engine';
import { KILLER_SUDOKU_LEVELS } from './levels';

describe('killer sudoku engine', () => {
  it('finds cage for a cell', () => { expect(cageForCell(KILLER_SUDOKU_LEVELS[0], 0, 0)?.sum).toBe(3); });
  it('rejects row duplicates', () => { const p = KILLER_SUDOKU_LEVELS[0]; const g = solutionGrid(p); g[0][1] = 1; expect(validateKillerSudoku(p, g).ok).toBe(false); });
  it('validates all curated solutions', () => { for (const puzzle of KILLER_SUDOKU_LEVELS) expect(validateKillerSudoku(puzzle, solutionGrid(puzzle))).toEqual({ ok: true, message: '全部正确！' }); });
});
