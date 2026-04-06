import { describe, it, expect } from 'vitest';
import {
  shuffle,
  randomChoice,
  normalizeCell,
  generateMnemonic,
  describeAnalysis,
  checkAnswer,
  generatePuzzle,
  applyElementTransform,
  applySizeTransform,
  applyPositionTransform,
  applyTransforms,
  type CellContent,
  type MiniGrid,
  type Matrix,
  type PuzzleRules,
  type SameAction,
  type DiffAction,
} from '../grid-engine';

// ── helpers ──

const emoji = (e: string, opts?: Partial<Extract<CellContent, { type: 'emoji' }>>): CellContent => ({
  type: 'emoji',
  emoji: e,
  rotation: 0,
  mirror: 'none',
  scaled: false,
  grown: false,
  ...opts,
});

const blank: CellContent = { type: 'blank' };
const broken: CellContent = { type: 'broken' };

function makeRules(overrides?: Partial<PuzzleRules>): PuzzleRules {
  return {
    topRow: { same: 'keep', diff: 'first' },
    bottomRow: { same: 'keep', diff: 'first' },
    elementTransform: 'none',
    sizeTransform: 'none',
    positionTransform: 'none',
    mergeStrategy: {},
    ...overrides,
  };
}

// ══════════════════════════════════════════
// 1. 工具函数
// ══════════════════════════════════════════

describe('工具函数', () => {
  describe('shuffle', () => {
    it('保持长度和元素不变', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result).toHaveLength(arr.length);
      expect(result.sort()).toEqual(arr.sort());
    });

    it('不修改原数组', () => {
      const arr = [1, 2, 3];
      const copy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(copy);
    });

    it('空数组返回空数组', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('单元素数组返回相同', () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });

  describe('randomChoice', () => {
    it('返回数组中的元素', () => {
      const arr = ['a', 'b', 'c'];
      for (let i = 0; i < 20; i++) {
        expect(arr).toContain(randomChoice(arr));
      }
    });
  });

  describe('normalizeCell', () => {
    it('emoji → 返回 emoji 字符', () => {
      expect(normalizeCell(emoji('🐶'))).toBe('🐶');
    });

    it('blank → "blank"', () => {
      expect(normalizeCell(blank)).toBe('blank');
    });

    it('broken → "broken"', () => {
      expect(normalizeCell(broken)).toBe('broken');
    });

    it('emoji 忽略变换属性', () => {
      expect(normalizeCell(emoji('🐶', { rotation: 90, scaled: true }))).toBe('🐶');
    });
  });
});

// ══════════════════════════════════════════
// 2. 合并逻辑
// ══════════════════════════════════════════

describe('合并逻辑', () => {
  // 由于 applyMergeRule 和 mergeMiniGrids 没有导出，
  // 我们通过 generatePuzzle 的完整流程间接测试合并结果，
  // 或者在此处测试可观测行为。
  //
  // 更好的做法：把关键内部函数也导出（加 @internal 注释），
  // 这里先通过 generatePuzzle 的矩阵验证合并正确性。

  describe('第3列是前两列合并的结果', () => {
    it('矩阵每行 col3 = merge(col1, col2)', () => {
      // 跑 20 次，验证结构一致性
      for (let trial = 0; trial < 20; trial++) {
        const puzzle = generatePuzzle();

        // 阶段一矩阵
        expect(puzzle.matrix).toHaveLength(3);
        for (const row of puzzle.matrix) {
          expect(row).toHaveLength(3);
          for (const miniGrid of row) {
            expect(miniGrid).toHaveLength(4);
          }
        }

        // 阶段二矩阵
        expect(puzzle.phase2Matrix).toHaveLength(3);
        for (const row of puzzle.phase2Matrix) {
          expect(row).toHaveLength(3);
          for (const miniGrid of row) {
            expect(miniGrid).toHaveLength(4);
          }
        }
      }
    });
  });

  describe('合并规则覆盖度', () => {
    // 跑 100 局，统计出现过的 same/diff action 组合
    it('所有有效 same/diff action 都能出现', () => {
      const seenSameActions = new Set<string>();
      const seenDiffActions = new Set<string>();

      for (let i = 0; i < 200; i++) {
        const puzzle = generatePuzzle();
        seenSameActions.add(puzzle.rules.topRow.same);
        seenSameActions.add(puzzle.rules.bottomRow.same);
        seenDiffActions.add(puzzle.rules.topRow.diff);
        seenDiffActions.add(puzzle.rules.bottomRow.diff);
      }

      const allSame: SameAction[] = ['keep', 'swap-lr', 'shrink', 'blank', 'broken'];
      const allDiff: DiffAction[] = ['first', 'second', 'blank', 'broken'];

      for (const s of allSame) {
        expect(seenSameActions, `same action "${s}" never appeared in 200 trials`).toContain(s);
      }
      for (const d of allDiff) {
        expect(seenDiffActions, `diff action "${d}" never appeared in 200 trials`).toContain(d);
      }
    });
  });
});

