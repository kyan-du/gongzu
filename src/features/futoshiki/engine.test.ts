import { describe, expect, it } from 'vitest';
import { emptyFutoshikiGrid, hasRowColumnConflict, relationSatisfied, solutionGrid, validateFutoshiki } from './engine';
import { FUTOSHIKI_LEVELS } from './levels';

describe('futoshiki engine', () => {
  it('keeps givens in empty grid', () => { expect(emptyFutoshikiGrid(FUTOSHIKI_LEVELS[0])[0][0]).toBe(1); });
  it('detects row/column conflicts', () => { const grid = emptyFutoshikiGrid(FUTOSHIKI_LEVELS[0]); grid[0][1] = 1; expect(hasRowColumnConflict(grid, 4)).toBe(true); });
  it('checks inequality relations', () => { const puzzle = FUTOSHIKI_LEVELS[0]; expect(relationSatisfied(puzzle.relations[0], solutionGrid(puzzle))).toBe(true); });
  it('validates all curated solutions', () => { for (const puzzle of FUTOSHIKI_LEVELS) expect(validateFutoshiki(puzzle, solutionGrid(puzzle))).toEqual({ ok: true, message: '全部正确！' }); });
});
