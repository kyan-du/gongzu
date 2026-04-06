// ========================================
// 宫格记忆游戏 — 核心引擎（完全重写版 v5）
// ========================================

// ── 数据模型 ──

type EmojiContent = {
  type: 'emoji';
  emoji: string;
  rotation?: 0 | 90 | 180 | 270;
  mirror?: 'none' | 'horizontal' | 'vertical';
  scaled?: boolean;
  grown?: boolean;
};

type BlankContent = { type: 'blank' };
type BrokenContent = { type: 'broken' };
type PassContent = {
  type: 'pass';
  // 兼容字段，让旧的 CellRenderer 可以处理
  emoji?: string;
  rotation?: 0 | 90 | 180 | 270;
  mirror?: 'none' | 'horizontal' | 'vertical';
  scaled?: boolean;
  grown?: boolean;
};

export type CellContent = EmojiContent | BlankContent | BrokenContent | PassContent;

export type MiniGrid = [CellContent, CellContent, CellContent, CellContent];

export type Matrix = MiniGrid[][];

export type GamePhase = 'watch1' | 'answer1' | 'watch2' | 'answer2' | 'result';

// ── 规则定义 ──

export type SameAction = 'keep' | 'swap-lr' | 'shrink' | 'blank' | 'broken';
export type DiffAction = 'first' | 'second' | 'blank' | 'broken';

export type RowMergeRule = {
  same: SameAction;
  diff: DiffAction;
};

export type PuzzleRules = {
  topRow: RowMergeRule;
  bottomRow: RowMergeRule;
  // 兼容旧版前端（必须是 string，不能是 undefined）
  elementTransform: string;
  sizeTransform: string;
  positionTransform: string;
  mergeStrategy: any;
};

export interface GamePuzzle {
  matrix: Matrix;
  phase1Hidden: { row: number; col: number };
  phase2Hidden: { row: number; col: number }[];
  choices: CellContent[];
  rules: PuzzleRules;
  phase1Rules: string[];
  phase2NewRules: string[];
  phase2Matrix: Matrix;
  phase2Choices: CellContent[];
}

// ── Emoji 素材 ──

// 主题分类：用于变换约束
const DIRECTIONAL_THEMES = ['animals', 'birds', 'ocean', 'transport', 'insects', 'letters', 'hanzi', 'shapes', 'space', 'tools', 'electronics', 'bodyparts', 'dinosaurs', 'vehicles2', 'flags', 'arrows'];
const SYMMETRIC_THEMES = ['fruits', 'vegetables', 'food', 'sports', 'flowers', 'hearts', 'sweets', 'christmas', 'gems', 'balls'];
const MIXED_THEMES = ['weather', 'faces', 'hands', 'music', 'objects', 'numbers', 'buildings', 'clothing', 'furniture', 'drinks', 'clocks', 'zodiac'];