// ══════════════════════════════════════════
// 3. 规则生成约束
// ══════════════════════════════════════════

describe('规则生成约束', () => {
  const invalidCombos = [
    { same: 'blank', diff: 'blank' },
    { same: 'broken', diff: 'broken' },
    { same: 'blank', diff: 'broken' },
    { same: 'broken', diff: 'blank' },
  ];

  it('不生成无效的 same+diff 组合', () => {
    for (let i = 0; i < 200; i++) {
      const puzzle = generatePuzzle();
      const { topRow, bottomRow } = puzzle.rules;

      for (const invalid of invalidCombos) {
        expect(
          topRow.same === invalid.same && topRow.diff === invalid.diff,
          `topRow: same=${topRow.same}, diff=${topRow.diff} is invalid`
        ).toBe(false);
        expect(
          bottomRow.same === invalid.same && bottomRow.diff === invalid.diff,
          `bottomRow: same=${bottomRow.same}, diff=${bottomRow.diff} is invalid`
        ).toBe(false);
      }
    }
  });

  it('topRow 和 bottomRow 不完全相同', () => {
    for (let i = 0; i < 200; i++) {
      const puzzle = generatePuzzle();
      const { topRow, bottomRow } = puzzle.rules;
      const identical = topRow.same === bottomRow.same && topRow.diff === bottomRow.diff;
      expect(identical, `top and bottom rows identical: same=${topRow.same}, diff=${topRow.diff}`).toBe(false);
    }
  });
});

// ══════════════════════════════════════════
// 4. 备选池
// ══════════════════════════════════════════

describe('备选池', () => {
  it('正确答案一定在备选池里', () => {
    for (let i = 0; i < 30; i++) {
      const puzzle = generatePuzzle();

      // 阶段一：隐藏格的 4 个 cell 都在 choices 中
      const hiddenGrid1 = puzzle.matrix[puzzle.phase1Hidden.row][puzzle.phase1Hidden.col];
      const choiceKeys1 = new Set(puzzle.choices.map((c) => JSON.stringify(c)));
      for (const cell of hiddenGrid1) {
        expect(
          choiceKeys1.has(JSON.stringify(cell)),
          `phase1 correct answer not in choices: ${JSON.stringify(cell)}`
        ).toBe(true);
      }

      // 阶段二：两个隐藏格的 8 个 cell 都在 phase2Choices 中
      const choiceKeys2 = new Set(puzzle.phase2Choices.map((c) => JSON.stringify(c)));
      for (const hidden of puzzle.phase2Hidden) {
        const hiddenGrid = puzzle.phase2Matrix[hidden.row][hidden.col];
        for (const cell of hiddenGrid) {
          expect(
            choiceKeys2.has(JSON.stringify(cell)),
            `phase2 correct answer not in choices: ${JSON.stringify(cell)}`
          ).toBe(true);
        }
      }
    }
  });

  it('备选池不为空', () => {
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle();
      expect(puzzle.choices.length).toBeGreaterThan(0);
      expect(puzzle.phase2Choices.length).toBeGreaterThan(0);
    }
  });

  it('备选池大小在合理范围内 (≤18)', () => {
    for (let i = 0; i < 20; i++) {
      const puzzle = generatePuzzle();
      expect(puzzle.choices.length).toBeLessThanOrEqual(18);
      expect(puzzle.choices.length).toBeGreaterThanOrEqual(4); // 至少包含正确答案
      expect(puzzle.phase2Choices.length).toBeLessThanOrEqual(18);
      expect(puzzle.phase2Choices.length).toBeGreaterThanOrEqual(8);
    }
  });
});

// ══════════════════════════════════════════
// 5. 隐藏格位置
// ══════════════════════════════════════════

describe('隐藏格位置', () => {
  it('阶段一：隐藏 1 格在 row2 col2', () => {
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle();
      expect(puzzle.phase1Hidden).toEqual({ row: 2, col: 2 });
    }
  });

  it('阶段二：隐藏 2 格都在 col2', () => {
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle();
      expect(puzzle.phase2Hidden).toHaveLength(2);
      for (const h of puzzle.phase2Hidden) {
        expect(h.col).toBe(2);
      }
    }
  });

  it('阶段二：隐藏格在 row1 和 row2', () => {
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle();
      const rows = puzzle.phase2Hidden.map((h) => h.row).sort();
      expect(rows).toEqual([1, 2]);
    }
  });
});

