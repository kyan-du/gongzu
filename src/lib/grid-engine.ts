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

export type SameAction = 'keep' | 'shrink' | 'blank' | 'broken';
export type DiffAction = 'first' | 'second' | 'blank' | 'broken';

export type CellMergeRule = {
  same: SameAction;
  diff: DiffAction;
};

export type PuzzleRules = {
  // 4个位置各自独立的合并规则：[左上, 右上, 左下, 右下]
  cellRules: [CellMergeRule, CellMergeRule, CellMergeRule, CellMergeRule];
  // 每个位置的内部变换（如 'rotate-cw-90', 'mirror-h', 'none'）
  cellTransforms: [string, string, string, string];
  // 整体位置变换
  positionTransform: string;
  sizeTransform: string;
  // 兼容旧版前端（必须是 string，不能是 undefined）
  elementTransform: string;
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
// ── 素材分类（基于变换兼容性审查） ──
// 审查方法：debug-emoji-transforms.html 逐组截图 + 视觉分析
// 日期：2026-04-06
//
// rotate: 旋转90°/180°/270°后视觉上有明显差异
// mirror: 水平/垂直镜像后视觉上有明显差异
// scale: 缩放（几乎全部适用，不单独标记）
//
// ── 对称性审查结果（2026-04-06 万手动标注） ──
// axial = 轴对称 → 镜像后无明显变化 → MIRROR_EXCLUDE
// central = 中心对称 → 旋转180°后无明显变化 → ROTATE_EXCLUDE

// 轴对称 emoji 排除列表（镜像变换无效）
const MIRROR_EXCLUDE: Record<string, string[]> = {
  animals:     ['🐱','🐭','🐰','🦊','🐻','🐼','🐨','🐯','🐮','🐷','🐸','🐵'],
  birds:       ['🦚'],
  ocean:       ['🐙','🦀','🦞'],
  insects:     ['🦋','🐞','🪲','🪳','🪰','🕷️'],
  space:       ['🌑','🌕'],
  tools:       ['🧲','🧰'],
  electronics: ['🖨️','📺','🖱️'],
  bodyparts:   ['👃','👄','🦷','💀','👅'],
  vehicles2:   ['🚊'],
  arrows:      ['⬆️','↕️','↔️'],
  letters:     ['A','M','W'],
  shapes:      ['▲','△','◆','◇','►','▷','◄','◁','▼','★','☆','●','○','■','□'],
  numbers:     ['0'],
  hanzi:       ['末','未'],
  flowers:     ['🌼'],
  hearts:      ['❤️','💜','💙','💚','💛','🧡','🤍','🖤','🤎','💗'],
  christmas:   ['🤶','🌟'],
  gems:        ['🔶','🔷','🔸','🔹'],
  buildings:   ['🏥','⛪','🏛️','🕍','⛩️'],
  clothing:    ['👕','👖','👗'],
  furniture:   ['💡'],
  drinks:      ['🍷','🥛'],
  clocks:      ['🕕','🕛','⏳','⌛'],
  zodiac:      ['♈','♉','♊','♎','♓','🔯'],
  faces:       ['😀','😂','🥹','🤢','😡','😱','🤗'],
  hands:       ['🤲','👐','🫶'],
  music:       ['🎹'],
  objects:     ['💡'],
  weather:     ['☀️'],
};

// 中心对称 emoji 排除列表（旋转180°后无明显变化）
const ROTATE_EXCLUDE: Record<string, string[]> = {
  space:       ['🌑','🌕'],
  electronics: ['📀'],
  letters:     ['S'],
  shapes:      ['◆','◇','●','○','■','□'],
  numbers:     ['0'],
  flowers:     ['🌼'],
  christmas:   ['❄️'],
  weather:     ['❄️'],
};

// 主题变换兼容性（基于审查结果自动推导）
// rotate: 组内排除 ROTATE_EXCLUDE 后还剩 ≥ 12 个可用 emoji
// mirror: 组内排除 MIRROR_EXCLUDE 后还剩 ≥ 12 个可用 emoji
function computeThemeCompat(): Record<string, { rotate: boolean; mirror: boolean }> {
  const MIN_USABLE = 12; // 3行×4格=12个不同 emoji
  const result: Record<string, { rotate: boolean; mirror: boolean }> = {};
  for (const [group, emojis] of Object.entries(EMOJI_GROUPS)) {
    const mirrorExcl = new Set(MIRROR_EXCLUDE[group] || []);
    const rotateExcl = new Set(ROTATE_EXCLUDE[group] || []);
    const mirrorUsable = emojis.filter(e => !mirrorExcl.has(e)).length;
    const rotateUsable = emojis.filter(e => !rotateExcl.has(e)).length;
    result[group] = {
      rotate: rotateUsable >= MIN_USABLE,
      mirror: mirrorUsable >= MIN_USABLE,
    };
  }
  return result;
}

const EMOJI_GROUPS = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🐸', '🐵', '🐷', '🐻', '🐼', '🦊', '🐨', '🦁', '🐯', '🐮'],
  birds: ['🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦜', '🦚', '🦩', '🕊️', '🦢', '🦤', '🐓', '🦃'],
  ocean: ['🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🦭', '🐚', '🪸', '🦞'],
  fruits: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍌', '🥝', '🍒', '🫐', '🍈', '🥭', '🍍', '🥥', '🍐'],
  vegetables: ['🥕', '🌽', '🌶️', '🥒', '🥬', '🧅', '🧄', '🥦', '🍆', '🥔', '🍠', '🫚', '🍄', '🫛', '🥜'],
  food: ['🍕', '🍔', '🌭', '🌮', '🍣', '🍜', '🍩', '🎂', '🍪', '🍫', '🧁', '🥐', '🍝', '🥗', '🍟'],
  transport: ['🚗', '🚕', '🚙', '🚌', '🚓', '🚑', '🚒', '🛵', '🚲', '🏍️', '🚂', '🚀', '🛸', '🚁', '✈️'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🎯', '🎳', '🏒', '🥌'],
  music: ['🎸', '🎹', '🎺', '🎷', '🥁', '🎻', '🪕', '🎤', '🪗', '🪘', '📯', '🎵', '🎶', '🔔', '🎼'],
  flowers: ['🌸', '🌻', '🌹', '🌺', '🌷', '🍀', '🌿', '🌵', '🌲', '🍁', '🌾', '🌴', '💐', '🪻', '🪷'],
  weather: ['☀️', '🌙', '⭐', '🌈', '❄️', '🔥', '💧', '🌊', '💨', '🌪️', '⚡', '🌤️', '⛅', '🌦️', '☁️'],
  objects: ['📚', '✏️', '🎒', '📱', '💡', '🔑', '📷', '🧩', '🎁', '🏆', '🔔', '📐', '📏', '🖊️', '📌'],
  faces: ['😀', '😎', '🥳', '🤩', '😱', '🥶', '😴', '🤖', '👻', '💀', '👽', '🎃', '🤡', '😈', '🥸'],
  hands: ['👍', '👎', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '✋', '🖖', '👌', '🤌', '🤏', '🫰', '🫵'],
  insects: ['🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦂', '🪲', '🪳', '🦗', '🪰', '🦟', '🕷️', '🦠', '🪱'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '①', '②', '③', '④', '⑤'],
  letters: ['b', 'd', 'p', 'q', 'A', 'B', 'R', 'P', 'M', 'W', 'N', 'Z', 'S', 'E', 'C'],
  hanzi: ['戍', '戊', '戌', '戎', '己', '已', '巳', '末', '未', '刺', '剌', '壤', '攘', '甲', '由'],
  shapes: ['▲', '△', '◆', '◇', '►', '▷', '◄', '◁', '▼', '★', '☆', '●', '○', '■', '□'],
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
  buildings: ['🏠', '🏢', '🏥', '🏫', '🏰', '🗼', '⛪', '🏛️', '🏟️', '🕌', '🕍', '⛩️', '🏗️', '🏭', '🏬'],
  clothing: ['👕', '👖', '👗', '🧥', '👠', '🎩', '🧢', '👟', '👔', '👘', '🥿', '👢', '🧤', '🧣', '👒'],
  furniture: ['🛋️', '🪑', '🛏️', '🚿', '🧹', '🪣', '🧺', '💡', '🪟', '🚪', '🪞', '🧸', '🖼️', '🛁', '🪴'],
  drinks: ['☕', '🍵', '🥤', '🧋', '🍺', '🍷', '🥂', '🍾', '🧃', '🥛', '🍹', '🍸', '🫖', '🍶', '🥃'],
  clocks: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '⏰', '⏳', '⌛'],
  zodiac: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔯', '☯️'],
  hanzi2: ['折', '拆', '侯', '候', '拔', '拨', '辩', '辨', '瓣', '辫', '炙', '灸', '毫', '豪', '鉴'],
  hanzi3: ['棘', '枣', '壁', '璧', '睛', '晴', '情', '清', '请', '精', '蜻', '靖', '菁', '倩', '婧'],
};

