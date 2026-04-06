// ========================================
// 宫格记忆游戏 — 核心引擎（重写版）
// ========================================

// ── 数据模型（向后兼容） ──

type EmojiContent = {
  type: 'emoji';
  emoji: string;
  rotation?: 0 | 90 | 180 | 270;
  mirror?: 'none' | 'horizontal' | 'vertical';
  scaled?: boolean; // true = 变小
};

type BlankContent = { type: 'blank' };
type BrokenContent = { type: 'broken' };

export type CellContent = EmojiContent | BlankContent | BrokenContent;

export type MiniGrid = [CellContent, CellContent, CellContent, CellContent];

export type Matrix = MiniGrid[][]; // 3×3

// ── 素材系统 ──

const EMOJI_GROUPS = {
  animals: ['🐶', '🐱', '🐰', '🐻', '🦊', '🐼', '🐸', '🐷'],
  fruits: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓'],
  weather: ['☀️', '🌙', '⭐', '☁️', '❄️', '⚡', '🌈', '☄️'],
  vehicles: ['🚗', '🚕', '🚌', '✈️', '🚀', '🛵', '🚲', '⛵'],
  food: ['🍕', '🍔', '🍩', '🎂', '🍦', '🧁', '🍪', '🍫'],
  sports: ['⚽', '🏀', '🎾', '🏐', '🎱', '🏓', '🏸', '⛳'],
  insects: ['🪰', '🐛', '🦗', '🐞', '🐝', '🦋', '🐌', '🦟'],
  shapes: ['▲', '◆', '►', '◄', '▼', '●', '■', '★'],
};

const DIRECTIONAL_GROUPS = ['animals', 'vehicles', 'insects', 'shapes'];

// ── 工具函数 ──

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 规律维度定义 ──

// 元素变换（旋转/镜像）
export type ElementTransform = 'rotate-90' | 'rotate-180' | 'rotate-270' | 'mirror-h' | 'mirror-v' | 'none';

// 大小变换（缩放）
export type SizeTransform = 'scale-down' | 'scale-up' | 'none';

// 位置变换（2×2 内部排列变化）
export type PositionTransform =
  | 'rotate-cw'    // 顺时针轮转 [0,1,2,3] → [2,0,3,1]
  | 'rotate-ccw'   // 逆时针轮转 [0,1,2,3] → [1,3,0,2]
  | 'mirror-lr'    // 左右翻 [0,1,2,3] → [1,0,3,2]
  | 'mirror-tb'    // 上下翻 [0,1,2,3] → [2,3,0,1]
  | 'diag-swap'    // 对角交换 [0,1,2,3] → [3,1,2,0]
  | 'none';

// 合并策略
export type MergeStrategy = {
  sameBoth: 'keep' | 'blank' | 'broken';
  diffBoth: 'first' | 'second' | 'blank' | 'broken';
  blankAndNormal: 'normal' | 'blank';
  brokenAndNormal: 'normal' | 'broken';
  bothBlank: 'blank' | 'broken';
  bothBroken: 'broken' | 'blank';
  blankAndBroken: 'blank' | 'broken';
};

// 规律维度封装
export type RuleDimension = {
  category: 'element' | 'size' | 'position' | 'merge';
  transform?: ElementTransform | SizeTransform | PositionTransform;
  mergeStrategy?: MergeStrategy;
  description: string; // UI 用的文字描述
  mnemonic: string;    // 口诀
};

// ── 游戏谜题接口（新设计） ──

export interface GamePuzzle {
  matrix: Matrix;              // 阶段一矩阵
  phase1Hidden: { row: number; col: number };
  phase2Hidden: { row: number; col: number }[];
  choices: CellContent[];      // 阶段一备选池
  rules: {                     // 兼容旧格式 + 新格式
    // 新格式（可选，新代码使用）
    type?: 'transform' | 'merge' | 'mixed';
    phase1?: RuleDimension;
    phase2?: RuleDimension;
    // 旧格式（必需，向后兼容）
    elementTransform: ElementTransform;
    sizeTransform: SizeTransform;
    positionTransform: PositionTransform;
    mergeStrategy: MergeStrategy;
  };
  phase1Rules: string[];       // 阶段一规律文字
  phase2NewRules: string[];    // 阶段二新规律文字
  phase2Matrix: Matrix;        // 阶段二矩阵
  phase2Choices: CellContent[];
}

