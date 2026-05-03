import { describe, expect, it } from 'vitest';
import { createBalls, deterministicOddBall, weigh } from './engine';
import { ODD_BALL_LEVELS } from './levels';

describe('odd ball engine', () => {
  it('creates numbered balls', () => {
    expect(createBalls(4)).toEqual([1, 2, 3, 4]);
  });

  it('weighs the heavy ball side', () => {
    expect(weigh([1, 2], [3, 4], 2)).toBe('left-heavy');
    expect(weigh([1, 2], [3, 4], 4)).toBe('right-heavy');
    expect(weigh([1, 2], [3, 4], 5)).toBe('balanced');
  });

  it('levels have deterministic odd balls within range', () => {
    for (const level of ODD_BALL_LEVELS) {
      const oddBall = deterministicOddBall(level.id, level.ballCount);
      expect(oddBall).toBeGreaterThanOrEqual(1);
      expect(oddBall).toBeLessThanOrEqual(level.ballCount);
    }
  });
});