const THEME_TRANSFORM_COMPAT = computeThemeCompat();

// 按变换能力分类（从 THEME_TRANSFORM_COMPAT 派生）
const ROTATE_THEMES = Object.keys(THEME_TRANSFORM_COMPAT).filter(k => THEME_TRANSFORM_COMPAT[k].rotate);
const MIRROR_SAFE_THEMES = Object.keys(THEME_TRANSFORM_COMPAT).filter(k => THEME_TRANSFORM_COMPAT[k].mirror);
const ALL_THEMES = Object.keys(THEME_TRANSFORM_COMPAT);

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

  const result: EmojiContent = {
    type: 'emoji',
    emoji: cell.emoji,
    rotation: cell.rotation || 0,
    mirror: cell.mirror || 'none',
    scaled: cell.scaled || false,
    grown: cell.grown || false,
  };

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

  const result: EmojiContent = {
    type: 'emoji',
    emoji: cell.emoji,
    rotation: cell.rotation || 0,
    mirror: cell.mirror || 'none',
    scaled: cell.scaled || false,
    grown: cell.grown || false,
  };

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
 * 应用全局变换：尺寸变换 + 位置变换
 * （元素变换改成 cellTransforms，在合并后按位置应用）
 */
export function applyTransforms(grid: MiniGrid, rules: PuzzleRules): MiniGrid {
  // 1. 尺寸变换（全局）
  let transformed: CellContent[] = grid.map(cell =>
    applySizeTransform(cell, rules.sizeTransform)
  );

  // 2. 位置变换（全局）
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
  const merged = [0, 1, 2, 3].map(i => {
    const rule = cellEqual(col1[i], col2[i]) ? rules.cellRules[i].same : rules.cellRules[i].diff;
    let cell = applyMergeRule(col1[i], col2[i], rule);
    // 应用位置级内部变换
    if (rules.cellTransforms[i] !== 'none' && cell.type === 'emoji') {
      cell = applyElementTransform(cell, rules.cellTransforms[i]);
    }
    return cell;
  });
  return merged as MiniGrid;
}

