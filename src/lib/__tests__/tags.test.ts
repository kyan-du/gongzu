import { describe, expect, it } from 'vitest';
import { getSlug, getTag } from '../tags';

describe('tag slugs', () => {
  it('uses explicit ASCII slugs for known tags', () => {
    expect(getSlug('口算题')).toBe('mental-math');
  });

  it('never percent-encodes unknown Chinese tags into URLs', () => {
    const slug = getSlug('新题型');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug).toMatch(/^quiz-/);
  });

  it('keeps old percent-encoded Chinese links readable', () => {
    expect(getTag('%E5%8F%A3%E7%AE%97%E9%A2%98')).toBe('口算题');
  });
});
