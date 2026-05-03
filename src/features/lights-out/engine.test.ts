import { describe, expect, it } from 'vitest';
import { LIGHTS_OUT_LEVELS } from './levels';
import { findOptimalMoves, isSolved, toggleCell } from './engine';

describe('lights out engine', () => {
  it('toggles the center and its four neighbors', () => {
    const board = Array(9).fill(false);
    const next = toggleCell(board, 3, 4);
    expect(next).toEqual([
      false, true, false,
      true, true, true,
      false, true, false,
    ]);
  });

  it('levels are solvable and optimal moves are configured', () => {
    for (const level of LIGHTS_OUT_LEVELS) {
      expect(isSolved(level.start)).toBe(false);
      expect(findOptimalMoves(level)).toBe(level.optimalMoves);
    }
  });
});