// ── 生成规则（排除无效组合）──

function generateValidRules(): PuzzleRules {
  const allSameActions: SameAction[] = ['keep', 'shrink', 'blank', 'broken'];
  const allDiffActions: DiffAction[] = ['first', 'second', 'blank', 'broken'];

  const invalidCombinations = [
    { same: 'blank', diff: 'blank' },
    { same: 'broken', diff: 'broken' },
    { same: 'blank', diff: 'broken' },
    { same: 'broken', diff: 'blank' },
  ];

  // 生成4个各不相同的 CellMergeRule
  const cellRules: CellMergeRule[] = [];
  const usedCombinations = new Set<string>();

  let attempts = 0;
  const maxAttempts = 1000;

  while (cellRules.length < 4 && attempts < maxAttempts) {
    attempts++;

    const rule: CellMergeRule = {
      same: randomChoice(allSameActions),
      diff: randomChoice(allDiffActions),
    };

    // 检查是否是无效组合
    const isInvalid = invalidCombinations.some(
      c => rule.same === c.same && rule.diff === c.diff
    );
    if (isInvalid) continue;

    // 检查是否已经存在相同的组合
    const key = `${rule.same}-${rule.diff}`;
    if (usedCombinations.has(key)) continue;

    cellRules.push(rule);
    usedCombinations.add(key);
  }

  // 如果生成失败，使用默认规则
  if (cellRules.length < 4) {
    cellRules.push(
      { same: 'keep', diff: 'first' },
      { same: 'shrink', diff: 'second' },
      { same: 'keep', diff: 'blank' },
      { same: 'shrink', diff: 'broken' }
    );
  }

  // 生成 cellTransforms: 随机2-3个位置有变换
  const elementTransformOptions = ['rotate-cw-90', 'rotate-180', 'rotate-ccw-90', 'mirror-h', 'mirror-v'];
  const numWithTransform = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const positions = shuffle([0, 1, 2, 3]);
  const cellTransforms: [string, string, string, string] = ['none', 'none', 'none', 'none'];

  for (let i = 0; i < numWithTransform; i++) {
    cellTransforms[positions[i]] = randomChoice(elementTransformOptions);
  }

  // 生成 positionTransform
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
  let positionTransform = randomChoice(allPositionTransforms);

  // sizeTransform
  const allSizeTransforms = ['none', 'scale-down', 'scale-up'];
  const sizeTransform = randomChoice(allSizeTransforms);

  // 确保至少2个维度同时起作用
  // 合并规则 always on，所以只需要至少有 cellTransforms 或 positionTransform 之一
  const hasCellTransform = cellTransforms.some(t => t !== 'none');
  const hasPositionTransform = positionTransform !== 'none';

  if (!hasCellTransform && !hasPositionTransform) {
    // 强制添加一个变换
    if (Math.random() < 0.5) {
      // 添加 cellTransform
      cellTransforms[randomChoice([0, 1, 2, 3])] = randomChoice(elementTransformOptions);
    } else {
      // 修改 positionTransform 为非 none
      const nonNonePos = allPositionTransforms.filter(p => p !== 'none');
      positionTransform = randomChoice(nonNonePos);
    }
  }

  // elementTransform 兼容字段（设为 'none'，因为现在每个位置独立）
  const elementTransform = 'none';

  return {
    cellRules: cellRules.slice(0, 4) as [CellMergeRule, CellMergeRule, CellMergeRule, CellMergeRule],
    cellTransforms,
    positionTransform,
    sizeTransform,
    elementTransform,
    mergeStrategy: {},
  };
}

