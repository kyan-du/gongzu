import { describe, expect, it } from 'vitest';
import { empty, fill, initialWater, isWon, pour, waterKey } from './engine';
import { WATER_LEVELS } from './levels';
import type { WaterLevel, WaterLevelDef } from './types';

function solve(level: WaterLevelDef): number | null {
  const start = initialWater(level);
  const queue: Array<{ water: WaterLevel; moves: number }> = [{ water: start, moves: 0 }];
  const seen = new Set([waterKey(level, start)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (isWon(level, current.water)) return current.moves;

    for (const from of level.jugs) {
      const candidates = [
        fill(level, current.water, from.id),
        empty(current.water, from.id),
      ];

      for (const to of level.jugs) {
        if (to.id !== from.id) candidates.push(pour(level, current.water, from.id, to.id));
      }

      for (const next of candidates) {
        const key = waterKey(level, next);
        if (!seen.has(key)) {
          seen.add(key);
          queue.push({ water: next, moves: current.moves + 1 });
        }
      }
    }
  }

  return null;
}

describe('water pouring engine', () => {
  it('pours until source is empty or target is full', () => {
    const level = WATER_LEVELS[0];
    const water = fill(level, initialWater(level), 'b');
    expect(pour(level, water, 'b', 'a')).toEqual({ a: 3, b: 2 });
  });

  it('all levels are solvable', () => {
    for (const level of WATER_LEVELS) {
      expect(solve(level), level.title).not.toBeNull();
    }
  });
});
