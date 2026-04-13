import { describe, expect, it } from 'vitest';
import {
  EMOJI_GROUPS,
  THEME_TRANSFORM_COMPAT,
  buildMergeMatrix,
  buildMixedMatrix,
  generateValidRules,
  randomChoice,
} from '../grid-engine';

function pickEmojiPool(rules: ReturnType<typeof generateValidRules>): string[] {
  const isMirror = rules.cellTransforms.some((t) => t === 'mirror-h' || t === 'mirror-v');
  const isRotate = rules.cellTransforms.some((t) => ['rotate-cw-90', 'rotate-180', 'rotate-ccw-90'].includes(t));

  let availableThemes: string[];
  if (isMirror && isRotate) {
    availableThemes = Object.keys(THEME_TRANSFORM_COMPAT).filter(
      (k) => THEME_TRANSFORM_COMPAT[k].mirror && THEME_TRANSFORM_COMPAT[k].rotate
    );
  } else if (isMirror) {
    availableThemes = Object.keys(THEME_TRANSFORM_COMPAT).filter((k) => THEME_TRANSFORM_COMPAT[k].mirror);
  } else if (isRotate) {
    availableThemes = Object.keys(THEME_TRANSFORM_COMPAT).filter((k) => THEME_TRANSFORM_COMPAT[k].rotate);
  } else {
    availableThemes = Object.keys(THEME_TRANSFORM_COMPAT);
  }

  const groupKey = randomChoice(availableThemes) as keyof typeof EMOJI_GROUPS;
  return [...EMOJI_GROUPS[groupKey]];
}

function relationByRow(matrix: ReturnType<typeof buildMergeMatrix>, cellIdx: number): boolean[] {
  return matrix.map((row) => {
    const left = row[0][cellIdx];
    const mid = row[1][cellIdx];
    if (left.type !== 'emoji' || mid.type !== 'emoji') {
      throw new Error(`expected emoji at cellIdx ${cellIdx}`);
    }
    return left.emoji === mid.emoji;
  });
}

describe('grid reasoning row-pattern consistency', () => {
  it('生成规则时 4 个位置的 same / diff 动作都应明显拉开', () => {
    for (let trial = 0; trial < 120; trial++) {
      const rules = generateValidRules();
      const sameSet = new Set(rules.cellRules.map((rule) => rule.same));
      const diffSet = new Set(rules.cellRules.map((rule) => rule.diff));

      expect(sameSet.size, `trial ${trial}: same-actions should be fully diversified`).toBe(4);
      expect(diffSet.size, `trial ${trial}: diff-actions should be fully diversified`).toBe(4);
    }
  });

  it('merge 题同一 cellIdx 的 same/diff 关系在三行中必须一致，且四个位置不能全同质化', () => {
    for (let trial = 0; trial < 120; trial++) {
      const rules = generateValidRules();
      const matrix = buildMergeMatrix(rules, pickEmojiPool(rules));
      const signatures = new Set<string>();

      for (let cellIdx = 0; cellIdx < 4; cellIdx++) {
        const relation = relationByRow(matrix, cellIdx);
        expect(new Set(relation).size, `trial ${trial}: merge cellIdx ${cellIdx} relation drifted across rows`).toBe(1);
        signatures.add(relation[0] ? 'same' : 'diff');
      }

      expect(signatures.size, `trial ${trial}: merge puzzle became over-homogeneous`).toBeGreaterThan(1);
    }
  });

  it('mixed 题同一 cellIdx 的 same/diff 关系在三行中必须一致，且四个位置不能全同质化', () => {
    for (let trial = 0; trial < 120; trial++) {
      const rules = generateValidRules();
      const matrix = buildMixedMatrix(rules, pickEmojiPool(rules));
      const signatures = new Set<string>();

      for (let cellIdx = 0; cellIdx < 4; cellIdx++) {
        const relation = relationByRow(matrix, cellIdx);
        expect(new Set(relation).size, `trial ${trial}: mixed cellIdx ${cellIdx} relation drifted across rows`).toBe(1);
        signatures.add(relation[0] ? 'same' : 'diff');
      }

      expect(signatures.size, `trial ${trial}: mixed puzzle became over-homogeneous`).toBeGreaterThan(1);
    }
  });
});