// ── 构建矩阵 ──

/**
 * 合并类矩阵：col1 + col2 独立生成，col3 = merge(col1, col2)
 */
function buildMergeMatrix(rules: PuzzleRules, emojiPool: string[]): Matrix {

  // 为每个位置生成 same/diff 分布
  // 核心约束：前2行（可观察行）必须 same 和 diff 各出现至少1次
  // 这样观察者在答题前能推出该位置的两种规律
  // 前2行一个 true 一个 false，第3行随机
  const sameDiffMap: boolean[][] = [];
  for (let i = 0; i < 4; i++) {
    const first2 = Math.random() < 0.5 ? [true, false] : [false, true];
    const third = Math.random() < 0.5;
    sameDiffMap.push([first2[0], first2[1], third]);
  }

  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    const col1: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      const emoji = emojiPool[(row * 4 + i) % emojiPool.length] || randomChoice(emojiPool);
      col1.push({ type: 'emoji', emoji, rotation: 0, mirror: 'none', scaled: false, grown: false });
    }

    // 主动构造 col2，根据 sameDiffMap 决定每个位置是 same 还是 diff
    const col2: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      if (sameDiffMap[i][row]) {
        // same: 复制 col1 的 emoji
        col2.push({ ...col1[i] });
      } else {
        // diff: 选一个不同的 emoji
        const col1Emoji = (col1[i] as EmojiContent).emoji;
        const diffPool = emojiPool.filter(e => e !== col1Emoji);
        const diffEmoji = diffPool.length > 0 ? randomChoice(diffPool) : col1Emoji;
        col2.push({ type: 'emoji', emoji: diffEmoji, rotation: 0, mirror: 'none', scaled: false, grown: false });
      }
    }

    // col3 = merge(col1, col2)
    const col3 = mergeMiniGrids(col1 as MiniGrid, col2 as MiniGrid, rules);

    matrix.push([col1 as MiniGrid, col2 as MiniGrid, col3]);
  }

  return matrix;
}

/**
 * 递推类矩阵：col1 → transform → col2 → transform → col3
 */
function buildTransformMatrix(rules: PuzzleRules, emojiPool: string[]): Matrix {
  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    const col1: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      const emoji = emojiPool[row * 4 + i] || randomChoice(emojiPool);
      col1.push({ type: 'emoji', emoji, rotation: 0, mirror: 'none', scaled: false, grown: false });
    }

    // 递推：col1 → col2 → col3
    const col2 = applyTransforms(col1 as MiniGrid, rules);
    const col3 = applyTransforms(col2, rules);

    matrix.push([col1 as MiniGrid, col2, col3]);
  }

  return matrix;
}

/**
 * 混合类矩阵：col1 → transform → col2，col3 = merge(col1, col2)
 */
