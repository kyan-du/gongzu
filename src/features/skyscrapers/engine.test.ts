import { describe, expect, it } from 'vitest';
import { emptySkyscrapersGrid, hasRowColumnConflict, solutionGrid, validateSkyscrapers, visibleCount } from './engine';
import { SKYSCRAPERS_LEVELS } from './levels';

describe('skyscrapers engine', () => {
  it('counts visible buildings', () => { expect(visibleCount([1, 2, 3, 4])).toBe(4); expect(visibleCount([4, 3, 2, 1])).toBe(1); expect(visibleCount([2, 4, 1, 3])).toBe(2); });
  it('keeps givens in empty grid', () => { expect(emptySkyscrapersGrid(SKYSCRAPERS_LEVELS[0])[0][3]).toBe(4); });
  it('detects row/column conflicts', () => { const grid = emptySkyscrapersGrid(SKYSCRAPERS_LEVELS[0]); grid[0][0] = 4; expect(hasRowColumnConflict(grid, 4)).toBe(true); });
  it('validates all curated solutions', () => { for (const puzzle of SKYSCRAPERS_LEVELS) expect(validateSkyscrapers(puzzle, solutionGrid(puzzle))).toEqual({ ok: true, message: '全部正确！' }); });
});
