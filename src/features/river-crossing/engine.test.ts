import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import { checkDanger, initialPositions, isWon, opposite } from './engine';
import type { Bank, ItemId, Level } from './types';

function level(id: string): Level {
  const found = LEVELS.find(l => l.id === id);
  if (!found) throw new Error(`Missing level: ${id}`);
  return found;
}

function positions(level: Level, right: ItemId[] = []): Record<ItemId, Bank> {
  const result = initialPositions(level);
  for (const id of right) result[id] = 'right';
  return result;
}

describe('river-crossing engine', () => {
  it('returns the opposite bank', () => {
    expect(opposite('left')).toBe('right');
    expect(opposite('right')).toBe('left');
  });

  it('initializes every item on the left bank', () => {
    const l = level('wolf');
    expect(initialPositions(l)).toEqual({ wolf: 'left', sheep: 'left', cabbage: 'left' });
  });

  it('detects win when all items are on the right bank', () => {
    const l = level('wolf');
    expect(isWon(l, positions(l, ['wolf', 'sheep', 'cabbage']))).toBe(true);
    expect(isWon(l, positions(l, ['wolf', 'sheep']))).toBe(false);
  });

  it('checks eats rules only on the bank away from the boat', () => {
    const l = level('wolf');
    const p = positions(l, ['wolf']);

    expect(checkDanger(l, p, 'right')).toContain('左岸只剩羊和菜');
    expect(checkDanger(l, p, 'left')).toBeNull();
  });

  it('checks thief rule when thief is away from the guard with watched people', () => {
    const l = level('police');
    const p = positions(l, ['police']);

    expect(checkDanger(l, p, 'right')).toContain('小偷离开警察');
    expect(checkDanger(l, p, 'left')).toBeNull();
  });

  it('checks outnumber rule when danger group outnumbers safe group', () => {
    const l = level('mission');
    const p = positions(l, ['m1', 'm2', 'c1']);

    expect(checkDanger(l, p, 'right')).toContain('探险员人数少于野人');
  });

  it('allows outnumber bank when no safe group member is present', () => {
    const l = level('mission');
    const p = positions(l, ['m1', 'm2', 'm3']);

    expect(checkDanger(l, p, 'right')).toBeNull();
  });

  it('checks jealous pair rule', () => {
    const l = level('pairs');
    const p = positions(l, ['pa']);

    expect(checkDanger(l, p, 'right')).toContain('甲孩离开自己的家长');
  });

  it('allows jealous pair rule when child is with own parent', () => {
    const l = level('pairs');
    const p = positions(l, ['pb', 'cb']);

    expect(checkDanger(l, p, 'right')).toBeNull();
  });
});
