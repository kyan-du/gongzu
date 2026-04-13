// ========================================
// 宫格推理引擎 - Grid Reasoning Engine
// ========================================

import {
  type CellContent,
  type Matrix,
  type PuzzleRules,
  generateValidRules,
  buildMergeMatrix,
  buildTransformMatrix,
  buildMixedMatrix,
  EMOJI_GROUPS,
  THEME_TRANSFORM_COMPAT,
  shuffle,
  randomChoice,
  normalizeCell,
} from './grid-engine';

// ── 数据模型 ──

export interface HiddenPosition {
  row: number;    // 矩阵行 (0-2)
  col: number;    // 矩阵列 (0-2)
  cellIdx: number; // MiniGrid 内位置 (0-3)
}

export interface Candidate {
  id: string;          // 唯一标识
  content: CellContent; // 单个 emoji（含 rotation/mirror/scale 等）
}

export interface ReasoningPuzzle {
  matrix: Matrix;                    // 完整 3×3 矩阵
  hiddenPositions: HiddenPosition[]; // 被遮盖的单元格位置
  candidates: Candidate[];           // 候选 emoji 列表
  rules: PuzzleRules;
  // 正确答案映射: "row-col-cellIdx" → candidate id
  correctAnswers: Map<string, string>;
}

// ── 生成推理题目 ──

export function generateReasoningPuzzle(): ReasoningPuzzle {
  for (let attempt = 0; attempt < 60; attempt++) {
    // 1. 生成规则
    const rules = generateValidRules();

    // 2. 选择题型
    const rand = Math.random();
    let puzzleType: 'merge' | 'transform' | 'mixed';
    if (rand < 0.4) {
      puzzleType = 'merge';
    } else if (rand < 0.7) {
      puzzleType = 'transform';
    } else {
      puzzleType = 'mixed';
    }

    // 3. 选择 emoji pool
    const isMirror = rules.cellTransforms.some(t => t === 'mirror-h' || t === 'mirror-v');
    const isRotate = rules.cellTransforms.some(t =>
      ['rotate-cw-90', 'rotate-180', 'rotate-ccw-90'].includes(t)
    );

    let availableThemes: string[];
    if (isMirror && isRotate) {
      availableThemes = Object.keys(THEME_TRANSFORM_COMPAT).filter(
        k => THEME_TRANSFORM_COMPAT[k].mirror && THEME_TRANSFORM_COMPAT[k].rotate
      );
    } else if (isMirror) {
      availableThemes = Object.keys(THEME_TRANSFORM_COMPAT).filter(
        k => THEME_TRANSFORM_COMPAT[k].mirror
      );
    } else if (isRotate) {
      availableThemes = Object.keys(THEME_TRANSFORM_COMPAT).filter(
        k => THEME_TRANSFORM_COMPAT[k].rotate
      );
    } else {
      availableThemes = Object.keys(THEME_TRANSFORM_COMPAT);
    }

    const groupKey = randomChoice(availableThemes) as keyof typeof EMOJI_GROUPS;
    const emojiPool = [...EMOJI_GROUPS[groupKey]];

    // 4. 生成完整矩阵
    let buildFn: (rules: PuzzleRules, pool: string[]) => Matrix;
    switch (puzzleType) {
      case 'merge':  buildFn = buildMergeMatrix; break;
      case 'transform': buildFn = buildTransformMatrix; break;
      case 'mixed':  buildFn = buildMixedMatrix; break;
    }
    const matrix = buildFn(rules, shuffle([...emojiPool]));

    // 5. 选择要隐藏的单元格位置
    // 当前生成器的核心规律是“按行推导结果宫”，不是行列双向都成立。
    // 因此只能在最后一列（每行的结果宫）里挖空，避免把源宫挖掉导致题目不唯一或不可推。
    const hiddenPositions = pickHiddenPositions(matrix, puzzleType);
    if (hiddenPositions.length !== 4) {
      continue;
    }
    if (!hasRelatedDistractorPotential(matrix, hiddenPositions)) {
      continue;
    }
    if (!hasSalientTransformAtHiddenPositions(matrix, hiddenPositions)) {
      continue;
    }

    // 6. 生成候选项
    const { candidates, correctAnswers } = generateCandidates(matrix, hiddenPositions);

    return { matrix, hiddenPositions, candidates, rules, correctAnswers };
  }

  throw new Error('Failed to generate a solvable grid reasoning puzzle after 60 attempts');
}