const EMOJI_GROUPS = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🐸', '🐵', '🐷', '🐻', '🐼', '🦊', '🐨', '🦁', '🐯', '🐮'],
  birds: ['🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦜', '🦚', '🦩', '🕊️', '🦢', '🦤', '🐓', '🦃'],
  ocean: ['🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🦭', '🐚', '🪸', '🦞'],
  fruits: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍌', '🥝', '🍒', '🫐', '🍈', '🥭', '🍍', '🥥', '🍐'],
  vegetables: ['🥕', '🌽', '🌶️', '🥒', '🥬', '🧅', '🧄', '🥦', '🍆', '🥔', '🍠', '🫚', '🍄', '🫛', '🥜'],
  food: ['🍕', '🍔', '🌭', '🌮', '🍣', '🍜', '🍩', '🎂', '🍪', '🍫', '🧁', '🥐', '🍝', '🥗', '🍟'],
  transport: ['🚗', '🚕', '🚙', '🚌', '🚓', '🚑', '🚒', '🛵', '🚲', '🏍️', '🚂', '🚀', '🛸', '🚁', '✈️'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🎯', '🏹', '⛳', '🥋'],
  music: ['🎸', '🎹', '🎺', '🎷', '🥁', '🎻', '🪕', '🎤', '🪗', '🪘', '📯', '🎵', '🎶', '🔔', '🎼'],
  flowers: ['🌸', '🌻', '🌹', '🌺', '🌷', '🍀', '🌿', '🌵', '🌲', '🍁', '🌾', '🌴', '💐', '🪻', '🪷'],
  weather: ['☀️', '🌙', '⭐', '🌈', '❄️', '🔥', '💧', '🌊', '💨', '🌪️', '⚡', '🌤️', '⛅', '🌦️', '☁️'],
  objects: ['📚', '✏️', '🎒', '📱', '💡', '🔑', '📷', '🧩', '🎁', '🏆', '🔔', '📐', '📏', '🖊️', '📌'],
  faces: ['😀', '😎', '🥳', '🤩', '😱', '🥶', '😴', '🤖', '👻', '💀', '👽', '🎃', '🤡', '😈', '🥸'],
  hands: ['👍', '👎', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '✋', '🖖', '👌', '🤌', '🤏', '🫰', '🫵'],
  insects: ['🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦂', '🪲', '🪳', '🦗', '🪰', '🦟', '🕷️', '🦠', '🪱'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '①', '②', '③', '④', '⑤'],
  letters: ['b', 'd', 'p', 'q', 'A', 'B', 'R', 'P', 'M', 'W', 'N', 'Z', 'S', 'E', 'C'],
  hanzi: ['大', '小', '上', '下', '左', '右', '东', '西', '南', '北', '中', '人', '入', '天', '夫'],
  shapes: ['▲', '◆', '►', '◄', '▼', '★', '●', '■', '▶', '◀', '⬆', '⬇', '⬅', '➡', '◉'],
  // 新增主题
  space: ['🚀', '🛸', '🌍', '🪐', '☄️', '🌙', '🛰️', '🌑', '🔭', '👨‍🚀', '🌠', '🌌', '🌕', '🌗', '💫'],
  tools: ['🔨', '🪛', '🔧', '⚙️', '🪚', '🔩', '🪝', '🧲', '🪜', '🧰', '🪤', '🔗', '⛏️', '🗜️', '🪓'],
  electronics: ['💻', '🖥️', '⌨️', '🖨️', '📺', '🎮', '🕹️', '📡', '📻', '🔋', '💾', '📀', '🖱️', '📟', '📠'],
  bodyparts: ['👀', '👃', '👄', '👂', '🦷', '💀', '🧠', '👁️', '🫀', '🫁', '🦴', '💪', '🦶', '🦵', '👅'],
  dinosaurs: ['🦕', '🦖', '🐉', '🐲', '🦎', '🐍', '🦏', '🦛', '🐊', '🦣', '🐢', '🦙', '🦘', '🦔', '🐫'],
  vehicles2: ['🚢', '⛵', '🚤', '🛥️', '🛶', '🚠', '🚡', '🚟', '🚃', '🚋', '🚞', '🚈', '🚂', '🚊', '🛩️'],
  flags: ['🇨🇳', '🇺🇸', '🇯🇵', '🇬🇧', '🇫🇷', '🇩🇪', '🇰🇷', '🇧🇷', '🇮🇹', '🇪🇸', '🇷🇺', '🇨🇦', '🇦🇺', '🇮🇳', '🇲🇽'],
  arrows: ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '🔄', '🔃', '🔂'],
  hearts: ['❤️', '💜', '💙', '💚', '💛', '🧡', '🤍', '🖤', '🤎', '💗', '💝', '💘', '💖', '❤️‍🔥', '💕'],
  sweets: ['🍦', '🧁', '🍰', '🍫', '🍬', '🍭', '🍪', '🧇', '🥞', '🍡', '🍮', '🧃', '🍧', '🍨', '🥮'],
  christmas: ['🎄', '🎅', '🤶', '🎁', '⛄', '❄️', '🦌', '🔔', '🕯️', '🧦', '🪅', '🎊', '🎉', '✨', '🌟'],
  gems: ['💎', '🔮', '💍', '👑', '🏅', '🎖️', '🥇', '🥈', '🥉', '🏆', '🪩', '🔶', '🔷', '🔸', '🔹'],
  balls: ['⚽', '🏀', '🏐', '🎱', '🎳', '🏈', '⚾', '🥎', '🎾', '🏓', '🪀', '🥏', '🏒', '🥌', '🏸'],
  buildings: ['🏠', '🏢', '🏥', '🏫', '🏰', '🗼', '⛪', '🏛️', '🏟️', '🕌', '🕍', '⛩️', '🏗️', '🏭', '🏬'],
  clothing: ['👕', '👖', '👗', '🧥', '👠', '🎩', '🧢', '👟', '👔', '👘', '🥿', '👢', '🧤', '🧣', '👒'],
  furniture: ['🛋️', '🪑', '🛏️', '🚿', '🧹', '🪣', '🧺', '💡', '🪟', '🚪', '🪞', '🧸', '🖼️', '🛁', '🪴'],
  drinks: ['☕', '🍵', '🥤', '🧋', '🍺', '🍷', '🥂', '🍾', '🧃', '🥛', '🍹', '🍸', '🫖', '🍶', '🥃'],
  clocks: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '⏰', '⏳', '⌛'],
  zodiac: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔯', '☯️'],
};