// 保留旧接口向后兼容（deprecated）
export type GamePhase = 'watch1' | 'answer1' | 'watch2' | 'answer2' | 'result';

// ── 元素变换实现 ──

function applyElementTransform(content: CellContent, transform: ElementTransform): CellContent {
  if (content.type !== 'emoji') return content;

  let rotation: 0 | 90 | 180 | 270 = content.rotation || 0;
  let mirror: 'none' | 'horizontal' | 'vertical' = content.mirror || 'none';

  switch (transform) {
    case 'rotate-90':
      rotation = ((rotation + 90) % 360) as 0 | 90 | 180 | 270;
      break;
    case 'rotate-180':
      rotation = ((rotation + 180) % 360) as 0 | 90 | 180 | 270;
      break;
    case 'rotate-270':
      rotation = ((rotation + 270) % 360) as 0 | 90 | 180 | 270;
      break;
    case 'mirror-h':
      mirror = 'horizontal';
      break;
    case 'mirror-v':
      mirror = 'vertical';
      break;
  }

  return {
    type: 'emoji',
    emoji: content.emoji,
    rotation,
    mirror,
    scaled: content.scaled,
  };
}

// ── 大小变换实现 ──

function applySizeTransform(content: CellContent, transform: SizeTransform): CellContent {
  if (content.type !== 'emoji') return content;

  let scaled = content.scaled || false;

  if (transform === 'scale-down') {
    scaled = true; // 正常 → 小
  } else if (transform === 'scale-up') {
    scaled = false; // 小 → 正常（假设初始可能是小的）
  }

  return {
    ...content,
    scaled,
  };
}

// ── 位置变换实现 ──

function applyPositionTransform(grid: MiniGrid, transform: PositionTransform): MiniGrid {
  const [c0, c1, c2, c3] = grid;

  switch (transform) {
    case 'rotate-cw':   // 顺时针：左上→右上→右下→左下→左上
      return [c2, c0, c3, c1];
    case 'rotate-ccw':  // 逆时针：左上→左下→右下→右上→左上
      return [c1, c3, c0, c2];
    case 'mirror-lr':   // 左右翻：0↔1, 2↔3
      return [c1, c0, c3, c2];
    case 'mirror-tb':   // 上下翻：0↔2, 1↔3
      return [c2, c3, c0, c1];
    case 'diag-swap':   // 对角交换：0↔3
      return [c3, c1, c2, c0];
    default:
      return grid;
  }
}

// ── 合并实现 ──

function mergeCell(a: CellContent, b: CellContent, strategy: MergeStrategy): CellContent {
  // 两个都是正常图案
  if (a.type === 'emoji' && b.type === 'emoji') {
    const same =
      a.emoji === b.emoji &&
      (a.rotation || 0) === (b.rotation || 0) &&
      (a.mirror || 'none') === (b.mirror || 'none') &&
      (a.scaled || false) === (b.scaled || false);

    if (same) {
      if (strategy.sameBoth === 'keep') return a;
      if (strategy.sameBoth === 'blank') return { type: 'blank' };
      return { type: 'broken' };
    } else {
      if (strategy.diffBoth === 'first') return a;
      if (strategy.diffBoth === 'second') return b;
      if (strategy.diffBoth === 'blank') return { type: 'blank' };
      return { type: 'broken' };
    }
  }

  // 一个特殊 + 一个正常
  if (a.type === 'blank' && b.type === 'emoji') {
    return strategy.blankAndNormal === 'normal' ? b : { type: 'blank' };
  }
  if (a.type === 'emoji' && b.type === 'blank') {
    return strategy.blankAndNormal === 'normal' ? a : { type: 'blank' };
  }
  if (a.type === 'broken' && b.type === 'emoji') {
    return strategy.brokenAndNormal === 'normal' ? b : { type: 'broken' };
  }
  if (a.type === 'emoji' && b.type === 'broken') {
    return strategy.brokenAndNormal === 'normal' ? a : { type: 'broken' };
  }

  // 两个都是特殊
  if (a.type === 'blank' && b.type === 'blank') {
    return strategy.bothBlank === 'blank' ? { type: 'blank' } : { type: 'broken' };
  }
  if (a.type === 'broken' && b.type === 'broken') {
    return strategy.bothBroken === 'broken' ? { type: 'broken' } : { type: 'blank' };
  }
  if ((a.type === 'blank' && b.type === 'broken') || (a.type === 'broken' && b.type === 'blank')) {
    return strategy.blankAndBroken === 'blank' ? { type: 'blank' } : { type: 'broken' };
  }

  return { type: 'blank' };
}