// ── 选择隐藏位置 ──

function pickHiddenPositions(matrix: Matrix, puzzleType: 'merge' | 'transform' | 'mixed'): HiddenPosition[] {
  // 仍然保证：4 个空位、4 个 cellIdx 各一次、三行都覆盖。
  // 但不再把空位全钉死在第三列结果宫里，至少分散出 1 个到其他列。
  const hiddenPositions: HiddenPosition[] = [];

  const rowPool = shuffle([0, 1, 2]);
  const assignedRows = [...rowPool, rowPool[0]];

  // merge / mixed 先保守一点：3 个结果列 + 1 个前置列
  // transform 可以更分散：覆盖三列，再额外补 1 个随机列
  const targetColumns =
    puzzleType === 'transform'
      ? shuffle([0, 1, 2, randomChoice([0, 1, 2])])
      : shuffle([2, 2, 2, randomChoice([0, 1])]);

  const usedTriples = new Set<string>();

  for (let cellIdx = 0; cellIdx < 4; cellIdx++) {
    const preferredRow = assignedRows[cellIdx];
    const preferredCol = targetColumns[cellIdx];
    const candidateRows = [preferredRow, ...shuffle([0, 1, 2].filter((row) => row !== preferredRow))];
    const candidateCols = [preferredCol, ...shuffle([0, 1, 2].filter((col) => col !== preferredCol))];

    let picked = false;
    for (const row of candidateRows) {
      for (const col of candidateCols) {
        const key = `${row}-${col}-${cellIdx}`;
        const cell = matrix[row][col][cellIdx];
        if (cell.type !== 'emoji' || usedTriples.has(key)) continue;

        hiddenPositions.push({ row, col, cellIdx });
        usedTriples.add(key);
        picked = true;
        break;
      }
      if (picked) break;
    }

    if (!picked) {
      return [];
    }
  }

  return isHiddenSelectionSolvable(matrix, hiddenPositions, puzzleType) ? sortHiddenPositions(hiddenPositions) : [];
}

function isHiddenSelectionSolvable(_matrix: Matrix, hiddenPositions: HiddenPosition[], puzzleType: 'merge' | 'transform' | 'mixed'): boolean {
  if (hiddenPositions.length !== 4) return false;

  const rowSet = new Set<number>();
  const colSet = new Set<number>();
  const cellIdxSet = new Set<number>();
  for (const pos of hiddenPositions) {
    rowSet.add(pos.row);
    colSet.add(pos.col);
    cellIdxSet.add(pos.cellIdx);
  }

  if (rowSet.size !== 3 || cellIdxSet.size !== 4) return false;
  if (colSet.size < 2) return false; // 不允许 снова只挖在同一列

  if (puzzleType === 'transform') {
    return colSet.has(0) && colSet.has(1) && colSet.has(2);
  }

  return hiddenPositions.filter((pos) => pos.col === 2).length >= 3;
}

export function sortHiddenPositions(hiddenPositions: HiddenPosition[]): HiddenPosition[] {
  return [...hiddenPositions].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    return a.cellIdx - b.cellIdx;
  });
}

function hasRelatedDistractorPotential(matrix: Matrix, hiddenPositions: HiddenPosition[]): boolean {
  const correctKeySet = new Set(
    hiddenPositions
      .map((pos) => matrix[pos.row][pos.col][pos.cellIdx])
      .filter((cell): cell is CellContent => cell.type === 'emoji')
      .map((cell) => normalizeCell(cell))
  );

  return hiddenPositions.some((pos) => {
    const correctCell = matrix[pos.row][pos.col][pos.cellIdx];
    if (correctCell.type !== 'emoji') return false;
    const correctKey = normalizeCell(correctCell);

    for (let c = 0; c < 3; c++) {
      if (c === pos.col) continue;
      const cell = matrix[pos.row][c][pos.cellIdx];
      const nk = cell.type === 'emoji' ? normalizeCell(cell) : null;
      if (nk && nk !== correctKey && !correctKeySet.has(nk)) {
        return true;
      }
    }

    for (let r = 0; r < 3; r++) {
      if (r === pos.row) continue;
      const cell = matrix[r][pos.col][pos.cellIdx];
      const nk = cell.type === 'emoji' ? normalizeCell(cell) : null;
      if (nk && nk !== correctKey && !correctKeySet.has(nk)) {
        return true;
      }
    }

    return false;
  });
}