// ── 工具函数 ──

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function normalizeCell(c: CellContent): string {
  if (c.type === 'emoji') {
    return c.emoji;
  }
  return c.type;
}

function cellEqual(a: CellContent, b: CellContent): boolean {
  return normalizeCell(a) === normalizeCell(b);
}

// ── 变换逻辑 ──

/**
 * @internal
 * 应用元素变换（旋转/镜像）到单个 cell
 */
export function applyElementTransform(cell: CellContent, transform: string): CellContent {
  if (cell.type !== 'emoji') {
    return cell;
  }

  const result = { ...cell };

  switch (transform) {
    case 'none':
      break;
    case 'rotate-cw-90':
      result.rotation = 90;
      break;
    case 'rotate-180':
      result.rotation = 180;
      break;
    case 'rotate-ccw-90':
      result.rotation = 270;
      break;
    case 'mirror-h':
      result.mirror = 'horizontal';
      break;
    case 'mirror-v':
      result.mirror = 'vertical';
      break;
  }

  return result;
}

/**
 * @internal
 * 应用尺寸变换到单个 cell
 */
export function applySizeTransform(cell: CellContent, transform: string): CellContent {
  if (cell.type !== 'emoji') {
    return cell;
  }

  const result = { ...cell };

  switch (transform) {
    case 'none':
      break;
    case 'scale-down':
      result.scaled = true;
      break;
    case 'scale-up':
      result.grown = true;
      break;
  }

  return result;
}

/**
 * @internal
 * 应用位置变换到 2×2 宫格
 */
export function applyPositionTransform(grid: MiniGrid, transform: string): MiniGrid {
  const [c0, c1, c2, c3] = grid;

  switch (transform) {
    case 'none':
      return grid;
    case 'pos-rotate-cw':
      return [c2, c0, c3, c1]; // 0→1→3→2→0
    case 'pos-rotate-180':
      return [c3, c2, c1, c0]; // 0↔3, 1↔2
    case 'pos-rotate-ccw':
      return [c1, c3, c0, c2]; // 0→2→3→1→0
    case 'pos-mirror-lr':
      return [c1, c0, c3, c2]; // 0↔1, 2↔3
    case 'pos-mirror-ud':
      return [c2, c3, c0, c1]; // 0↔2, 1↔3
    case 'pos-diag-main':
      return [c3, c1, c2, c0]; // 0↔3
    case 'pos-diag-anti':
      return [c0, c2, c1, c3]; // 1↔2
    default:
      return grid;
  }
}

/**
 * @internal
 * 组合应用三层变换：先元素 → 再尺寸 → 再位置
 */
export function applyTransforms(grid: MiniGrid, rules: PuzzleRules): MiniGrid {
  // 1. 元素变换
  let transformed: CellContent[] = grid.map(cell =>
    applyElementTransform(cell, rules.elementTransform)
  );

  // 2. 尺寸变换
  transformed = transformed.map(cell =>
    applySizeTransform(cell, rules.sizeTransform)
  );

  // 3. 位置变换
  return applyPositionTransform(transformed as MiniGrid, rules.positionTransform);
}

// ── 合并逻辑 ──

function applyMergeRule(col1Cell: CellContent, col2Cell: CellContent, rule: SameAction | DiffAction): CellContent {
  const same = cellEqual(col1Cell, col2Cell);

  if (same) {
    const sameRule = rule as SameAction;
    switch (sameRule) {
      case 'keep':
        return col1Cell;
      case 'swap-lr':
        return col1Cell;
      case 'shrink':
        if (col1Cell.type === 'emoji') {
          return { ...col1Cell, scaled: true };
        }
        return col1Cell;
      case 'blank':
        return { type: 'blank' };
      case 'broken':
        return { type: 'broken' };
    }
  } else {
    const diffRule = rule as DiffAction;
    switch (diffRule) {
      case 'first':
        return col1Cell;
      case 'second':
        return col2Cell;
      case 'blank':
        return { type: 'blank' };
      case 'broken':
        return { type: 'broken' };
    }
  }

  // Fallback (should never reach here)
  return col1Cell;
}