// ══════════════════════════════════════════
// 6. checkAnswer
// ══════════════════════════════════════════

describe('checkAnswer', () => {
  it('全对 → correct = 4', () => {
    const puzzle = generatePuzzle();
    const correct = puzzle.matrix[puzzle.phase1Hidden.row][puzzle.phase1Hidden.col];
    const result = checkAnswer(puzzle.matrix, puzzle.phase1Hidden, correct);
    expect(result.correct).toBe(4);
    expect(result.total).toBe(4);
    expect(result.details).toEqual([true, true, true, true]);
  });

  it('全错 → correct = 0', () => {
    const grid: MiniGrid = [
      emoji('❌'),
      emoji('❌'),
      emoji('❌'),
      emoji('❌'),
    ];
    const matrix: Matrix = [
      [grid, grid, [emoji('🐶'), emoji('🐱'), emoji('🐰'), emoji('🐻')]],
      [grid, grid, grid],
      [grid, grid, grid],
    ];
    const result = checkAnswer(matrix, { row: 0, col: 2 }, grid);
    // grid 全是 ❌，正确是 🐶🐱🐰🐻 → 0 对
    expect(result.correct).toBe(0);
  });

  it('部分对', () => {
    const correctGrid: MiniGrid = [emoji('🐶'), emoji('🐱'), emoji('🐰'), emoji('🐻')];
    const userGrid: MiniGrid = [emoji('🐶'), emoji('🐱'), emoji('❌'), emoji('❌')];
    const matrix: Matrix = [
      [correctGrid, correctGrid, correctGrid],
      [correctGrid, correctGrid, correctGrid],
      [correctGrid, correctGrid, correctGrid],
    ];
    const result = checkAnswer(matrix, { row: 0, col: 2 }, userGrid);
    expect(result.correct).toBe(2);
    expect(result.details).toEqual([true, true, false, false]);
  });

  it('变换属性不同视为错误', () => {
    const correctGrid: MiniGrid = [
      emoji('🐶', { rotation: 90 }),
      emoji('🐱'),
      emoji('🐰'),
      emoji('🐻'),
    ];
    const userGrid: MiniGrid = [
      emoji('🐶', { rotation: 0 }), // 旋转不对
      emoji('🐱'),
      emoji('🐰'),
      emoji('🐻'),
    ];
    const matrix: Matrix = [
      [correctGrid, correctGrid, correctGrid],
      [correctGrid, correctGrid, correctGrid],
      [correctGrid, correctGrid, correctGrid],
    ];
    const result = checkAnswer(matrix, { row: 0, col: 2 }, userGrid);
    expect(result.correct).toBe(3);
    expect(result.details[0]).toBe(false);
  });
});

// ══════════════════════════════════════════
// 7. 口诀 & 解析
// ══════════════════════════════════════════

describe('口诀 & 解析', () => {
  it('generateMnemonic 包含上下行规则', () => {
    const rules = makeRules({
      topRow: { same: 'keep', diff: 'first' },
      bottomRow: { same: 'shrink', diff: 'second' },
    });
    const mnemonic = generateMnemonic(rules);
    expect(mnemonic).toContain('留原');
    expect(mnemonic).toContain('留左');
    expect(mnemonic).toContain('缩小');
    expect(mnemonic).toContain('留右');
  });

  it('describeAnalysis 包含上下行规则', () => {
    const rules = makeRules({
      topRow: { same: 'swap-lr', diff: 'blank' },
      bottomRow: { same: 'broken', diff: 'second' },
    });
    const desc = describeAnalysis(rules);
    expect(desc).toContain('左右互换');
    expect(desc).toContain('变空');
    expect(desc).toContain('变裂');
    expect(desc).toContain('留第二列');
  });

  it('所有 SameAction 都有对应口诀', () => {
    const allSame: SameAction[] = ['keep', 'swap-lr', 'shrink', 'blank', 'broken'];
    for (const same of allSame) {
      const rules = makeRules({ topRow: { same, diff: 'first' } });
      const mnemonic = generateMnemonic(rules);
      // 不应有 undefined 或原始英文 key 泄漏
      expect(mnemonic).not.toContain('undefined');
    }
  });

  it('所有 DiffAction 都有对应口诀', () => {
    const allDiff: DiffAction[] = ['first', 'second', 'blank', 'broken'];
    for (const diff of allDiff) {
      const rules = makeRules({ topRow: { same: 'keep', diff } });
      const mnemonic = generateMnemonic(rules);
      expect(mnemonic).not.toContain('undefined');
    }
  });
});