// ── 生成随机 MiniGrid ──

function generateRandomMiniGrid(emojiPool: string[]): MiniGrid {
  const shuffled = shuffle([...emojiPool]);
  const cells: CellContent[] = [];

  for (let i = 0; i < 4; i++) {
    cells.push({
      type: 'emoji',
      emoji: shuffled[i % shuffled.length],
      rotation: 0,
      mirror: 'none',
      scaled: false,
    });
  }

  return cells as MiniGrid;
}

// ── 规律维度生成器 ──

function generateRuleDimension(category: 'element' | 'size' | 'position' | 'merge'): RuleDimension {
  switch (category) {
    case 'element': {
      const transforms: ElementTransform[] = ['rotate-90', 'rotate-180', 'rotate-270', 'mirror-h', 'mirror-v'];
      const transform = randomChoice(transforms);
      const descriptions: Record<ElementTransform, string> = {
        'rotate-90': '元素顺时针旋转 90°',
        'rotate-180': '元素旋转 180°',
        'rotate-270': '元素逆时针旋转 90°',
        'mirror-h': '元素水平镜像',
        'mirror-v': '元素垂直镜像',
        'none': '无变换',
      };
      const mnemonics: Record<ElementTransform, string> = {
        'rotate-90': '右转九十度',
        'rotate-180': '一百八十转',
        'rotate-270': '左转九十度',
        'mirror-h': '水平翻一翻',
        'mirror-v': '上下来倒置',
        'none': '保持不变',
      };
      return {
        category: 'element',
        transform,
        description: descriptions[transform],
        mnemonic: mnemonics[transform],
      };
    }

    case 'size': {
      const transform: SizeTransform = 'scale-down'; // 简化：只支持缩小
      return {
        category: 'size',
        transform,
        description: '元素逐步缩小',
        mnemonic: '越来越小巧',
      };
    }

    case 'position': {
      const transforms: PositionTransform[] = ['rotate-cw', 'rotate-ccw', 'mirror-lr', 'mirror-tb', 'diag-swap'];
      const transform = randomChoice(transforms);
      const descriptions: Record<PositionTransform, string> = {
        'rotate-cw': '位置顺时针轮转',
        'rotate-ccw': '位置逆时针轮转',
        'mirror-lr': '位置左右对换',
        'mirror-tb': '位置上下对换',
        'diag-swap': '对角位置互换',
        'none': '无变换',
      };
      const mnemonics: Record<PositionTransform, string> = {
        'rotate-cw': '顺时针转圈',
        'rotate-ccw': '逆时针旋转',
        'mirror-lr': '左右来对调',
        'mirror-tb': '上下换位置',
        'diag-swap': '对角互相换',
        'none': '保持不变',
      };
      return {
        category: 'position',
        transform,
        description: descriptions[transform],
        mnemonic: mnemonics[transform],
      };
    }

    case 'merge': {
      // 简化合并策略：只生成几种常见模式
      const patterns = [
        {
          strategy: {
            sameBoth: 'keep' as const,
            diffBoth: 'first' as const,
            blankAndNormal: 'normal' as const,
            brokenAndNormal: 'normal' as const,
            bothBlank: 'blank' as const,
            bothBroken: 'broken' as const,
            blankAndBroken: 'blank' as const,
          },
          description: '相同保留，不同留第一列',
          mnemonic: '同则留，异取左',
        },
        {
          strategy: {
            sameBoth: 'keep' as const,
            diffBoth: 'second' as const,
            blankAndNormal: 'normal' as const,
            brokenAndNormal: 'normal' as const,
            bothBlank: 'blank' as const,
            bothBroken: 'broken' as const,
            blankAndBroken: 'blank' as const,
          },
          description: '相同保留，不同留第二列',
          mnemonic: '同则留，异取右',
        },
        {
          strategy: {
            sameBoth: 'keep' as const,
            diffBoth: 'blank' as const,
            blankAndNormal: 'blank' as const,
            brokenAndNormal: 'broken' as const,
            bothBlank: 'blank' as const,
            bothBroken: 'broken' as const,
            blankAndBroken: 'blank' as const,
          },
          description: '相同保留，不同变空',
          mnemonic: '同则留，异为空',
        },
        {
          strategy: {
            sameBoth: 'keep' as const,
            diffBoth: 'broken' as const,
            blankAndNormal: 'blank' as const,
            brokenAndNormal: 'broken' as const,
            bothBlank: 'blank' as const,
            bothBroken: 'broken' as const,
            blankAndBroken: 'broken' as const,
          },
          description: '相同保留，不同变碎',
          mnemonic: '同则留，异破碎',
        },
      ];
      const pattern = randomChoice(patterns);
      return {
        category: 'merge',
        mergeStrategy: pattern.strategy,
        description: pattern.description,
        mnemonic: pattern.mnemonic,
      };
    }
  }
}

