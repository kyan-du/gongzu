import type { GamePuzzle, CellContent, Matrix, PuzzleRules } from '../../../lib/grid-engine';

// ── Debug Fixture ──
// URL: ?debug=fixture&phase=result  → 跳过游戏直接看结果页
export function buildFixturePuzzle(): GamePuzzle {
  const e = (emoji: string, opts?: Partial<EmojiContent>): CellContent => ({
    type: 'emoji' as const,
    emoji,
    rotation: 0,
    mirror: 'none',
    scaled: false,
    ...opts,
  });
  const blank: CellContent = { type: 'blank' };
  const broken: CellContent = { type: 'broken' };

  // 3×3 矩阵，每格是 2×2 MiniGrid
  const matrix: Matrix = [
    // row 0 - 包含旋转和镜像变换
    [
      [e('🐶'), e('🐱'), e('🐰'), e('🐻')],
      [e('🐶', { rotation: 90 }), e('🐱', { mirror: 'horizontal' }), e('🐰', { rotation: 90 }), e('🐻', { mirror: 'vertical' })],
      [e('🐶', { rotation: 180 }), e('🐱', { rotation: 180 }), e('🐰', { rotation: 180 }), e('🐻', { rotation: 180 })],
    ],
    // row 1 - 包含旋转、镜像、放大
    [
      [e('🦊'), e('🐼'), e('🐸'), e('🐷')],
      [e('🦊', { rotation: 90 }), e('🐼', { grown: true }), e('🐸', { mirror: 'horizontal' }), e('🐷', { rotation: 90 })],
      [e('🦊', { rotation: 180 }), e('🐼', { rotation: 180 }), e('🐸', { rotation: 180 }), e('🐷', { rotation: 180 })],
    ],
    // row 2 - 包含缩小、旋转、blank、broken
    [
      [e('🐶', { scaled: true }), e('🐱', { scaled: true }), blank, e('🐻', { scaled: true })],
      [e('🐶', { rotation: 90, scaled: true }), e('🐱', { rotation: 90, scaled: true }), broken, e('🐻', { rotation: 90, scaled: true })],
      [e('🐶', { rotation: 180, scaled: true }), e('🐱', { rotation: 180, scaled: true }), e('🐰', { rotation: 180, scaled: true }), e('🐻', { rotation: 180, scaled: true })],
    ],
  ];

  // 隐藏格
  const phase1Hidden = { row: 2, col: 2 }; // row2 col2
  const phase2Hidden = [
    { row: 2, col: 2 }, // 同 phase1
    { row: 1, col: 2 }, // 额外隐藏 row1 col2
  ];

  // 备选池 — 正确 + 干扰
  const choices: CellContent[] = [
    // phase1 正确答案 (row2 col2 的 4 个 cell)
    e('🐶', { rotation: 180, scaled: true }),
    e('🐱', { rotation: 180, scaled: true }),
    e('🐰', { rotation: 180, scaled: true }),
    e('🐻', { rotation: 180, scaled: true }),
    // phase2 额外隐藏格正确答案 (row1 col2 的 4 个 cell)
    e('🦊', { rotation: 180 }),
    e('🐼', { rotation: 180 }),
    e('🐸', { rotation: 180 }),
    e('🐷', { rotation: 180 }),
    // 干扰项
    e('🐶', { rotation: 90 }),
    e('🐱', { mirror: 'horizontal' }),
    e('🦊', { scaled: true }),
    e('🐰'),
  ];

  return {
    matrix,
    phase1Hidden,
    phase2Hidden,
    choices,
    rules: {
      cellRules: [
        { same: 'keep', diff: 'broken' },
        { same: 'shrink', diff: 'first' },
        { same: 'blank', diff: 'second' },
        { same: 'keep', diff: 'blank' },
      ],
      cellTransforms: ['rotate-cw-90', 'none', 'mirror-h', 'none'],
      positionTransform: 'none',
      sizeTransform: 'none',
      elementTransform: 'none',
      mergeStrategy: {}
    } as PuzzleRules,
    phase1Rules: ['①左上：相同→保留，不同→变裂；②右上：相同→缩小，不同→留第一列；③左下：相同→变空，不同→留第二列；④右下：相同→保留，不同→变空'],
    phase2NewRules: ['继续观察相同规律'],
    phase2Matrix: matrix, // fixture 暂用同一个矩阵
    phase2Choices: choices,
  };
}

export function buildFixtureAnswers(puzzle: GamePuzzle) {
  const correct1 = puzzle.matrix[puzzle.phase1Hidden.row][puzzle.phase1Hidden.col];
  // phase1: 3 correct + 1 wrong
  const phase1Answers: CellContent[] = [
    correct1[0], // ✅
    correct1[1], // ✅
    { type: 'emoji', emoji: '🐰', rotation: 0, mirror: 'none', scaled: false }, // ❌ wrong
    correct1[3], // ✅
  ];

  // phase2: 8 cells（前4=phase2Hidden[0]，后4=phase2Hidden[1]）
  const correct2_0 = puzzle.matrix[puzzle.phase2Hidden[0].row][puzzle.phase2Hidden[0].col];
  const correct2_1 = puzzle.matrix[puzzle.phase2Hidden[1].row][puzzle.phase2Hidden[1].col];

  const phase2Answers: CellContent[] = [
    correct2_0[0], // ✅
    { type: 'emoji', emoji: '🐱', rotation: 90, mirror: 'none', scaled: true }, // ❌
    correct2_0[2], // ✅
    correct2_0[3], // ✅
    correct2_1[0], // ✅
    correct2_1[1], // ✅
    correct2_1[2], // ✅
    { type: 'emoji', emoji: '🐷', rotation: 90, mirror: 'none', scaled: false }, // ❌
  ];

  return { phase1Answers, phase2Answers };
}

type EmojiContent = Extract<CellContent, { type: 'emoji' }>;