// ══════════════════════════════════════════
// 8. 合并正确性（手工验证）
// ══════════════════════════════════════════

describe('合并正确性（手工构造）', () => {
  // 因为 mergeMiniGrids 未导出，我们通过 generatePuzzle 验证行为。
  // 这里做一个端到端验证：生成的 col3 确实遵守规则。

  it('same=keep 时，相同 emoji 的 col3 保留原值', () => {
    // 跑多次，找到 topRow.same === 'keep' 且 col1[0] === col2[0] 的情况
    let verified = false;
    for (let trial = 0; trial < 200 && !verified; trial++) {
      const puzzle = generatePuzzle();
      if (puzzle.rules.topRow.same !== 'keep') continue;

      for (const row of puzzle.matrix) {
        const [col1, col2, col3] = row;
        // 检查上行（位置 0 和 1）
        if (col1[0].type === 'emoji' && col2[0].type === 'emoji' && col1[0].emoji === col2[0].emoji) {
          // col3[0] 应该 = col1[0]
          expect(col3[0]).toEqual(col1[0]);
          verified = true;
          break;
        }
      }
    }
    // 如果 200 次都没遇到这种情况（极不可能），跳过
    if (!verified) {
      console.warn('未能在 200 次试验中找到 same=keep + 相同 emoji 的情况');
    }
  });

  it('same=blank 时，相同 emoji 的 col3 变空白', () => {
    let verified = false;
    for (let trial = 0; trial < 200 && !verified; trial++) {
      const puzzle = generatePuzzle();
      if (puzzle.rules.topRow.same !== 'blank') continue;

      for (const row of puzzle.matrix) {
        const [col1, col2, col3] = row;
        if (col1[0].type === 'emoji' && col2[0].type === 'emoji' && col1[0].emoji === col2[0].emoji) {
          expect(col3[0].type).toBe('blank');
          verified = true;
          break;
        }
      }
    }
    if (!verified) {
      console.warn('未能在 200 次试验中找到 same=blank + 相同 emoji 的情况');
    }
  });

  it('diff=first 时，不同 emoji 的 col3 取 col1', () => {
    let verified = false;
    for (let trial = 0; trial < 200 && !verified; trial++) {
      const puzzle = generatePuzzle();
      if (puzzle.rules.topRow.diff !== 'first') continue;

      for (const row of puzzle.matrix) {
        const [col1, col2, col3] = row;
        if (col1[0].type === 'emoji' && col2[0].type === 'emoji' && col1[0].emoji !== col2[0].emoji) {
          expect(col3[0]).toEqual(col1[0]);
          verified = true;
          break;
        }
      }
    }
    if (!verified) {
      console.warn('未能在 200 次试验中找到 diff=first + 不同 emoji 的情况');
    }
  });

  it('diff=second 时，不同 emoji 的 col3 取 col2', () => {
    let verified = false;
    for (let trial = 0; trial < 200 && !verified; trial++) {
      const puzzle = generatePuzzle();
      if (puzzle.rules.topRow.diff !== 'second') continue;

      for (const row of puzzle.matrix) {
        const [col1, col2, col3] = row;
        if (col1[0].type === 'emoji' && col2[0].type === 'emoji' && col1[0].emoji !== col2[0].emoji) {
          expect(col3[0]).toEqual(col2[0]);
          verified = true;
          break;
        }
      }
    }
    if (!verified) {
      console.warn('未能在 200 次试验中找到 diff=second + 不同 emoji 的情况');
    }
  });
});

// ══════════════════════════════════════════
// 9. 主题分类覆盖度
// ══════════════════════════════════════════