// ── 应用规律维度到 MiniGrid ──

function applyRule(grid: MiniGrid, rule: RuleDimension): MiniGrid {
  switch (rule.category) {
    case 'element':
      if (rule.transform) {
        return grid.map(cell => applyElementTransform(cell, rule.transform as ElementTransform)) as MiniGrid;
      }
      break;

    case 'size':
      if (rule.transform) {
        return grid.map(cell => applySizeTransform(cell, rule.transform as SizeTransform)) as MiniGrid;
      }
      break;

    case 'position':
      if (rule.transform) {
        return applyPositionTransform(grid, rule.transform as PositionTransform);
      }
      break;

    case 'merge':
      // merge 需要两个输入，这里不适用（在矩阵构建时处理）
      break;
  }

  return grid;
}

// ── 构建递推类矩阵 ──

function buildTransformMatrix(rule1: RuleDimension, rule2?: RuleDimension): Matrix {
  // 选择合适的 emoji 组
  const needDirectional = 
    (rule1.category === 'element' && rule1.transform !== 'none') ||
    (rule1.category === 'position' && rule1.transform !== 'none') ||
    (rule2?.category === 'element' && rule2.transform !== 'none') ||
    (rule2?.category === 'position' && rule2.transform !== 'none');

  const availableGroups = needDirectional ? DIRECTIONAL_GROUPS : Object.keys(EMOJI_GROUPS);
  const groupKey = randomChoice(availableGroups) as keyof typeof EMOJI_GROUPS;
  const emojiPool = shuffle([...EMOJI_GROUPS[groupKey]]);

  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    const col1 = generateRandomMiniGrid(emojiPool);
    let col2 = applyRule(col1, rule1);
    if (rule2) col2 = applyRule(col2, rule2);
    
    let col3 = applyRule(col2, rule1);
    if (rule2) col3 = applyRule(col3, rule2);

    matrix.push([col1, col2, col3]);
  }

  return matrix;
}

// ── 构建合并类矩阵 ──

function buildMergeMatrix(rule: RuleDimension): Matrix {
  if (rule.category !== 'merge' || !rule.mergeStrategy) {
    throw new Error('buildMergeMatrix requires a merge rule');
  }

  const groupKey = randomChoice(Object.keys(EMOJI_GROUPS)) as keyof typeof EMOJI_GROUPS;
  const emojiPool = shuffle([...EMOJI_GROUPS[groupKey]]);

  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    const col1 = generateRandomMiniGrid(emojiPool);
    const col2 = generateRandomMiniGrid(emojiPool); // 独立随机

    const col3: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      col3.push(mergeCell(col1[i], col2[i], rule.mergeStrategy));
    }

    matrix.push([col1, col2, col3 as MiniGrid]);
  }

  return matrix;
}

// ── 构建混合矩阵（递推 + 合并） ──

function buildMixedMatrix(transformRule: RuleDimension, mergeRule: RuleDimension): Matrix {
  if (mergeRule.category !== 'merge' || !mergeRule.mergeStrategy) {
    throw new Error('buildMixedMatrix requires a merge rule');
  }

  const needDirectional = 
    (transformRule.category === 'element' && transformRule.transform !== 'none') ||
    (transformRule.category === 'position' && transformRule.transform !== 'none');

  const availableGroups = needDirectional ? DIRECTIONAL_GROUPS : Object.keys(EMOJI_GROUPS);
  const groupKey = randomChoice(availableGroups) as keyof typeof EMOJI_GROUPS;
  const emojiPool = shuffle([...EMOJI_GROUPS[groupKey]]);

  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    // col1 随机生成
    const col1 = generateRandomMiniGrid(emojiPool);
    
    // col2 = transform(col1)
    const col2 = applyRule(col1, transformRule);
    
    // col3 = merge(col2, transform(col2))
    const col2Transformed = applyRule(col2, transformRule);
    const col3: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      col3.push(mergeCell(col2[i], col2Transformed[i], mergeRule.mergeStrategy));
    }

    matrix.push([col1, col2, col3 as MiniGrid]);
  }

  return matrix;
}