function mergeMiniGrids(col1: MiniGrid, col2: MiniGrid, rules: PuzzleRules): MiniGrid {
  const topRule = cellEqual(col1[0], col2[0]) ? rules.topRow.same : rules.topRow.diff;
  const bottomRule = cellEqual(col1[2], col2[2]) ? rules.bottomRow.same : rules.bottomRow.diff;

  let cell0 = applyMergeRule(col1[0], col2[0], topRule);
  let cell1 = applyMergeRule(col1[1], col2[1], topRule);
  const cell2 = applyMergeRule(col1[2], col2[2], bottomRule);
  const cell3 = applyMergeRule(col1[3], col2[3], bottomRule);

  if (cellEqual(col1[0], col2[0]) && cellEqual(col1[1], col2[1]) && rules.topRow.same === 'swap-lr') {
    [cell0, cell1] = [cell1, cell0];
  }

  return [cell0, cell1, cell2, cell3];
}

// ── 生成规则（排除无效组合）──

function generateValidRules(): PuzzleRules {
  const allSameActions: SameAction[] = ['keep', 'swap-lr', 'shrink', 'blank', 'broken'];
  const allDiffActions: DiffAction[] = ['first', 'second', 'blank', 'broken'];

  const invalidCombinations = [
    { same: 'blank', diff: 'blank' },
    { same: 'broken', diff: 'broken' },
    { same: 'blank', diff: 'broken' },
    { same: 'broken', diff: 'blank' },
  ];

  let topRow: RowMergeRule;
  let bottomRow: RowMergeRule;

  do {
    topRow = {
      same: randomChoice(allSameActions),
      diff: randomChoice(allDiffActions),
    };

    bottomRow = {
      same: randomChoice(allSameActions),
      diff: randomChoice(allDiffActions),
    };

    const topInvalid = invalidCombinations.some(
      c => topRow.same === c.same && topRow.diff === c.diff
    );
    const bottomInvalid = invalidCombinations.some(
      c => bottomRow.same === c.same && bottomRow.diff === c.diff
    );

    const identical = topRow.same === bottomRow.same && topRow.diff === bottomRow.diff;

    if (!topInvalid && !bottomInvalid && !identical) {
      break;
    }
  } while (true);

  // 随机选择变换
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

  const elementTransform = randomChoice(allElementTransforms);
  const sizeTransform = randomChoice(allSizeTransforms);
  const positionTransform = randomChoice(allPositionTransforms);

  return {
    topRow,
    bottomRow,
    elementTransform,
    sizeTransform,
    positionTransform,
    mergeStrategy: {},
  };
}

// ── 构建矩阵 ──

function buildMatrix(rules: PuzzleRules): Matrix {
  // 根据变换选择主题
  const hasRotationOrMirror =
    rules.elementTransform !== 'none' && rules.elementTransform !== 'scale-down';

  let availableThemes: string[];
  if (hasRotationOrMirror) {
    // 只选有朝向的主题
    availableThemes = DIRECTIONAL_THEMES;
  } else {
    // 所有主题都可用
    availableThemes = [...DIRECTIONAL_THEMES, ...SYMMETRIC_THEMES, ...MIXED_THEMES];
  }

  const groupKey = randomChoice(availableThemes) as keyof typeof EMOJI_GROUPS;
  const emojiPool = shuffle([...EMOJI_GROUPS[groupKey]]);

  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    const col1: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      const emoji = emojiPool[row * 4 + i] || randomChoice(emojiPool);
      col1.push({ type: 'emoji', emoji, rotation: 0, mirror: 'none', scaled: false });
    }

    // col2 = applyTransforms(col1, rules)
    const col2 = applyTransforms(col1 as MiniGrid, rules);

    // col3 = merge(col1, col2)
    const col3 = mergeMiniGrids(col1 as MiniGrid, col2, rules);

    matrix.push([col1 as MiniGrid, col2, col3]);
  }

  return matrix;
}

// ── 生成选项池 ──