function buildMixedMatrix(rules: PuzzleRules, emojiPool: string[]): Matrix {

  // 前2行（可观察行）每个位置 same/diff 各至少1次
  const sameDiffMap: boolean[][] = [];
  for (let i = 0; i < 4; i++) {
    const first2 = Math.random() < 0.5 ? [true, false] : [false, true];
    const third = Math.random() < 0.5;
    sameDiffMap.push([first2[0], first2[1], third]);
  }

  const matrix: Matrix = [];

  for (let row = 0; row < 3; row++) {
    const col1: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      const emoji = emojiPool[(row * 4 + i) % emojiPool.length] || randomChoice(emojiPool);
      col1.push({ type: 'emoji', emoji, rotation: 0, mirror: 'none', scaled: false, grown: false });
    }

    // 混合：主动构造 col2，确保 same/diff 分布合理
    const col2: CellContent[] = [];
    for (let i = 0; i < 4; i++) {
      if (sameDiffMap[i][row]) {
        col2.push({ ...col1[i] });
      } else {
        const col1Emoji = (col1[i] as EmojiContent).emoji;
        const diffPool = emojiPool.filter(e => e !== col1Emoji);
        const diffEmoji = diffPool.length > 0 ? randomChoice(diffPool) : col1Emoji;
        col2.push({ type: 'emoji', emoji: diffEmoji, rotation: 0, mirror: 'none', scaled: false, grown: false });
      }
    }

    // 对 col2 应用位置级 cellTransforms（混合类的"变换"维度）
    for (let i = 0; i < 4; i++) {
      if (rules.cellTransforms[i] !== 'none' && col2[i].type === 'emoji') {
        col2[i] = applyElementTransform(col2[i] as EmojiContent, rules.cellTransforms[i]);
      }
    }

    const col3 = mergeMiniGrids(col1 as MiniGrid, col2 as MiniGrid, rules);

    matrix.push([col1 as MiniGrid, col2 as MiniGrid, col3]);
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
  
  // pass 选项单独处理，不进 candidateMap，确保永远出现在备选列表末尾
  const passOption: PassContent = { 
    type: 'pass', 
    emoji: '🔍',
    rotation: 0,
    mirror: 'none',
    scaled: false
  };

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

  const result = [...correct, ...shuffle(distractors)].slice(0, 17);
  // 🔍永远在末尾，不被 shuffle 也不被截断
  result.push(passOption);

  return shuffle(result);
}

// ── 口诀生成 ──

export function generateMnemonic(rules: PuzzleRules): string {
  const dict: Record<string, string> = {
    keep: '留',
    shrink: '缩',
    blank: '空',
    broken: '裂',
    first: '一',
    second: '二',
  };

  const transformDict: Record<string, string> = {
    'none': '无',
    'rotate-cw-90': '右转',
    'rotate-180': '倒',
    'rotate-ccw-90': '左转',
    'mirror-h': '横翻',
    'mirror-v': '竖翻',
    'pos-rotate-cw': '位顺',
    'pos-rotate-180': '位倒',
    'pos-rotate-ccw': '位逆',
    'pos-mirror-lr': '位横',
    'pos-mirror-ud': '位竖',
    'pos-diag-main': '位主',
    'pos-diag-anti': '位副',
  };

  const posLabels = ['①', '②', '③', '④'];
  const parts: string[] = [];

  // 合并规则
  rules.cellRules.forEach((rule, i) => {
    const s = dict[rule.same] || rule.same;
    const d = dict[rule.diff] || rule.diff;
    parts.push(`${posLabels[i]}同${s}异${d}`);
  });

  // 内部变换（cellTransforms）
  const tParts: string[] = [];
  rules.cellTransforms.forEach((t, i) => {
    if (t !== 'none') {
      tParts.push(`${posLabels[i]}${transformDict[t] || t}`);
    }
  });
  if (tParts.length > 0) {
    parts.push(`变[${tParts.join(' ')}]`);
  }

  // 位置变换
  if (rules.positionTransform && rules.positionTransform !== 'none') {
    parts.push(transformDict[rules.positionTransform] || rules.positionTransform);
  }

  return parts.join(' ');
}

// ── 解析生成 ──