// ── 生成备选项（改进版） ──

function generateChoices(
  matrix: Matrix,
  hiddenCells: { row: number; col: number }[]
): CellContent[] {
  // 标准化用于去重
  const normalizeCell = (c: CellContent): string => {
    if (c.type === 'emoji') {
      return JSON.stringify({
        type: 'emoji',
        emoji: c.emoji,
        rotation: c.rotation || 0,
        mirror: c.mirror || 'none',
        scaled: c.scaled || false,
      });
    }
    return JSON.stringify({ type: c.type });
  };

  // 收集正确答案
  const correctAnswers: CellContent[] = [];
  for (const { row, col } of hiddenCells) {
    correctAnswers.push(...matrix[row][col]);
  }

  // 收集矩阵中所有 emoji
  const allEmojis = new Set<string>();
  for (const row of matrix) {
    for (const miniGrid of row) {
      for (const cell of miniGrid) {
        if (cell.type === 'emoji') allEmojis.add(cell.emoji);
      }
    }
  }
  const emojiList = [...allEmojis];

  // 生成精准迷惑项
  const candidateMap = new Map<string, CellContent>();

  // 1. 加入所有正确答案
  for (const correct of correctAnswers) {
    const key = normalizeCell(correct);
    candidateMap.set(key, correct);
  }

  // 2. 为每个正确答案生成迷惑项
  for (const correct of correctAnswers) {
    if (correct.type !== 'emoji') continue;

    const rot = correct.rotation || 0;
    const mir = correct.mirror || 'none';
    const sc = correct.scaled || false;

    const allRots: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
    const rotIdx = allRots.indexOf(rot as 0 | 90 | 180 | 270);

    const distractors: CellContent[] = [
      // 旋转干扰（其他角度）
      { ...correct, rotation: allRots[(rotIdx + 1) % 4] },
      { ...correct, rotation: allRots[(rotIdx + 2) % 4] },
      { ...correct, rotation: allRots[(rotIdx + 3) % 4] },
      
      // 大小干扰
      { ...correct, scaled: !sc },
      
      // 镜像干扰
      { ...correct, mirror: mir === 'none' ? 'horizontal' : mir === 'horizontal' ? 'vertical' : 'none' },
      
      // 组合干扰
      { ...correct, rotation: allRots[(rotIdx + 1) % 4], scaled: !sc },
      { ...correct, mirror: mir === 'none' ? 'horizontal' : 'none', scaled: !sc },
      
      // 换 emoji
      ...emojiList.filter(e => e !== correct.emoji).slice(0, 2).map(e => ({
        type: 'emoji' as const,
        emoji: e,
        rotation: correct.rotation,
        mirror: correct.mirror,
        scaled: correct.scaled,
      })),
    ];

    for (const d of distractors) {
      const key = normalizeCell(d);
      if (!candidateMap.has(key)) {
        candidateMap.set(key, d);
      }
    }
  }

  // 3. 不够 12 个，从可见格子补充
  if (candidateMap.size < 12) {
    const visible: CellContent[] = [];
    for (const row of matrix) {
      for (const miniGrid of row) {
        for (const cell of miniGrid) {
          visible.push(cell);
        }
      }
    }
    for (const cell of shuffle(visible)) {
      const key = normalizeCell(cell);
      if (!candidateMap.has(key)) {
        candidateMap.set(key, cell);
        if (candidateMap.size >= 12) break;
      }
    }
  }

  // 4. 截断到 18 个
  let result = shuffle([...candidateMap.values()]);
  if (result.length > 18) {
    result = result.slice(0, 18);
  }

  return result;
}

// ── 主生成函数 ──