function generateChoices(matrix: Matrix, hiddenCells: { row: number; col: number }[]): CellContent[] {
  const correctAnswers: CellContent[] = [];
  for (const { row, col } of hiddenCells) {
    correctAnswers.push(...matrix[row][col]);
  }

  const allEmojis = new Set<string>();
  for (const row of matrix) {
    for (const miniGrid of row) {
      for (const cell of miniGrid) {
        if (cell && cell.type === 'emoji') allEmojis.add(cell.emoji);
      }
    }
  }
  const emojiList = [...allEmojis];

  const candidateMap = new Map<string, CellContent>();

  for (const correct of correctAnswers) {
    const key = JSON.stringify(correct);
    candidateMap.set(key, correct);
  }

  for (const correct of correctAnswers) {
    if (correct.type !== 'emoji') continue;

    const rot = correct.rotation || 0;
    const mir = correct.mirror || 'none';
    const sc = correct.scaled || false;

    const allRots: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
    const allMirrors: Array<'none' | 'horizontal' | 'vertical'> = ['none', 'horizontal', 'vertical'];
    const allScales = [true, false];

    for (const r of allRots) {
      if (r !== rot) {
        const d = { ...correct, rotation: r };
        candidateMap.set(JSON.stringify(d), d);
      }
    }

    for (const m of allMirrors) {
      if (m !== mir) {
        const d = { ...correct, mirror: m };
        candidateMap.set(JSON.stringify(d), d);
      }
    }

    for (const s of allScales) {
      if (s !== sc) {
        const d = { ...correct, scaled: s };
        candidateMap.set(JSON.stringify(d), d);
      }
    }

    const otherEmojis = emojiList.filter(e => e !== correct.emoji);
    for (const e of otherEmojis.slice(0, 2)) {
      const d: EmojiContent = { type: 'emoji', emoji: e, rotation: rot, mirror: mir, scaled: sc };
      candidateMap.set(JSON.stringify(d), d);
    }
  }

  candidateMap.set(JSON.stringify({ type: 'blank' }), { type: 'blank' });
  candidateMap.set(JSON.stringify({ type: 'broken' }), { type: 'broken' });
  
  // pass 选项：用🔍表示"不确定"
  const passOption: PassContent = { 
    type: 'pass', 
    emoji: '🔍',
    rotation: 0,
    mirror: 'none',
    scaled: false
  };
  candidateMap.set(JSON.stringify(passOption), passOption);

  if (candidateMap.size < 12) {
    const visible: CellContent[] = [];
    for (const row of matrix) {
      for (const miniGrid of row) {
        for (const cell of miniGrid) {
          if (cell) visible.push(cell);
        }
      }
    }
    for (const cell of shuffle(visible)) {
      const key = JSON.stringify(cell);
      if (!candidateMap.has(key)) {
        candidateMap.set(key, cell);
        if (candidateMap.size >= 12) break;
      }
    }
  }

  const correctKeys = new Set(correctAnswers.map(c => JSON.stringify(c)));
  const correct: CellContent[] = [];
  const distractors: CellContent[] = [];

  for (const [key, cell] of candidateMap) {
    if (correctKeys.has(key)) {
      correct.push(cell);
    } else {
      distractors.push(cell);
    }
  }

  const result = [...correct, ...shuffle(distractors)].slice(0, 18);

  return shuffle(result);
}

// ── 口诀生成 ──

export function generateMnemonic(rules: PuzzleRules): string {
  const dict = {
    keep: '留原',
    'swap-lr': '换位',
    shrink: '缩小',
    blank: '变空',
    broken: '变裂',
    first: '留左',
    second: '留右',
  };

  const transformDict: Record<string, string> = {
    'none': '无',
    'rotate-cw-90': '右旋90°',
    'rotate-180': '旋转180°',
    'rotate-ccw-90': '左旋90°',
    'mirror-h': '左右镜像',
    'mirror-v': '上下镜像',
    'scale-down': '缩小',
    'scale-up': '放大',
    'pos-rotate-cw': '位置顺转',
    'pos-rotate-180': '位置180°',
    'pos-rotate-ccw': '位置逆转',
    'pos-mirror-lr': '位置左右翻',
    'pos-mirror-ud': '位置上下翻',
    'pos-diag-main': '位置主对角',
    'pos-diag-anti': '位置副对角',
  };

  const topSame = dict[rules.topRow.same] || rules.topRow.same;
  const topDiff = dict[rules.topRow.diff] || rules.topRow.diff;
  const bottomSame = dict[rules.bottomRow.same] || rules.bottomRow.same;
  const bottomDiff = dict[rules.bottomRow.diff] || rules.bottomRow.diff;

  let result = `上同[${topSame}] 上异[${topDiff}] / 下同[${bottomSame}] 下异[${bottomDiff}]`;

  // 添加变换信息
  const transforms: string[] = [];
  if (rules.elementTransform && rules.elementTransform !== 'none') {
    transforms.push(transformDict[rules.elementTransform] || rules.elementTransform);
  }
  if (rules.sizeTransform && rules.sizeTransform !== 'none') {
    transforms.push(transformDict[rules.sizeTransform] || rules.sizeTransform);
  }
  if (rules.positionTransform && rules.positionTransform !== 'none') {
    transforms.push(transformDict[rules.positionTransform] || rules.positionTransform);
  }

  if (transforms.length > 0) {
    result += ` | ${transforms.join(' + ')}`;
  }

  return result;
}

