import { describe, expect, it } from 'vitest';
import { normalizeCell } from '../grid-engine';
import { generateReasoningPuzzle } from '../grid-reasoning-engine';

describe('grid reasoning engine', () => {
  it('空位仍保持 4 个 cellIdx 各一次、覆盖三行，但不再只钉死在第三列结果宫', () => {
    let seenOutsideResultColumn = false;

    for (let trial = 0; trial < 200; trial++) {
      const puzzle = generateReasoningPuzzle();
      expect(puzzle.hiddenPositions.length, `trial ${trial}: hidden count should be exactly 4`).toBe(4);

      const cellIdxSet = new Set<number>();
      const rowCounts = new Map<number, number>();
      const colCounts = new Map<number, number>();
      for (const pos of puzzle.hiddenPositions) {
        cellIdxSet.add(pos.cellIdx);
        rowCounts.set(pos.row, (rowCounts.get(pos.row) ?? 0) + 1);
        colCounts.set(pos.col, (colCounts.get(pos.col) ?? 0) + 1);
        if (pos.col !== 2) seenOutsideResultColumn = true;
      }

      expect(cellIdxSet.size, `trial ${trial}: each cellIdx should appear exactly once`).toBe(4);
      expect(rowCounts.size, `trial ${trial}: all three rows should still contain visible challenge`).toBe(3);
      expect(Array.from(rowCounts.values()).every((count) => count >= 1 && count <= 2), `trial ${trial}: per-row hidden count should stay between 1 and 2`).toBe(true);
      expect(colCounts.size, `trial ${trial}: hidden positions should span at least two columns`).toBeGreaterThanOrEqual(2);
    }

    expect(seenOutsideResultColumn, 'hidden positions should not stay only in result column across all sampled puzzles').toBe(true);
  });

  it('候选池始终包含全部正确答案映射，且至少一个空位体现旋转或镜像', () => {
    for (let trial = 0; trial < 200; trial++) {
      const puzzle = generateReasoningPuzzle();
      const candidateIds = new Set(puzzle.candidates.map((candidate) => candidate.id));
      let hasVisibleTransform = false;

      for (const pos of puzzle.hiddenPositions) {
        const key = `${pos.row}-${pos.col}-${pos.cellIdx}`;
        const correctId = puzzle.correctAnswers.get(key);
        expect(correctId, `trial ${trial}: missing correct answer for ${key}`).toBeTruthy();
        expect(candidateIds.has(correctId!), `trial ${trial}: candidate pool must include correct answer ${key}`).toBe(true);

        const cell = puzzle.matrix[pos.row][pos.col][pos.cellIdx];
        if (cell.type === 'emoji' && ((cell.rotation || 0) !== 0 || (cell.mirror || 'none') !== 'none')) {
          hasVisibleTransform = true;
        }
      }

      expect(hasVisibleTransform, `trial ${trial}: at least one hidden answer should show rotation or mirror`).toBe(true);
    }
  });

  it('候选池数量稳定、无重复，并始终含有相关干扰项', () => {
    for (let trial = 0; trial < 200; trial++) {
      const puzzle = generateReasoningPuzzle();
      const normalized = puzzle.candidates.map((candidate) => normalizeCell(candidate.content));
      expect(new Set(normalized).size, `trial ${trial}: candidate pool should not contain duplicates`).toBe(normalized.length);
      expect(puzzle.candidates.length, `trial ${trial}: candidate pool should stay bounded`).toBeGreaterThanOrEqual(10);
      expect(puzzle.candidates.length, `trial ${trial}: candidate pool should stay bounded`).toBeLessThanOrEqual(12);

      const correctKeySet = new Set(
        puzzle.hiddenPositions
          .map((pos) => puzzle.matrix[pos.row][pos.col][pos.cellIdx])
          .filter((cell): cell is typeof puzzle.matrix[number][number][number] & { type: 'emoji' } => cell.type === 'emoji')
          .map((cell) => normalizeCell(cell))
      );

      const relatedDistractors = puzzle.candidates.filter((candidate) => {
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

      expect(relatedDistractors.length, `trial ${trial}: no related distractor found in candidate pool`).toBeGreaterThan(0);
    }
  });
});
