import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, Target, Frown, Clock, Trash2, Hand } from 'lucide-react';
import Layout from '../components/Layout';
import {
  generateReasoningPuzzle,
  checkReasoningAnswer,
  type ReasoningPuzzle,
  type HiddenPosition,
} from '../lib/grid-reasoning-engine';
import { type CellContent, describeAnalysis } from '../lib/grid-engine';

// ── Cell Renderer ──
// Reused from MemoryGrid.tsx

function BrokenImageIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`w-full h-full text-gray-400 dark:text-gray-500 ${className}`}
    >
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <path
        d="M2 17l5.5-5.5 3 3 5-5L22 16"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function sortHiddenPositions(positions: HiddenPosition[]): HiddenPosition[] {
  return [...positions].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    if (a.col !== b.col) return a.col - b.col;
    return a.cellIdx - b.cellIdx;
  });
}

function CellRenderer({
  content,
  size = 'normal',
}: {
  content: CellContent | null;
  size?: 'normal' | 'small' | 'option';
}) {
  const variant = size === 'option' ? 'normal' : size;
  if (!content) {
    return <div className="w-full h-full" />;
  }

  if (content.type === 'blank') {
    return <div className="w-full h-full" />;
  }

  if (content.type === 'broken') {
    const brokenSize = variant === 'small' ? '28px' : '40px';
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: brokenSize, height: brokenSize }}>
          <BrokenImageIcon />
        </div>
      </div>
    );
  }

  if (content.type === 'pass') {
    const passSize = variant === 'small' ? '2.0rem' : '2.6rem';
    return (
      <div
        className="w-full h-full flex items-center justify-center leading-none"
        style={{ fontSize: passSize }}
      >
        🔍
      </div>
    );
  }

  const rotation = content.rotation || 0;
  const mirror = content.mirror || 'none';
  const scaled = content.scaled || false;
  const grown = content.grown || false;

  let transform = '';
  if (rotation !== 0) transform += `rotate(${rotation}deg) `;
  if (mirror === 'horizontal') transform += 'scaleX(-1) ';
  if (mirror === 'vertical') transform += 'scaleY(-1) ';

  const fontSize =
    variant === 'small'
      ? grown
        ? '2.3rem'
        : scaled
          ? '1.15rem'
          : '1.9rem'
      : grown
        ? '3.4rem'
        : scaled
          ? '1.5rem'
          : '2.6rem';

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden select-none"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div
        className="flex items-center justify-center leading-none select-none"
        draggable={false}
        style={{
          width: variant === 'small' ? '78%' : '72%',
          height: variant === 'small' ? '78%' : '72%',
          fontSize,
          transform: transform.trim() || undefined,
          transformOrigin: 'center center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {content.emoji}
      </div>
    </div>
  );
}

// ── Main Component ──

type GamePhase = 'playing' | 'result';