// ── 解析生成 ──

export function describeAnalysis(rules: PuzzleRules): string {
  const dict = {
    keep: '保留',
    'swap-lr': '左右互换',
    shrink: '缩小',
    blank: '变空',
    broken: '变裂',
    first: '留第一列',
    second: '留第二列',
  };

  const transformDict: Record<string, string> = {
    'none': '无',
    'rotate-cw-90': '顺时针旋转90°',
    'rotate-180': '旋转180°',
    'rotate-ccw-90': '逆时针旋转90°',
    'mirror-h': '水平镜像',
    'mirror-v': '垂直镜像',
    'scale-down': '图案缩小',
    'scale-up': '图案放大',
    'pos-rotate-cw': '位置顺时针旋转',
    'pos-rotate-180': '位置旋转180°',
    'pos-rotate-ccw': '位置逆时针旋转',
    'pos-mirror-lr': '位置左右镜像',
    'pos-mirror-ud': '位置上下镜像',
    'pos-diag-main': '位置主对角线交换',
    'pos-diag-anti': '位置副对角线交换',
  };

  const topSame = dict[rules.topRow.same] || rules.topRow.same;
  const topDiff = dict[rules.topRow.diff] || rules.topRow.diff;
  const bottomSame = dict[rules.bottomRow.same] || rules.bottomRow.same;
  const bottomDiff = dict[rules.bottomRow.diff] || rules.bottomRow.diff;

  let result = `上行：相同→${topSame}，不同→${topDiff}；下行：相同→${bottomSame}，不同→${bottomDiff}`;

  // 添加变换信息
  const transforms: string[] = [];
  if (rules.elementTransform && rules.elementTransform !== 'none') {
    transforms.push(transformDict[rules.elementTransform] || rules.elementTransform);
  }
  if (rules.sizeTransform && rules.sizeTransform !== 'none') {
    transforms.push(transformDict[rules.sizeTransform] || rules.sizeTransform);
  }
  if (rules.positionTransform && rules.positionTransform !== 'none') {
    transforms.push(transformDict[rules.positionTransform] || rules.positionTransform);
  }

  if (transforms.length > 0) {
    result += `；变换：${transforms.join(' + ')}`;
  }

  return result;
}

// ── 主生成函数 ──

export function generatePuzzle(): GamePuzzle {
  const rules = generateValidRules();

  const phase1Matrix = buildMatrix(rules);
  const phase2Matrix = buildMatrix(rules);

  const phase1Hidden = { row: 2, col: 2 };
  const phase2Hidden = [
    { row: 1, col: 2 },
    { row: 2, col: 2 },
  ];

  const choices = generateChoices(phase1Matrix, [phase1Hidden]);
  const phase2Choices = generateChoices(phase2Matrix, phase2Hidden);

  const phase1Rules = [describeAnalysis(rules)];
  const phase2NewRules = ['继续观察相同规律'];

  return {
    matrix: phase1Matrix,
    phase1Hidden,
    phase2Hidden,
    choices,
    rules,
    phase1Rules,
    phase2NewRules,
    phase2Matrix,
    phase2Choices,
  };
}

// ── 检查答案 ──

export function checkAnswer(
  matrix: Matrix,
  hidden: { row: number; col: number },
  answers: MiniGrid
): { correct: number; total: number; details: boolean[] } {
  const correctGrid = matrix[hidden.row][hidden.col];
  let correct = 0;
  const details: boolean[] = [];

  for (let i = 0; i < 4; i++) {
    const isCorrect = JSON.stringify(correctGrid[i]) === JSON.stringify(answers[i]);
    details.push(isCorrect);
    if (isCorrect) {
      correct++;
    }
  }

  return { correct, total: 4, details };
}
