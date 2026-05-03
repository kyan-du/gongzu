import { describe, expect, it } from 'vitest';
import { runSatisfied, solutionGrid, validateKakuro } from './engine';
import { KAKURO_LEVELS } from './levels';

describe('kakuro engine', () => {
  it('checks runs with no repeated digits', () => { const p = KAKURO_LEVELS[0]; expect(runSatisfied(p.acrossRuns[0], solutionGrid(p))).toBe(true); });
  it('rejects duplicate digits in a run', () => { const p = KAKURO_LEVELS[0]; const g = solutionGrid(p); g[1][1] = 1; g[1][2] = 1; expect(runSatisfied(p.acrossRuns[0], g)).toBe(false); });
  it('validates all curated solutions', () => { for (const puzzle of KAKURO_LEVELS) expect(validateKakuro(puzzle, solutionGrid(puzzle))).toEqual({ ok: true, message: '全部正确！' }); });
});
