import { describe, expect, it } from 'vitest';
import { cageSatisfied, emptyKenKenGrid, hasRowColumnConflict, solutionGrid, validateKenKen } from './engine';
import { KENKEN_LEVELS } from './levels';

describe('kenken engine', () => {
  it('detects row and column conflicts', () => {
    const grid = emptyKenKenGrid(4);
    grid[0][0] = 1;
    grid[0][1] = 1;
    expect(hasRowColumnConflict(grid, 4)).toBe(true);
  });

  it('checks cage operations', () => {
    expect(cageSatisfied({ id: 'a', target: 7, op: '+', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }, [3, 4])).toBe(true);
    expect(cageSatisfied({ id: 'b', target: 12, op: '×', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }, [3, 4])).toBe(true);
    expect(cageSatisfied({ id: 'c', target: 2, op: '-', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }, [4, 2])).toBe(true);
    expect(cageSatisfied({ id: 'd', target: 2, op: '÷', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }, [4, 2])).toBe(true);
  });

  it('validates all curated solutions', () => {
    for (const puzzle of KENKEN_LEVELS) {
      expect(validateKenKen(puzzle, solutionGrid(puzzle))).toEqual({ ok: true, message: '全部正确！' });
    }
  });
});