export default function GridReasoning() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>('playing');
  const [puzzle, setPuzzle] = useState<ReasoningPuzzle | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; cellIdx: number } | null>(null);
  const [draggingCandidateId, setDraggingCandidateId] = useState<string | null>(null);
  const [touchDrag, setTouchDrag] = useState<{ candidateId: string; x: number; y: number } | null>(null);
  const [lastPlacedKey, setLastPlacedKey] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Map<string, string>>(new Map());
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef<number | null>(null);
  const touchDragStartRef = useRef<{ candidateId: string; x: number; y: number } | null>(null);
  const touchDragHoldTimerRef = useRef<number | null>(null);

  // 初始化游戏
  useEffect(() => {
    setPuzzle(generateReasoningPuzzle());
  }, []);

  // 计时器（向上计时）
  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  if (!puzzle) {
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`}>
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">加载中...</div>
      </Layout>
    );
  }

  const moveToNextEmpty = (answers: Map<string, string>) => {
    const nextEmpty = sortHiddenPositions(puzzle.hiddenPositions).find((pos) => {
      const k = `${pos.row}-${pos.col}-${pos.cellIdx}`;
      return !answers.has(k);
    });

    if (nextEmpty) {
      setSelectedCell(nextEmpty);
    }
  };

  const fillSelectedCell = (candidateId: string, targetCell = selectedCell) => {
    if (!targetCell) return;

    const key = `${targetCell.row}-${targetCell.col}-${targetCell.cellIdx}`;
    const newAnswers = new Map(userAnswers);
    newAnswers.set(key, candidateId);
    setUserAnswers(newAnswers);
    setLastPlacedKey(key);

    moveToNextEmpty(newAnswers);

    window.setTimeout(() => {
      setLastPlacedKey((current) => (current === key ? null : current));
    }, 600);
  };

  // 点击隐藏的内部单元格 → 选中；再次点击当前格则取消选中
  const handleCellClick = (row: number, col: number, cellIdx: number) => {
    const nextCell = { row, col, cellIdx };
    const isSameCell =
      selectedCell?.row === row &&
      selectedCell?.col === col &&
      selectedCell?.cellIdx === cellIdx;

    setSelectedCell(isSameCell ? null : nextCell);
  };

  // 点击候选项 → 仅作为一次性动作，不保留候选项选中态
  const handleCandidateClick = (candidateId: string) => {
    if (selectedCell) {
      fillSelectedCell(candidateId, selectedCell);
    }
  };

  const clearCellAnswer = (targetCell: { row: number; col: number; cellIdx: number } | null = selectedCell) => {
    if (!targetCell) return;
    const key = `${targetCell.row}-${targetCell.col}-${targetCell.cellIdx}`;
    if (!userAnswers.has(key)) return;
    const next = new Map(userAnswers);
    next.delete(key);
    setUserAnswers(next);
    setLastPlacedKey(key);
    window.setTimeout(() => {
      setLastPlacedKey((current) => (current === key ? null : current));
    }, 400);
  };

  const handleDropCandidate = (candidateId: string, row: number, col: number, cellIdx: number) => {
    const nextCell = { row, col, cellIdx };
    setSelectedCell(nextCell);
    fillSelectedCell(candidateId, nextCell);
    setDraggingCandidateId(null);
    setTouchDrag(null);
  };

  const clearPendingTouchDrag = () => {
    if (touchDragHoldTimerRef.current) {
      window.clearTimeout(touchDragHoldTimerRef.current);
      touchDragHoldTimerRef.current = null;
    }
    touchDragStartRef.current = null;
  };

  const startTouchDragHold = (candidateId: string, clientX: number, clientY: number) => {
    clearPendingTouchDrag();
    touchDragStartRef.current = { candidateId, x: clientX, y: clientY };
    touchDragHoldTimerRef.current = window.setTimeout(() => {
      const pending = touchDragStartRef.current;
      if (!pending) return;
      setDraggingCandidateId(pending.candidateId);
      setTouchDrag({ candidateId: pending.candidateId, x: pending.x, y: pending.y });
      touchDragHoldTimerRef.current = null;
    }, 180);
  };

  const handleTouchDragMove = (candidateId: string, clientX: number, clientY: number) => {
    const pending = touchDragStartRef.current;

    if (!touchDrag && pending && pending.candidateId === candidateId) {
      const deltaX = clientX - pending.x;
      const deltaY = clientY - pending.y;
      if (Math.hypot(deltaX, deltaY) > 12) {
        clearPendingTouchDrag();
      }
      return;
    }

    if (touchDrag?.candidateId === candidateId) {
      setDraggingCandidateId(candidateId);
      setTouchDrag({ candidateId, x: clientX, y: clientY });
    }
  };

  const handleTouchDragEnd = (clientX: number, clientY: number) => {
    clearPendingTouchDrag();

    const candidateId = touchDrag?.candidateId || draggingCandidateId;
    if (candidateId) {
      const dropTarget = document.elementFromPoint(clientX, clientY)?.closest('[data-drop-cell]');
      const row = dropTarget?.getAttribute('data-row');
      const col = dropTarget?.getAttribute('data-col');
      const cellIdx = dropTarget?.getAttribute('data-cell-idx');

      if (row !== null && row !== undefined && col !== null && col !== undefined && cellIdx !== null && cellIdx !== undefined) {
        handleDropCandidate(candidateId, Number(row), Number(col), Number(cellIdx));
        return;
      }
    }

    setDraggingCandidateId(null);
    setTouchDrag(null);
  };

  // 提交答案
  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('result');
  };

  // 是否所有内部单元格都填了
  const allFilled = puzzle.hiddenPositions.every((pos) => {
    const key = `${pos.row}-${pos.col}-${pos.cellIdx}`;
    return userAnswers.has(key);
  });

  // ── Render Playing Phase ──

  const renderPlaying = () => {
    // 给每个隐藏的内部单元格分配序号：宫之间行优先，宫内也行优先
    const hiddenPositionsWithIndex = sortHiddenPositions(puzzle.hiddenPositions).map((pos, index) => ({
      ...pos,
      index: index + 1,
    }));

    return (
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 select-none"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        {/* 标题 + 计时器 */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">宫格推理</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">观察规律，填入正确答案</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1"><Hand className="w-3 h-3" /> 先点空位再点候选，或直接拖拽到空格里</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[32rem_23rem] gap-6 lg:gap-8 items-start justify-center touch-pan-y">
          {/* 左侧题盘 + 提交 */}
          <div className="min-w-0 w-full max-w-lg mx-auto lg:mx-0 lg:w-[32rem] lg:max-w-[32rem]">
            <div className="grid grid-cols-3 gap-2 w-full">
              {puzzle.matrix.map((row, rowIdx) =>
                row.map((miniGrid, colIdx) => {
                  const key = `${rowIdx}-${colIdx}`;

                  return (
                    <div
                      key={key}
                      className="aspect-square rounded-lg border-[3px] border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800 relative overflow-hidden"
                      style={{ containerType: 'inline-size' }}
                    >
                      <div className="absolute inset-0 pointer-events-none z-20">
                        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
                        <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
                      </div>
                      {/* 渲染 2×2 mini-grid */}
                      <div className="relative z-10 grid grid-cols-2 grid-rows-2 w-full h-full">
                        {miniGrid.map((cell, cellIdx) => {
                      const hiddenInfo = hiddenPositionsWithIndex.find(
                        (h) => h.row === rowIdx && h.col === colIdx && h.cellIdx === cellIdx
                      );
                      const isHidden = !!hiddenInfo;
                      const isSelected =
                        selectedCell?.row === rowIdx &&
                        selectedCell?.col === colIdx &&
                        selectedCell?.cellIdx === cellIdx;
                      const cellKey = `${rowIdx}-${colIdx}-${cellIdx}`;
                      const userAnswer = userAnswers.get(cellKey);
                      const isJustPlaced = lastPlacedKey === cellKey;

                        return (
                          <div
                            key={cellIdx}
                            data-drop-cell={isHidden ? 'true' : undefined}
                            data-row={isHidden ? rowIdx : undefined}
                            data-col={isHidden ? colIdx : undefined}
                            data-cell-idx={isHidden ? cellIdx : undefined}
                            onClick={() => isHidden && handleCellClick(rowIdx, colIdx, cellIdx)}
                            onDragOver={(e) => {
                              if (!isHidden) return;
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              if (!isHidden) return;
                              e.preventDefault();
                              const candidateId = e.dataTransfer.getData('text/plain') || draggingCandidateId;
                              if (candidateId) {
                                handleDropCandidate(candidateId, rowIdx, colIdx, cellIdx);
                              }
                            }}
                            className={`w-full h-full min-w-0 min-h-0 flex items-center justify-center relative overflow-hidden z-10 ${
                              isHidden ? 'cursor-pointer' : ''
                            }`}
                          >
                            {isHidden ? (
                              <div
                                className={`absolute inset-0 flex items-center justify-center transition-all z-10 ${
                                  isSelected
                                    ? 'bg-blue-100/85 dark:bg-blue-900/40 ring-2 ring-blue-500 ring-inset'
                                    : 'bg-emerald-100/85 dark:bg-emerald-900/20'
                                } ${isJustPlaced ? 'scale-95 ring-2 ring-emerald-500 ring-inset' : ''}`}
                              >
                                {userAnswer ? (
                                  // 显示用户选择的候选项
                                  <>
                                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                                      <CellRenderer
                                        content={
                                          puzzle.candidates.find((c) => c.id === userAnswer)?.content || null
                                        }
                                        size="normal"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const targetCell = { row: rowIdx, col: colIdx, cellIdx };
                                        setSelectedCell(targetCell);
                                        clearCellAnswer(targetCell);
                                      }}
                                      className="absolute top-0.5 right-0.5 z-30 w-5 h-5 rounded-full bg-white/90 dark:bg-gray-800/90 border border-red-300 text-red-500 flex items-center justify-center"
                                      aria-label="清空这个答案"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  // 显示序号徽章
                                  <div className="relative z-10 w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                                    <span className="text-lg font-black text-white leading-none">
                                      {hiddenInfo.index}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <CellRenderer content={cell} size="normal" />
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 提交按钮（桌面端保留在左侧题盘下） */}
            <div className="hidden lg:block text-center mt-5">
              <button
                onClick={handleSubmit}
                disabled={!allFilled}
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                提交答案
              </button>
              {!allFilled && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  还有 {puzzle.hiddenPositions.length - userAnswers.size} 个格子未填
                </p>
              )}
            </div>
          </div>

          {/* 候选项网格 */}
          <div className="w-full max-w-md mx-auto px-5 sm:px-8 lg:px-0 lg:mx-0 lg:w-[21.5rem] lg:max-w-[21.5rem]">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center lg:text-left">
              候选答案
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-1.5 sm:gap-2 max-w-xl mx-auto lg:mx-0 lg:max-w-none">
              {puzzle.candidates.map((candidate) => {
                const isUsed = Array.from(userAnswers.values()).includes(candidate.id);
                return (
                  <button
                    key={candidate.id}
                    onClick={() => handleCandidateClick(candidate.id)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', candidate.id);
                      setDraggingCandidateId(candidate.id);
                    }}
                    onDragEnd={() => setDraggingCandidateId(null)}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      if (!touch) return;
                      startTouchDragHold(candidate.id, touch.clientX, touch.clientY);
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      if (!touch) return;
                      if (touchDrag?.candidateId === candidate.id) {
                        e.preventDefault();
                      }
                      handleTouchDragMove(candidate.id, touch.clientX, touch.clientY);
                    }}
                    onTouchEnd={(e) => {
                      const touch = e.changedTouches[0];
                      if (!touch) {
                        clearPendingTouchDrag();
                        setDraggingCandidateId(null);
                        setTouchDrag(null);
                        return;
                      }
                      handleTouchDragEnd(touch.clientX, touch.clientY);
                    }}
                    onTouchCancel={() => {
                      clearPendingTouchDrag();
                      setDraggingCandidateId(null);
                      setTouchDrag(null);
                    }}
                    className={`aspect-square rounded-md border transition relative select-none ${
                      isUsed
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-70'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-400 cursor-grab'
                    } ${draggingCandidateId === candidate.id ? 'scale-95 opacity-60' : ''}`}
                    style={{
                      containerType: 'inline-size',
                      touchAction: 'pan-y',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                    }}
                  >
                    {/* 标签 */}
                    <div className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10">
                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        {candidate.id}
                      </span>
                    </div>
                    <div className="w-full h-full flex items-center justify-center p-[3.5%] sm:p-[4%]">
                      <CellRenderer content={candidate.content} size="normal" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 提交按钮（移动端放到候选区后） */}
            <div className="lg:hidden text-center mt-5">
              <button
                onClick={handleSubmit}
                disabled={!allFilled}
                className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                提交答案
              </button>
              {!allFilled && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  还有 {puzzle.hiddenPositions.length - userAnswers.size} 个格子未填
                </p>
              )}
            </div>
          </div>
        </div>

        {touchDrag && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: touchDrag.x,
              top: touchDrag.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-16 h-16 rounded-xl border-2 border-emerald-400 bg-white/95 dark:bg-gray-800/95 shadow-2xl flex items-center justify-center">
              <CellRenderer
                content={puzzle.candidates.find((candidate) => candidate.id === touchDrag.candidateId)?.content || null}
                size="option"
              />
            </div>
          </div>
        )}

      </div>
    );
  };

  // ── Render Result Phase ──

  const renderResult = () => {
    const result = checkReasoningAnswer(puzzle, userAnswers);
    const accuracy = Math.round((result.correct / result.total) * 100);

    const resultColor =
      accuracy === 100
        ? 'text-emerald-500'
        : accuracy >= 75
        ? 'text-green-500'
        : accuracy >= 50
        ? 'text-amber-500'
        : 'text-red-500';
    const resultBg =
      accuracy === 100
        ? 'bg-emerald-100 dark:bg-emerald-900/30'
        : accuracy >= 75
        ? 'bg-green-100 dark:bg-green-900/30'
        : accuracy >= 50
        ? 'bg-amber-100 dark:bg-amber-900/30'
        : 'bg-red-100 dark:bg-red-900/30';
    const ResultIcon = accuracy === 100 ? Trophy : accuracy >= 50 ? Target : Frown;

    return (
      <div className="max-w-lg mx-auto">
        {/* 成绩摘要 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center justify-center w-11 h-11 rounded-full ${resultBg}`}>
            <ResultIcon className={`w-6 h-6 ${resultColor}`} />
          </div>
          <div>
            <span className={`text-3xl font-bold ${resultColor}`}>{accuracy}%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
              答对 {result.correct}/{result.total}
            </span>
          </div>
          <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
          </div>
        </div>

        {/* 结果矩阵 */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {puzzle.matrix.map((row, rowIdx) =>
            row.map((miniGrid, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;

              return (
                <div
                  key={key}
                  className="aspect-square rounded-lg border-[3px] border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800 relative overflow-hidden"
                  style={{ containerType: 'inline-size' }}
                >
                  {/* 渲染 2×2 mini-grid，标记每个内部单元格的正确性 */}
                  <div className="relative grid grid-cols-2 w-full h-full">
                    {/* 虚线十字分隔线 */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
                      <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
                    </div>
                    {miniGrid.map((cell, cellIdx) => {
                      const detail = result.details.find(
                        (d) => d.row === rowIdx && d.col === colIdx && d.cellIdx === cellIdx
                      );
                      const isHidden = !!detail;
                      const cellKey = `${rowIdx}-${colIdx}-${cellIdx}`;
                      const userAnswer = userAnswers.get(cellKey);

                      return (
                        <div
                          key={cellIdx}
                          className={`flex items-center justify-center aspect-square relative z-10 ${
                            isHidden
                              ? detail.correct
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                              : ''
                          }`}
                        >
                          {/* 正确性标记 */}
                          {isHidden && (
                            <div className="absolute top-0.5 right-0.5 z-20">
                              {detail.correct ? (
                                <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={3} />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" strokeWidth={3} />
                              )}
                            </div>
                          )}
                          {/* 显示正确答案 */}
                          <CellRenderer content={cell} size="normal" />
                          {/* 如果错误，显示用户答案 */}
                          {isHidden && !detail.correct && userAnswer && (
                            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 border-t border-red-300 px-1 py-0.5">
                              <div className="text-[7px] text-gray-500 dark:text-gray-400 leading-tight mb-0.5">
                                你填的:
                              </div>
                              <div className="h-6 flex items-center justify-center">
                                <CellRenderer
                                  content={
                                    puzzle.candidates.find((c) => c.id === userAnswer)?.content || null
                                  }
                                  size="small"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 解析 */}
        <div className="mb-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">完整规律：</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 indent-8">
              {describeAnalysis(puzzle.rules)}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setPuzzle(generateReasoningPuzzle());
              setPhase('playing');
              setUserAnswers(new Map());
              setSelectedCell(null);
              setDraggingCandidateId(null);
              setTouchDrag(null);
              setLastPlacedKey(null);
              setElapsedTime(0);
            }}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            再玩一题
          </button>
          <button
            onClick={() => navigate(`/${userId}/brain`)}
            className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            返回选择
          </button>
        </div>
      </div>
    );
  };

  // ── Main Render ──

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-4xl">
      {phase === 'playing' ? renderPlaying() : renderResult()}
    </Layout>
  );
}