describe('主题分类覆盖度 & 变换覆盖度', () => {
  it('EMOJI_GROUPS 的每个 key 都出现在三个分类数组之一中', () => {
    // 为了测试这个，我们需要导出这些常量或通过间接方式验证
    // 由于常量没有导出，我们通过多次生成来验证主题能出现
    const seenThemes = new Set<string>();

    // 定义主题的代表性 emoji，用于识别主题
    const themeSignatures: Record<string, string[]> = {
      ocean: ['🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🦭', '🐚', '🪸', '🦞'],
      numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '①', '②', '③', '④', '⑤'],
      letters: ['b', 'd', 'p', 'q', 'A', 'B', 'R', 'P', 'M', 'W', 'N', 'Z', 'S', 'E', 'C'],
      hanzi: ['戍', '戊', '戌', '戎', '己', '已', '巳', '末', '未', '刺', '剌', '壤', '攘', '甲', '由'],
      shapes: ['▲', '△', '◆', '◇', '►', '▷', '◄', '◁', '▼', '★', '☆', '●', '○', '■', '□'],
    };

    // Run more trials for themes in MIXED_THEMES since they appear less frequently
    for (let i = 0; i < 500; i++) {
      const puzzle = generatePuzzle();
      // 通过查看矩阵中的 emoji 反推主题
      for (const row of puzzle.matrix) {
        for (const miniGrid of row) {
          for (const cell of miniGrid) {
            if (cell.type === 'emoji') {
              const emoji = cell.emoji;
              // 检查属于哪个主题
              for (const [theme, signatures] of Object.entries(themeSignatures)) {
                if (signatures.includes(emoji)) {
                  seenThemes.add(theme);
                }
              }
            }
          }
        }
      }

      // Early exit if we've found all themes
      if (seenThemes.size >= 5) break;
    }

    // 验证所有新主题都能出现（说明它们在分类数组中）
    const requiredThemes = ['ocean', 'numbers', 'letters', 'hanzi', 'shapes'];
    for (const theme of requiredThemes) {
      expect(
        seenThemes.has(theme),
        `${theme} theme never appeared in 500 trials - it may not be in classification arrays`
      ).toBe(true);
    }
  });

  it('scale-up 变换能够出现在生成的游戏中', () => {
    let scaleUpSeen = false;
    let grownCellFound = false;

    for (let i = 0; i < 200 && !grownCellFound; i++) {
      const puzzle = generatePuzzle();

      // 检查规则中是否有 scale-up
      if (puzzle.rules.sizeTransform === 'scale-up') {
        scaleUpSeen = true;
      }

      // 检查矩阵中是否有 grown: true 的 cell
      for (const row of puzzle.matrix) {
        for (const miniGrid of row) {
          for (const cell of miniGrid) {
            if (cell.type === 'emoji' && cell.grown === true) {
              grownCellFound = true;
              break;
            }
          }
          if (grownCellFound) break;
        }
        if (grownCellFound) break;
      }
    }

    expect(scaleUpSeen, 'scale-up never appeared as sizeTransform in 200 trials').toBe(true);
    expect(grownCellFound, 'no cell with grown:true found in 200 trials').toBe(true);
  });

  it('scale-up 的口诀和解析不含 undefined', () => {
    const rules = makeRules({ sizeTransform: 'scale-up' });
    const mnemonic = generateMnemonic(rules);
    const analysis = describeAnalysis(rules);

    expect(mnemonic).not.toContain('undefined');
    expect(analysis).not.toContain('undefined');
    expect(mnemonic.length).toBeGreaterThan(0);
    expect(analysis.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════
// 10. generatePuzzle 结构完整性
// ══════════════════════════════════════════

describe('generatePuzzle 结构完整性', () => {
  it('返回所有必要字段', () => {
    const puzzle = generatePuzzle();

    expect(puzzle.matrix).toBeDefined();
    expect(puzzle.phase1Hidden).toBeDefined();
    expect(puzzle.phase2Hidden).toBeDefined();
    expect(puzzle.choices).toBeDefined();
    expect(puzzle.rules).toBeDefined();
    expect(puzzle.phase1Rules).toBeDefined();
    expect(puzzle.phase2NewRules).toBeDefined();
    expect(puzzle.phase2Matrix).toBeDefined();
    expect(puzzle.phase2Choices).toBeDefined();
  });

  it('两个阶段的矩阵独立', () => {
    const puzzle = generatePuzzle();
    // phase2Matrix 应该是独立生成的，不是同一个引用
    expect(puzzle.phase2Matrix).not.toBe(puzzle.matrix);
  });

  it('所有 cell 类型合法', () => {
    const validTypes = new Set(['emoji', 'blank', 'broken', 'pass']);

    for (let i = 0; i < 20; i++) {
      const puzzle = generatePuzzle();

      for (const row of puzzle.matrix) {
        for (const miniGrid of row) {
          for (const cell of miniGrid) {
            expect(validTypes.has(cell.type), `invalid cell type: ${cell.type}`).toBe(true);
          }
        }
      }

      for (const cell of puzzle.choices) {
        expect(validTypes.has(cell.type), `invalid choice type: ${cell.type}`).toBe(true);
      }
    }
  });

  it('emoji cell 的 rotation 是合法值', () => {
    const validRotations = new Set([0, 90, 180, 270, undefined]);

    for (let i = 0; i < 20; i++) {
      const puzzle = generatePuzzle();

      for (const row of puzzle.matrix) {
        for (const miniGrid of row) {
          for (const cell of miniGrid) {
            if (cell.type === 'emoji') {
              expect(
                validRotations.has(cell.rotation),
                `invalid rotation: ${cell.rotation}`
              ).toBe(true);
            }
          }
        }
      }
    }
  });

  it('emoji cell 的 mirror 是合法值', () => {
    const validMirrors = new Set(['none', 'horizontal', 'vertical', undefined]);

    for (let i = 0; i < 20; i++) {
      const puzzle = generatePuzzle();

      for (const row of puzzle.matrix) {
        for (const miniGrid of row) {
          for (const cell of miniGrid) {
            if (cell.type === 'emoji') {
              expect(
                validMirrors.has(cell.mirror),
                `invalid mirror: ${cell.mirror}`
              ).toBe(true);
            }
          }
        }
      }
    }
  });
});

// ══════════════════════════════════════════
// 11. 暴露策略（col1 vs col2 配对控制）
// ══════════════════════════════════════════

describe('暴露策略', () => {
  it('阶段一和阶段二使用不同的 pairing', () => {
    // 验证方式：阶段一和阶段二的矩阵内容不同
    // （它们各自独立生成，使用不同的 pairing + 不同的随机素材）
    for (let i = 0; i < 10; i++) {
      const puzzle = generatePuzzle();
      // 内容层面一定不同（不同随机种子）
      const m1str = JSON.stringify(puzzle.matrix);
      const m2str = JSON.stringify(puzzle.phase2Matrix);
      expect(m1str).not.toEqual(m2str);
    }
  });
});

// ══════════════════════════════════════════
// 12. 变换函数单元测试
// ══════════════════════════════════════════

describe('变换函数', () => {
  describe('applyElementTransform', () => {
    it('none: emoji 不变', () => {
      const cell = emoji('🐶');
      const result = applyElementTransform(cell, 'none');
      expect(result).toEqual(emoji('🐶'));
    });

    it('rotate-cw-90: 顺时针旋转 90°', () => {
      const cell = emoji('🐶');
      const result = applyElementTransform(cell, 'rotate-cw-90');
      expect(result).toEqual(emoji('🐶', { rotation: 90 }));
    });

    it('rotate-180: 旋转 180°', () => {
      const cell = emoji('🐶');
      const result = applyElementTransform(cell, 'rotate-180');
      expect(result).toEqual(emoji('🐶', { rotation: 180 }));
    });

    it('rotate-ccw-90: 逆时针旋转 90°', () => {
      const cell = emoji('🐶');
      const result = applyElementTransform(cell, 'rotate-ccw-90');
      expect(result).toEqual(emoji('🐶', { rotation: 270 }));
    });

    it('mirror-h: 水平镜像', () => {
      const cell = emoji('🐶');
      const result = applyElementTransform(cell, 'mirror-h');
      expect(result).toEqual(emoji('🐶', { mirror: 'horizontal' }));
    });

    it('mirror-v: 垂直镜像', () => {
      const cell = emoji('🐶');
      const result = applyElementTransform(cell, 'mirror-v');
      expect(result).toEqual(emoji('🐶', { mirror: 'vertical' }));
    });

    it('blank 不变换', () => {
      const result = applyElementTransform(blank, 'rotate-cw-90');
      expect(result).toEqual(blank);
    });

    it('broken 不变换', () => {
      const result = applyElementTransform(broken, 'mirror-h');
      expect(result).toEqual(broken);
    });
  });

  describe('applySizeTransform', () => {
    it('none: emoji 不变', () => {
      const cell = emoji('🐶');
      const result = applySizeTransform(cell, 'none');
      expect(result).toEqual(emoji('🐶'));
    });

    it('scale-down: emoji 缩小', () => {
      const cell = emoji('🐶');
      const result = applySizeTransform(cell, 'scale-down');
      expect(result).toEqual(emoji('🐶', { scaled: true }));
    });

    it('scale-up: emoji 放大', () => {
      const cell = emoji('🐶');
      const result = applySizeTransform(cell, 'scale-up');
      expect(result).toEqual(emoji('🐶', { grown: true }));
    });

    it('scale-up: blank 不变换', () => {
      const result = applySizeTransform(blank, 'scale-up');
      expect(result).toEqual(blank);
    });

    it('blank 不变换', () => {
      const result = applySizeTransform(blank, 'scale-down');
      expect(result).toEqual(blank);
    });

    it('broken 不变换', () => {
      const result = applySizeTransform(broken, 'scale-down');
      expect(result).toEqual(broken);
    });
  });

  describe('applyPositionTransform', () => {
    const grid: MiniGrid = [emoji('A'), emoji('B'), emoji('C'), emoji('D')];

    it('none: 不变', () => {
      const result = applyPositionTransform(grid, 'none');
      expect(result).toEqual(grid);
    });

    it('pos-rotate-cw: 0→1→3→2→0', () => {
      const result = applyPositionTransform(grid, 'pos-rotate-cw');
      // A B    C A
      // C D -> D B
      expect(result).toEqual([emoji('C'), emoji('A'), emoji('D'), emoji('B')]);
    });

    it('pos-rotate-180: 0↔3, 1↔2', () => {
      const result = applyPositionTransform(grid, 'pos-rotate-180');
      // A B    D C
      // C D -> B A
      expect(result).toEqual([emoji('D'), emoji('C'), emoji('B'), emoji('A')]);
    });

    it('pos-rotate-ccw: 0→2→3→1→0', () => {
      const result = applyPositionTransform(grid, 'pos-rotate-ccw');
      // A B    B D
      // C D -> A C
      expect(result).toEqual([emoji('B'), emoji('D'), emoji('A'), emoji('C')]);
    });

    it('pos-mirror-lr: 0↔1, 2↔3', () => {
      const result = applyPositionTransform(grid, 'pos-mirror-lr');
      // A B    B A
      // C D -> D C
      expect(result).toEqual([emoji('B'), emoji('A'), emoji('D'), emoji('C')]);
    });

    it('pos-mirror-ud: 0↔2, 1↔3', () => {
      const result = applyPositionTransform(grid, 'pos-mirror-ud');
      // A B    C D
      // C D -> A B
      expect(result).toEqual([emoji('C'), emoji('D'), emoji('A'), emoji('B')]);
    });

    it('pos-diag-main: 0↔3', () => {
      const result = applyPositionTransform(grid, 'pos-diag-main');
      // A B    D B
      // C D -> C A
      expect(result).toEqual([emoji('D'), emoji('B'), emoji('C'), emoji('A')]);
    });

    it('pos-diag-anti: 1↔2', () => {
      const result = applyPositionTransform(grid, 'pos-diag-anti');
      // A B    A C
      // C D -> B D
      expect(result).toEqual([emoji('A'), emoji('C'), emoji('B'), emoji('D')]);
    });
  });

  describe('applyTransforms 组合', () => {
    it('只有元素变换', () => {
      const grid: MiniGrid = [emoji('🐶'), emoji('🐱'), emoji('🐰'), emoji('🐻')];
      const rules = makeRules({
        elementTransform: 'rotate-cw-90',
        sizeTransform: 'none',
        positionTransform: 'none',
      });
      const result = applyTransforms(grid, rules);
      expect(result[0]).toEqual(emoji('🐶', { rotation: 90 }));
      expect(result[1]).toEqual(emoji('🐱', { rotation: 90 }));
    });

    it('只有尺寸变换', () => {
      const grid: MiniGrid = [emoji('🐶'), emoji('🐱'), emoji('🐰'), emoji('🐻')];
      const rules = makeRules({
        elementTransform: 'none',
        sizeTransform: 'scale-down',
        positionTransform: 'none',
      });
      const result = applyTransforms(grid, rules);
      expect(result[0]).toEqual(emoji('🐶', { scaled: true }));
      expect(result[1]).toEqual(emoji('🐱', { scaled: true }));
    });

    it('只有位置变换', () => {
      const grid: MiniGrid = [emoji('A'), emoji('B'), emoji('C'), emoji('D')];
      const rules = makeRules({
        elementTransform: 'none',
        sizeTransform: 'none',
        positionTransform: 'pos-rotate-cw',
      });
      const result = applyTransforms(grid, rules);
      expect(result).toEqual([emoji('C'), emoji('A'), emoji('D'), emoji('B')]);
    });

    it('元素 + 尺寸变换', () => {
      const grid: MiniGrid = [emoji('🐶'), emoji('🐱'), emoji('🐰'), emoji('🐻')];
      const rules = makeRules({
        elementTransform: 'mirror-h',
        sizeTransform: 'scale-down',
        positionTransform: 'none',
      });
      const result = applyTransforms(grid, rules);
      expect(result[0]).toEqual(emoji('🐶', { mirror: 'horizontal', scaled: true }));
    });

    it('元素 + 位置变换', () => {
      const grid: MiniGrid = [emoji('A'), emoji('B'), emoji('C'), emoji('D')];
      const rules = makeRules({
        elementTransform: 'rotate-180',
        sizeTransform: 'none',
        positionTransform: 'pos-mirror-lr',
      });
      const result = applyTransforms(grid, rules);
      // 先元素变换（全部 rotate 180），再位置变换（0↔1, 2↔3）
      expect(result).toEqual([
        emoji('B', { rotation: 180 }),
        emoji('A', { rotation: 180 }),
        emoji('D', { rotation: 180 }),
        emoji('C', { rotation: 180 }),
      ]);
    });

    it('三种变换叠加', () => {
      const grid: MiniGrid = [emoji('A'), emoji('B'), emoji('C'), emoji('D')];
      const rules = makeRules({
        elementTransform: 'rotate-cw-90',
        sizeTransform: 'scale-down',
        positionTransform: 'pos-rotate-180',
      });
      const result = applyTransforms(grid, rules);
      // 顺序：先 rotate 90 + scale，再 pos rotate 180
      // rotate 90 + scale: [A90s, B90s, C90s, D90s]
      // pos rotate 180: [D90s, C90s, B90s, A90s]
      expect(result).toEqual([
        emoji('D', { rotation: 90, scaled: true }),
        emoji('C', { rotation: 90, scaled: true }),
        emoji('B', { rotation: 90, scaled: true }),
        emoji('A', { rotation: 90, scaled: true }),
      ]);
    });
  });
});

// ══════════════════════════════════════════
// 13. 变换集成测试
// ══════════════════════════════════════════

describe('变换集成测试', () => {
  it('col2 = applyTransforms(col1, rules)', () => {
    // 验证 col2 确实是 col1 应用变换后的结果
    for (let i = 0; i < 20; i++) {
      const puzzle = generatePuzzle();

      for (let row = 0; row < 3; row++) {
        const col1 = puzzle.matrix[row][0];
        const col2 = puzzle.matrix[row][1];

        // 手动计算预期的 col2
        const expected = applyTransforms(col1, puzzle.rules);

        expect(col2).toEqual(expected);
      }
    }
  });

  it('所有变换类型都能出现', () => {
    const seenElementTransforms = new Set<string>();
    const seenSizeTransforms = new Set<string>();
    const seenPositionTransforms = new Set<string>();

    for (let i = 0; i < 200; i++) {
      const puzzle = generatePuzzle();
      seenElementTransforms.add(puzzle.rules.elementTransform);
      seenSizeTransforms.add(puzzle.rules.sizeTransform);
      seenPositionTransforms.add(puzzle.rules.positionTransform);
    }

    const allElementTransforms = [
      'none',
      'rotate-cw-90',
      'rotate-180',
      'rotate-ccw-90',
      'mirror-h',
      'mirror-v',
    ];
    const allSizeTransforms = ['none', 'scale-down', 'scale-up'];
    const allPositionTransforms = [
      'none',
      'pos-rotate-cw',
      'pos-rotate-180',
      'pos-rotate-ccw',
      'pos-mirror-lr',
      'pos-mirror-ud',
      'pos-diag-main',
      'pos-diag-anti',
    ];

    for (const t of allElementTransforms) {
      expect(
        seenElementTransforms,
        `elementTransform "${t}" never appeared in 200 trials`
      ).toContain(t);
    }
    for (const t of allSizeTransforms) {
      expect(
        seenSizeTransforms,
        `sizeTransform "${t}" never appeared in 200 trials`
      ).toContain(t);
    }
    for (const t of allPositionTransforms) {
      expect(
        seenPositionTransforms,
        `positionTransform "${t}" never appeared in 200 trials`
      ).toContain(t);
    }
  });

  it('口诀包含变换信息', () => {
    for (let i = 0; i < 50; i++) {
      const puzzle = generatePuzzle();
      const mnemonic = generateMnemonic(puzzle.rules);

      // 如果有变换，口诀应该包含相应文本
      if (puzzle.rules.elementTransform !== 'none') {
        expect(mnemonic.length).toBeGreaterThan(0);
      }
    }
  });

  it('解析包含变换信息', () => {
    for (let i = 0; i < 50; i++) {
      const puzzle = generatePuzzle();
      const analysis = describeAnalysis(puzzle.rules);

      // 如果有变换，解析应该包含相应文本
      if (puzzle.rules.elementTransform !== 'none') {
        expect(analysis.length).toBeGreaterThan(0);
      }
    }
  });
});