export function describeAnalysis(rules: PuzzleRules): string {
  const dict: Record<string, string> = {
    keep: '保留',
    shrink: '缩小',
    blank: '变空',
    broken: '变裂',
    first: '留一',
    second: '留二',
  };

  const transformDict: Record<string, string> = {
    'none': '无',
    'rotate-cw-90': '旋转90°',
    'rotate-180': '旋转180°',
    'rotate-ccw-90': '旋转-90°',
    'mirror-h': '镜像H',
    'mirror-v': '镜像V',
    'pos-rotate-cw': '顺时针旋转',
    'pos-rotate-180': '旋转180°',
    'pos-rotate-ccw': '逆时针旋转',
    'pos-mirror-lr': '左右镜像',
    'pos-mirror-ud': '上下镜像',
    'pos-diag-main': '主对角',
    'pos-diag-anti': '副对角',
  };

  // 4个位置的规则
  const posLabels = ['①', '②', '③', '④'];
  const ruleParts = rules.cellRules.map((rule, i) => {
    const same = dict[rule.same] || rule.same;
    const diff = dict[rule.diff] || rule.diff;
    return `${posLabels[i]}同[${same}]异[${diff}]`;
  });

  let result = ruleParts.join(' ');

  // 变换（cellTransforms）
  const transformParts: string[] = [];
  rules.cellTransforms.forEach((t, i) => {
    transformParts.push(`${posLabels[i]}${transformDict[t] || t}`);
  });

  result += ' | 变换：' + transformParts.join(' ');

  // 位置变换
  if (rules.positionTransform && rules.positionTransform !== 'none') {
    result += ` | 位置：${transformDict[rules.positionTransform] || rules.positionTransform}`;
  }

  return result;
}

// ── 主生成函数 ──

export function generatePuzzle(): GamePuzzle {
  const rules = generateValidRules();

  // 随机选择题型：合并 40% / 递推 30% / 混合 30%
  const rand = Math.random();
  let puzzleType: 'merge' | 'transform' | 'mixed';
  if (rand < 0.4) {
    puzzleType = 'merge';
  } else if (rand < 0.7) {
    puzzleType = 'transform';
  } else {
    puzzleType = 'mixed';
  }

  // 选择 emoji pool（阶段一二共享同一套符号）
  const isMirror = rules.cellTransforms.some(t => t === 'mirror-h' || t === 'mirror-v');
  const isRotate = rules.cellTransforms.some(t => ['rotate-cw-90', 'rotate-180', 'rotate-ccw-90'].includes(t));

  let availableThemes: string[];
  if (isMirror) {
    availableThemes = MIRROR_SAFE_THEMES;
  } else if (isRotate) {
    availableThemes = ROTATE_THEMES;
  } else {
    availableThemes = ALL_THEMES;
  }

  const groupKey = randomChoice(availableThemes) as keyof typeof EMOJI_GROUPS;
  let emojiPool = [...EMOJI_GROUPS[groupKey]];

  if (isMirror && MIRROR_EXCLUDE[groupKey]) {
    const exclude = new Set(MIRROR_EXCLUDE[groupKey]);
    emojiPool = emojiPool.filter(e => !exclude.has(e));
  }
  if (isRotate && ROTATE_EXCLUDE[groupKey]) {
    const exclude = new Set(ROTATE_EXCLUDE[groupKey]);
    emojiPool = emojiPool.filter(e => !exclude.has(e));
  }

  // 根据题型选择构建函数
  let buildFn: (rules: PuzzleRules, pool: string[]) => Matrix;
  switch (puzzleType) {
    case 'merge':
      buildFn = buildMergeMatrix;
      break;
    case 'transform':
      buildFn = buildTransformMatrix;
      break;
    case 'mixed':
      buildFn = buildMixedMatrix;
      break;
  }

  // 阶段一二共享同一个 emoji pool（shuffle 各自独立）
  const phase1Matrix = buildFn(rules, shuffle([...emojiPool]));
  const phase2Matrix = buildFn(rules, shuffle([...emojiPool]));

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
): { correct: number; total: number; details: ('correct' | 'wrong' | 'pass')[] } {
  const correctGrid = matrix[hidden.row][hidden.col];
  let correct = 0;
  const details: ('correct' | 'wrong' | 'pass')[] = [];

  for (let i = 0; i < 4; i++) {
    if (answers[i] && (answers[i] as any).type === 'pass') {
      // 🔍 诚实分：0.25 分（知道自己不知道）
      details.push('pass');
      correct += 0.25;
    } else if (JSON.stringify(correctGrid[i]) === JSON.stringify(answers[i])) {
      details.push('correct');
      correct += 1;
    } else {
      details.push('wrong');
    }
  }

  return { correct, total: 4, details };
}