function hasSalientTransformAtHiddenPositions(matrix: Matrix, hiddenPositions: HiddenPosition[]): boolean {
  let transformedCount = 0;

  for (const pos of hiddenPositions) {
    const cell = matrix[pos.row][pos.col][pos.cellIdx];
    if (cell.type !== 'emoji') continue;

    const hasRotation = (cell.rotation || 0) !== 0;
    const hasMirror = (cell.mirror || 'none') !== 'none';
    if (hasRotation || hasMirror) {
      transformedCount += 1;
    }
  }

  return transformedCount >= 2;
}

// ── 生成候选项 ──

function generateCandidates(
  matrix: Matrix,
  hiddenPositions: HiddenPosition[]
): {
  candidates: Candidate[];
  correctAnswers: Map<string, string>;
} {
  const correctAnswers = new Map<string, string>();
  const candidateMap = new Map<string, CellContent>(); // normalizedKey → CellContent
  const correctCells: { pos: HiddenPosition; cell: CellContent }[] = [];
  const correctKeySet = new Set<string>();

  // 收集正确答案
  for (const pos of hiddenPositions) {
    const cell = matrix[pos.row][pos.col][pos.cellIdx];
    correctCells.push({ pos, cell });
    const nk = normalizeCell(cell);
    correctKeySet.add(nk);
    if (!candidateMap.has(nk)) {
      candidateMap.set(nk, cell);
    }
  }

  const hiddenSet = new Set(hiddenPositions.map(p => `${p.row}-${p.col}-${p.cellIdx}`));

  // 先补“同位置、同规则链”的近邻候选，避免出现无关项
  for (const { pos, cell: correctCell } of correctCells) {
    const relatedCells: CellContent[] = [];

    for (let c = 0; c < 3; c++) {
      if (c === pos.col) continue;
      const key = `${pos.row}-${c}-${pos.cellIdx}`;
      if (hiddenSet.has(key)) continue;
      const cell = matrix[pos.row][c][pos.cellIdx];
      if (cell.type === 'emoji') relatedCells.push(cell);
    }

    for (let r = 0; r < 3; r++) {
      if (r === pos.row) continue;
      const key = `${r}-${pos.col}-${pos.cellIdx}`;
      if (hiddenSet.has(key)) continue;
      const cell = matrix[r][pos.col][pos.cellIdx];
      if (cell.type === 'emoji') relatedCells.push(cell);
    }

    const correctKey = normalizeCell(correctCell);
    const distinctRelated = shuffle(relatedCells).filter((cell, index, arr) => {
      const nk = normalizeCell(cell);
      return nk !== correctKey && arr.findIndex((other) => normalizeCell(other) === nk) === index;
    });

    const guaranteedRelated = distinctRelated.find((cell) => !correctKeySet.has(normalizeCell(cell))) ?? distinctRelated[0];
    if (guaranteedRelated) {
      const nk = normalizeCell(guaranteedRelated);
      if (!candidateMap.has(nk)) {
        candidateMap.set(nk, guaranteedRelated);
      }
    }

    for (const cell of distinctRelated.filter((cell) => cell !== guaranteedRelated).slice(0, 2)) {
      const nk = normalizeCell(cell);
      if (!candidateMap.has(nk)) {
        candidateMap.set(nk, cell);
      }
    }
  }

  // 再生成“近似但不完全一样”的迷惑项
  for (const { cell } of correctCells) {
    if (cell.type !== 'emoji') continue;
    const numDist = 1 + Math.floor(Math.random() * 2); // 1-2 个干扰
    for (let i = 0; i < numDist; i++) {
      const dist = generateCellDistractor(cell);
      const nk = normalizeCell(dist);
      if (!candidateMap.has(nk)) {
        candidateMap.set(nk, dist);
      }
    }
  }

  // 若还不够，再从全盘补少量非隐藏项作为兜底，但避免过多无关项
  const otherCells: CellContent[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      for (let ci = 0; ci < 4; ci++) {
        if (!hiddenSet.has(`${r}-${c}-${ci}`)) {
          const cell = matrix[r][c][ci];
          if (cell.type === 'emoji') {
            otherCells.push(cell);
          }
        }
      }
    }
  }
  for (const cell of shuffle(otherCells).slice(0, 2)) {
    const nk = normalizeCell(cell);
    if (!candidateMap.has(nk)) {
      candidateMap.set(nk, cell);
    }
  }

  const minCandidateCount = 10;
  const maxCandidateCount = 12;

  const expandCandidatePool = () => {
    const baseCells = [
      ...correctCells.map(({ cell }) => cell),
      ...otherCells,
    ].filter((cell): cell is CellContent => cell.type === 'emoji');

    for (const baseCell of shuffle(baseCells)) {
      if (candidateMap.size >= minCandidateCount) break;

      for (let i = 0; i < 6 && candidateMap.size < minCandidateCount; i++) {
        const dist = generateCellDistractor(baseCell);
        const nk = normalizeCell(dist);
        if (!candidateMap.has(nk)) {
          candidateMap.set(nk, dist);
        }
      }
    }
  };

  if (candidateMap.size < minCandidateCount) {
    expandCandidatePool();
  }

  // 确保候选项数量在 10-12 之间，避免 4 空位把候选区撑太大
  const targetCount = Math.min(maxCandidateCount, Math.max(minCandidateCount, candidateMap.size));

  // 构建最终列表: 正确答案一定包含
  const correctKeys = new Set<string>();
  for (const { cell } of correctCells) {
    correctKeys.add(normalizeCell(cell));
  }

  const correctList = Array.from(candidateMap.entries())
    .filter(([k]) => correctKeys.has(k))
    .map(([, v]) => v);
  const distractorList = shuffle(
    Array.from(candidateMap.entries())
      .filter(([k]) => !correctKeys.has(k))
      .map(([, v]) => v)
  );

  const numDistractors = Math.max(0, targetCount - correctList.length);
  const finalCells = shuffle([...correctList, ...distractorList.slice(0, numDistractors)]);

  // 分配 ID (A, B, C...)
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const candidates: Candidate[] = finalCells.map((content, i) => ({
    id: labels[i] || `X${i}`,
    content,
  }));

  // 建立正确答案映射
  for (const { pos, cell } of correctCells) {
    const cellKey = normalizeCell(cell);
    const match = candidates.find(c => normalizeCell(c.content) === cellKey);
    if (match) {
      correctAnswers.set(`${pos.row}-${pos.col}-${pos.cellIdx}`, match.id);
    }
  }

  return { candidates, correctAnswers };
}

