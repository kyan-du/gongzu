import { describe, expect, it } from 'vitest';
import { normalizeCell } from '../grid-engine';
import { checkReasoningAnswer, generateReasoningPuzzle, sortHiddenPositions } from '../grid-reasoning-engine';

describe('grid reasoning ui helpers', () => {
  it('全填正确答案时应判定满分', () => {
    const puzzle = generateReasoningPuzzle();
    const answers = new Map<string, string>();

    for (const pos of puzzle.hiddenPositions) {
      const key = `${pos.row}-${pos.col}-${pos.cellIdx}`;
      answers.set(key, puzzle.correctAnswers.get(key)!);
    }

    const result = checkReasoningAnswer(puzzle, answers);
    expect(result.total).toBe(puzzle.hiddenPositions.length);
    expect(result.correct).toBe(puzzle.hiddenPositions.length);
    expect(result.details.every((item) => item.correct)).toBe(true);
  });

  it('sortHiddenPositions 严格按 row → col → cellIdx 排序', () => {
    const sorted = sortHiddenPositions([
      { row: 2, col: 2, cellIdx: 0 },
      { row: 0, col: 2, cellIdx: 3 },
      { row: 1, col: 2, cellIdx: 1 },
      { row: 0, col: 2, cellIdx: 0 },
    ]);

    expect(sorted).toEqual([
      { row: 0, col: 2, cellIdx: 0 },
      { row: 0, col: 2, cellIdx: 3 },
      { row: 1, col: 2, cellIdx: 1 },
      { row: 2, col: 2, cellIdx: 0 },
    ]);
  });

  it('候选池优先包含与隐藏位同行/同列同位置的相关干扰项', () => {
    const puzzle = generateReasoningPuzzle();
    const correctKeySet = new Set(
      puzzle.hiddenPositions
        .map((pos) => puzzle.matrix[pos.row][pos.col][pos.cellIdx])
        .filter((cell): cell is typeof puzzle.matrix[number][number][number] & { type: 'emoji' } => cell.type === 'emoji')
        .map((cell) => normalizeCell(cell))
    );

    const hasRelatedDistractor = puzzle.candidates.some((candidate) => {
      const key = normalizeCell(candidate.content);
      if (correctKeySet.has(key)) return false;

      return puzzle.hiddenPositions.some((pos) => {
        for (let c = 0; c < 3; c++) {
          if (c === pos.col) continue;
          const cell = puzzle.matrix[pos.row][c][pos.cellIdx];
          if (cell.type === 'emoji' && normalizeCell(cell) === key) return true;
        }
        for (let r = 0; r < 3; r++) {
          if (r === pos.row) continue;
          const cell = puzzle.matrix[r][pos.col][pos.cellIdx];
          if (cell.type === 'emoji' && normalizeCell(cell) === key) return true;
        }
        return false;
      });
    });

    expect(hasRelatedDistractor).toBe(true);
  });
});