export function generatePuzzle(): GamePuzzle {
  // 随机选择规律类型
  const puzzleType = randomChoice(['transform', 'merge', 'mixed'] as const);

  let phase1Rule: RuleDimension;
  let phase2Rule: RuleDimension;
  let phase1Matrix: Matrix;
  let phase2Matrix: Matrix;

  if (puzzleType === 'transform') {
    // 递推类：两个变换维度
    const categories = shuffle(['element', 'size', 'position'] as const);
    phase1Rule = generateRuleDimension(categories[0]);
    phase2Rule = generateRuleDimension(categories[1]);

    // 阶段一：只用 phase1Rule
    phase1Matrix = buildTransformMatrix(phase1Rule);

    // 阶段二：phase1Rule + phase2Rule
    phase2Matrix = buildTransformMatrix(phase1Rule, phase2Rule);

  } else if (puzzleType === 'merge') {
    // 合并类：单一合并规则
    phase1Rule = generateRuleDimension('merge');
    phase2Rule = generateRuleDimension('merge'); // 阶段二用不同的合并策略

    phase1Matrix = buildMergeMatrix(phase1Rule);
    phase2Matrix = buildMergeMatrix(phase2Rule);

  } else {
    // 混合类：递推 + 合并
    const transformCategory = randomChoice(['element', 'size', 'position'] as const);
    phase1Rule = generateRuleDimension(transformCategory);
    phase2Rule = generateRuleDimension('merge');

    // 阶段一：只用递推
    phase1Matrix = buildTransformMatrix(phase1Rule);

    // 阶段二：递推 + 合并
    phase2Matrix = buildMixedMatrix(phase1Rule, phase2Rule);
  }

  // 隐藏格子
  const phase1Hidden = { row: 2, col: 2 };
  const phase2Hidden = [{ row: 2, col: 2 }, { row: 1, col: 2 }];

  // 生成备选项
  const choices = generateChoices(phase1Matrix, [phase1Hidden]);
  const phase2Choices = generateChoices(phase2Matrix, phase2Hidden);

  // 构造向后兼容的 rules 对象
  const compatElementTransform: ElementTransform = 
    phase1Rule.category === 'element' ? (phase1Rule.transform as ElementTransform) :
    phase2Rule.category === 'element' ? (phase2Rule.transform as ElementTransform) : 'none';

  const compatSizeTransform: SizeTransform =
    phase1Rule.category === 'size' ? (phase1Rule.transform as SizeTransform) :
    phase2Rule.category === 'size' ? (phase2Rule.transform as SizeTransform) : 'none';

  const compatPositionTransform: PositionTransform =
    phase1Rule.category === 'position' ? (phase1Rule.transform as PositionTransform) :
    phase2Rule.category === 'position' ? (phase2Rule.transform as PositionTransform) : 'none';

  const compatMergeStrategy: MergeStrategy =
    phase1Rule.category === 'merge' && phase1Rule.mergeStrategy ? phase1Rule.mergeStrategy :
    phase2Rule.category === 'merge' && phase2Rule.mergeStrategy ? phase2Rule.mergeStrategy :
    {
      sameBoth: 'keep',
      diffBoth: 'first',
      blankAndNormal: 'normal',
      brokenAndNormal: 'normal',
      bothBlank: 'blank',
      bothBroken: 'broken',
      blankAndBroken: 'blank',
    };

  return {
    matrix: phase1Matrix,
    phase1Hidden,
    phase2Hidden,
    choices,
    rules: {
      type: puzzleType,
      phase1: phase1Rule,
      phase2: phase2Rule,
      // 向后兼容字段
      elementTransform: compatElementTransform,
      sizeTransform: compatSizeTransform,
      positionTransform: compatPositionTransform,
      mergeStrategy: compatMergeStrategy,
    },
    phase1Rules: [phase1Rule.description],
    phase2NewRules: [phase2Rule.description],
    phase2Matrix,
    phase2Choices,
  };
}

// ── 检查答案（保持向后兼容） ──

export function checkAnswer(
  matrix: Matrix,
  hiddenCell: { row: number; col: number },
  userAnswer: MiniGrid
): { correct: number; total: number } {
  const correctGrid = matrix[hiddenCell.row][hiddenCell.col];
  let correct = 0;

  for (let i = 0; i < 4; i++) {
    if (JSON.stringify(correctGrid[i]) === JSON.stringify(userAnswer[i])) {
      correct++;
    }
  }

  return { correct, total: 4 };
}