// ── 单 cell 干扰项 ──

function generateCellDistractor(cell: CellContent): CellContent {
  if (cell.type !== 'emoji') return cell;

  const mutationType = Math.floor(Math.random() * 3);

  switch (mutationType) {
    case 0: {
      // 旋转变换
      const rotations: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
      const currentRot = cell.rotation || 0;
      const otherRots = rotations.filter(r => r !== currentRot);
      const newRot = otherRots[Math.floor(Math.random() * otherRots.length)];
      return { ...cell, rotation: newRot };
    }
    case 1: {
      // 缩放变换
      return { ...cell, scaled: !cell.scaled };
    }
    case 2: {
      // 替换 emoji
      const allEmojis = new Set<string>();
      for (const group of Object.values(EMOJI_GROUPS)) {
        for (const emoji of group) allEmojis.add(emoji);
      }
      const emojiList = Array.from(allEmojis).filter(e => e !== cell.emoji);
      if (emojiList.length > 0) {
        const newEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
        return { ...cell, emoji: newEmoji };
      }
      return { ...cell, scaled: !cell.scaled };
    }
    default:
      return cell;
  }
}

// ── 检查答案 ──

export function checkReasoningAnswer(
  puzzle: ReasoningPuzzle,
  userAnswers: Map<string, string> // "row-col-cellIdx" → candidate id
): {
  correct: number;
  total: number;
  details: (HiddenPosition & { correct: boolean })[];
} {
  const details: (HiddenPosition & { correct: boolean })[] = [];
  let correct = 0;
  const total = puzzle.hiddenPositions.length;

  for (const pos of puzzle.hiddenPositions) {
    const key = `${pos.row}-${pos.col}-${pos.cellIdx}`;
    const userAnswer = userAnswers.get(key);
    const correctAnswer = puzzle.correctAnswers.get(key);

    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) correct++;

    details.push({ ...pos, correct: isCorrect });
  }

  return { correct, total, details };
}
