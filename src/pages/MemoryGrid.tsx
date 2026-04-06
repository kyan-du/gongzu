import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, Target, Frown, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import { generatePuzzle, checkAnswer, describeAnalysis, generateMnemonic, type GamePuzzle, type CellContent, type MiniGrid, type Matrix, type PuzzleRules } from '../lib/grid-engine';

type GamePhase = 'watch1' | 'answer1' | 'watch2' | 'answer2' | 'result';

// 各类图形的尺寸定义 — 都基于宫格象限大小独立调整
const CELL_SIZES = {
  emoji: {
    normal: '3.2rem',
    scaled: '1.8rem',
    grown: '4.2rem',
    normalOffset: { x: 0, y: 0 },
    scaledOffset: { x: 0, y: 0 },
    rotationOffset: { x: 0, y: 0 },
    mirrorOffset: { x: 0, y: 0 },
  },
  broken: {
    size: '50px',
    offset: { x: 0, y: 0 },
  },
  question: {
    fontSize: '3.2rem',
    subSize: '0.4em',
    offset: { x: 5, y: -4 },
  },
  grid: {
    boxSize: 120,
    gap: 8,
    dashWidth: 2,
  },
  small: {
    emoji: {
      normal: '2.0rem',
      scaled: '1.2rem',
      grown: '2.5rem',
    },
    broken: {
      size: '28px',
    },
    question: {
      fontSize: '1.5rem',
      subSize: '0.4em',
    },
  },
} as const;
function BrokenImageIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`w-full h-full text-gray-400 dark:text-gray-500 ${className}`}>
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <path d="M2 17l5.5-5.5 3 3 5-5L22 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 渲染单个 Cell（带变换）— 各类图形独立尺寸
function CellRenderer({ content, size = 'normal', index }: { content: CellContent | null; size?: 'normal' | 'small'; index?: number }) {
  // null = 未作答，显示 ?N
  if (!content) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-600 font-bold" style={{ fontSize: '1.4rem' }}>
          ?{index !== undefined ? <sub style={{ fontSize: '0.75rem' }}>{index + 1}</sub> : ''}
        </span>
      </div>
    );
  }
  if (content.type === 'blank') {
    return <div className="w-full h-full" />;
  }

  if (content.type === 'broken') {
    const brokenSize = size === 'small' ? CELL_SIZES.small.broken.size : CELL_SIZES.broken.size;
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: brokenSize, height: brokenSize }}>
          <BrokenImageIcon />
        </div>
      </div>
    );
  }

  if (content.type === 'pass') {
    const passSize = size === 'small' ? CELL_SIZES.small.emoji.normal : CELL_SIZES.emoji.normal;
    return (
      <div className="w-full h-full flex items-center justify-center leading-none" style={{ fontSize: passSize }}>
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

  // emoji 大小：正常 vs 缩小 vs 放大，各有独立定义
  const sizeConfig = size === 'small' ? CELL_SIZES.small.emoji : CELL_SIZES.emoji;
  const fontSize = grown ? sizeConfig.grown : scaled ? sizeConfig.scaled : sizeConfig.normal;

  return (
    <div
      className="w-full h-full flex items-center justify-center leading-none overflow-hidden"
      style={{
        fontSize,
        transform: transform.trim() || undefined,
      }}
    >
      {content.emoji}
    </div>
  );
}

// 渲染 2×2 MiniGrid — 带虚线十字分隔（贯穿全格）
function MiniGridRenderer({ grid, size = 'normal' }: { grid: MiniGrid; size?: 'normal' | 'small' }) {
  return (
    <div className="relative grid grid-cols-2 w-full h-full">
      {/* 虚线十字分隔线 — 贯穿 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
        <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
      </div>
      {grid.map((cell, i) => (
        <div key={i} className="flex items-center justify-center aspect-square relative z-10">
          <CellRenderer content={cell} size={size} />
        </div>
      ))}
    </div>
  );
}

// ── Debug Fixture ──
// URL: ?debug=fixture&phase=result  → 跳过游戏直接看结果页
function buildFixturePuzzle(): GamePuzzle {
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

function buildFixtureAnswers(puzzle: GamePuzzle) {
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

export default function MemoryGrid() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isFixture = searchParams.get('debug') === 'fixture';
  const initialPhase = (searchParams.get('phase') as GamePhase) || 'watch1';
  const examMode = searchParams.get('mode') === 'exam';
  const quizId = searchParams.get('quizId');

  // Fixture data (stable across renders)
  const fixtureData = useMemo(() => {
    if (!isFixture) return null;
    const p = buildFixturePuzzle();
    const a = buildFixtureAnswers(p);
    return { puzzle: p, ...a };
  }, [isFixture]);

  const [phase, setPhase] = useState<GamePhase>(isFixture ? initialPhase : 'watch1');
  const [puzzle, setPuzzle] = useState<GamePuzzle | null>(isFixture ? fixtureData!.puzzle : null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [phase1Answers, setPhase1Answers] = useState<CellContent[]>(isFixture ? fixtureData!.phase1Answers : []);
  const [phase2Answers, setPhase2Answers] = useState<CellContent[]>(isFixture ? fixtureData!.phase2Answers : []);
  const [startTime] = useState(Date.now());

  // 每日进度（从 API 获取）
  const [dailyCompleted, setDailyCompleted] = useState(0);

  const timerRef = useRef<number | null>(null);
  const dragDroppedRef = useRef(false);
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);

  // 获取今日进度
  useEffect(() => {
    if (!userId) return;
    const today = new Date().toLocaleDateString('sv-SE');

    fetch(`/api/memory-game?userId=${userId}&date=${today}&type=grid`)
      .then((r) => r.json())
      .then((data: any) => setDailyCompleted(data.completed || 0))
      .catch(() => {});

  }, [userId]);

  // 初始化游戏（fixture 模式跳过）
  useEffect(() => {
    if (!isFixture) setPuzzle(generatePuzzle());
  }, [isFixture]);

  // 倒计时（fixture 的 result 阶段不启动）
  const timeUpRef = useRef(false);

  useEffect(() => {
    if (phase === 'result') return;
    if (isFixture && initialPhase === 'result') return;
    timeUpRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          timeUpRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // 时间到了，自动进入下一阶段（在 render cycle 外处理）
  useEffect(() => {
    if (timeLeft !== 0 || !timeUpRef.current) return;
    timeUpRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === 'watch1') { setPhase('answer1'); setTimeLeft(90); }
    else if (phase === 'answer1') { handlePhase1Submit(); }
    else if (phase === 'watch2') { setPhase('answer2'); setTimeLeft(90); }
    else if (phase === 'answer2') { handlePhase2Submit(); }
  }, [timeLeft]);

  // 找下一个未填的位置
  const findNextEmpty = (answers: (CellContent | null)[], fromIndex: number, max: number): number => {
    // 从 fromIndex+1 开始往后找
    for (let i = fromIndex + 1; i < max; i++) {
      if (!answers[i]) return i;
    }
    // 往前找（环绕）
    for (let i = 0; i < fromIndex; i++) {
      if (!answers[i]) return i;
    }
    // 全满了，留在原地
    return fromIndex;
  };

  // 选择备选项
  const selectChoice = (content: CellContent) => {
    if (phase === 'answer1') {
      if (currentAnswerIndex >= 4) return;
      const newAnswers = [...phase1Answers];
      newAnswers[currentAnswerIndex] = content;
      setPhase1Answers(newAnswers);
      const next = findNextEmpty(newAnswers, currentAnswerIndex, 4);
      setCurrentAnswerIndex(next);
    } else if (phase === 'answer2') {
      if (currentAnswerIndex >= 8) return;
      const newAnswers = [...phase2Answers];
      newAnswers[currentAnswerIndex] = content;
      setPhase2Answers(newAnswers);
      const next = findNextEmpty(newAnswers, currentAnswerIndex, 8);
      setCurrentAnswerIndex(next);
    }
  };

  // 点击已填格子重选
  const deselectAnswer = (index: number) => {
    if (phase === 'answer1') {
      const newAnswers = [...phase1Answers];
      newAnswers[index] = null as any;
      setPhase1Answers(newAnswers);
      setCurrentAnswerIndex(index);
    } else if (phase === 'answer2') {
      const newAnswers = [...phase2Answers];
      newAnswers[index] = null as any;
      setPhase2Answers(newAnswers);
      setCurrentAnswerIndex(index);
    }
  };

  // 提交阶段一
  const handlePhase1Submit = () => {
    setPhase('watch2');
    setTimeLeft(90);
    setCurrentAnswerIndex(0);
  };

  // 提交阶段二
  const handlePhase2Submit = () => {
    setPhase('result');
    if (timerRef.current) clearInterval(timerRef.current);

    // 提交成绩到 API（fixture 模式不提交）
    if (!puzzle) return;
    if (isFixture) return;
    const phase1Result = checkAnswer(puzzle.matrix, puzzle.phase1Hidden, phase1Answers as MiniGrid);
    const phase2Result1 = checkAnswer(puzzle.matrix, puzzle.phase2Hidden[0], [
      phase2Answers[0],
      phase2Answers[1],
      phase2Answers[2],
      phase2Answers[3],
    ] as MiniGrid);
    const phase2Result2 = checkAnswer(puzzle.matrix, puzzle.phase2Hidden[1], [
      phase2Answers[4],
      phase2Answers[5],
      phase2Answers[6],
      phase2Answers[7],
    ] as MiniGrid);

    const totalCorrect = phase1Result.correct + phase2Result1.correct + phase2Result2.correct;
    const totalQuestions = 12;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
    const durationSec = Math.round((Date.now() - startTime) / 1000);

    const cellTransformsCount = puzzle.rules.cellTransforms.filter(t => t !== 'none').length;
    const detail = {
      phase1: { correct: phase1Result.correct, total: 4 },
      phase2: {
        correct: phase2Result1.correct + phase2Result2.correct,
        total: 8,
      },
      rule: `cellTransforms:${cellTransformsCount}+${puzzle.rules.positionTransform}+${puzzle.rules.sizeTransform}`,
    };

    // Exam mode: submit to exam endpoint
    if (examMode && quizId) {
      fetch('/api/memory-game/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quizId,
          total: totalQuestions,
          correct: totalCorrect,
          accuracy,
          durationSec,
          detail: JSON.stringify(detail),
        }),
      })
        .then((r) => r.json())
        .then((data: any) => setDailyCompleted(data.alreadySubmitted ? dailyCompleted : dailyCompleted + 1))
        .catch(() => {});
      return;
    }

    // Training mode: no recording
  };

  if (!puzzle) {
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/home`}>
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">加载中...</div>
      </Layout>
    );
  }

  // 渲染 3×3 矩阵 — 独立方块 + 间距 + 粗边框
  const renderMatrix = (hidePhase1: boolean, hidePhase2: boolean, matrixOverride?: Matrix, hiddenOverride?: { row: number; col: number }[]) => {
    const mat = matrixOverride || puzzle.matrix;
    const hiddenCells = hiddenOverride || [
      ...(hidePhase1 ? [puzzle.phase1Hidden] : []),
      ...(hidePhase2 ? puzzle.phase2Hidden : []),
    ];
    let hiddenCounter = 0;
    return (
      <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto select-none">
        {mat.map((row, rowIdx) =>
          row.map((miniGrid, colIdx) => {
            const isHidden = hiddenCells.some((h) => h.row === rowIdx && h.col === colIdx);
            if (isHidden) hiddenCounter++;

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="aspect-square flex items-center justify-center rounded-lg border-[3px] border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800 relative overflow-hidden"
                style={{ containerType: 'inline-size' }}
              >
                {/* 虚线十字分隔线 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
                  <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
                </div>
                {isHidden ? (
                  <div className="grid grid-cols-2 w-full h-full relative z-10">
                    {[1, 2, 3, 4].map((n) => {
                      // 按矩阵从上到下、从左到右的顺序编号：第一个隐藏格 1-4，第二个 5-8
                      const baseNum = (hiddenCounter - 1) * 4;
                      return (
                      <div key={n} className="flex items-center justify-center overflow-hidden">
                        <span className="font-black text-gray-800 dark:text-gray-200" style={{
                          fontSize: CELL_SIZES.question.fontSize,
                          lineHeight: '1',
                          transform: `translate(${CELL_SIZES.question.offset.x}px, ${CELL_SIZES.question.offset.y}px)`,
                        }}>
                          ?<sub style={{ fontSize: CELL_SIZES.question.subSize }}>{baseNum + n}</sub>
                        </span>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <MiniGridRenderer grid={miniGrid} />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  // 渲染答题界面 — 纯记忆：一排连续格子 + 大备选池
  const renderAnswerInterface = (isPhase1: boolean) => {
    const totalCells = isPhase1 ? 4 : 8;
    const answers = isPhase1 ? phase1Answers : phase2Answers;

    // 所有待填格子按编号排成一排
    const slots = Array.from({ length: totalCells }, (_, i) => i);

    // 拖拽处理
    const handleDragStart = (e: React.DragEvent, choice: CellContent, sourceIndex?: number) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ choice, sourceIndex }));
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault();
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.choice) {
          if (isPhase1) {
            const newAnswers = [...phase1Answers];
            // 如果拖拽来源是另一个答案格，先清空那个格
            if (data.sourceIndex !== undefined && data.sourceIndex !== slotIndex) {
              newAnswers[data.sourceIndex] = null as any;
            }
            newAnswers[slotIndex] = data.choice;
            setPhase1Answers(newAnswers);
          } else {
            const newAnswers = [...phase2Answers];
            if (data.sourceIndex !== undefined && data.sourceIndex !== slotIndex) {
              newAnswers[data.sourceIndex] = null as any;
            }
            newAnswers[slotIndex] = data.choice;
            setPhase2Answers(newAnswers);
          }
          // 不改变 currentAnswerIndex — 拖放不影响选中状态
        }
      } catch {}
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    // 拖出删除：从答案格拖出去，如果没有落在有效目标上就清空
    const handleAnswerDragStart = (e: React.DragEvent, choice: CellContent, sourceIndex: number) => {
      dragDroppedRef.current = false;
      // 先让浏览器截取当前元素快照（带 emoji），再隐藏原位
      requestAnimationFrame(() => setDraggingSlot(sourceIndex));
      handleDragStart(e, choice, sourceIndex);
    };
    const handleAnswerDragEnd = (_e: React.DragEvent, sourceIndex: number) => {
      setDraggingSlot(null);
      // 如果没有成功 drop 到任何格子，视为拖出删除
      if (!dragDroppedRef.current) {
        if (isPhase1) {
          const newAnswers = [...phase1Answers];
          newAnswers[sourceIndex] = null as any;
          setPhase1Answers(newAnswers);
        } else {
          const newAnswers = [...phase2Answers];
          newAnswers[sourceIndex] = null as any;
          setPhase2Answers(newAnswers);
        }
      }
    };
    const originalHandleDrop = (e: React.DragEvent, slotIndex: number) => {
      e.stopPropagation(); // 防止冒泡到外层 drop zone
      dragDroppedRef.current = true;
      handleDrop(e, slotIndex);
    };

    // 外层 drop zone — 接收所有拖放，防止浏览器"飘回"动画
    const handleOuterDrop = (e: React.DragEvent) => {
      e.preventDefault();
      // 不做任何写入，dragEnd 会处理删除逻辑
    };

    return (
      <div className="max-w-4xl mx-auto" onDragOver={handleDragOver} onDrop={handleOuterDrop}>
        {/* 上方：一排待填格子 */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
            凭记忆填入 {totalCells} 个图案
          </h3>
          <div className="flex justify-center gap-2 mb-6 flex-nowrap">
            {slots.map((i) => {
              const answer = answers[i];
              const isActive = currentAnswerIndex === i;
              const label = i + 1;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (answer) {
                      deselectAnswer(i);
                    } else {
                      setCurrentAnswerIndex(i);
                    }
                  }}
                  onDrop={(e) => originalHandleDrop(e, i)}
                  onDragOver={handleDragOver}
                  draggable={!!answer}
                  onDragStart={(e) => answer && handleAnswerDragStart(e, answer, i)}
                  onDragEnd={(e) => answer && handleAnswerDragEnd(e, i)}
                  className={`flex-1 max-w-[80px] aspect-square flex items-center justify-center rounded-lg border-[3px] cursor-pointer transition overflow-hidden p-1 ${
                    draggingSlot === i
                      ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                      : isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-300'
                      : answer
                      ? 'border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800 hover:border-blue-400'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                  style={{ containerType: 'inline-size' }}
                >
                  {answer && draggingSlot !== i ? (
                    <CellRenderer content={answer} size="normal" />
                  ) : (
                    <span className="font-black text-gray-400 dark:text-gray-500 flex items-baseline leading-none" style={{ fontSize: '2.2rem' }}>
                      ?<span className="font-bold" style={{ fontSize: '0.4em' }}>{label}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 下方：备选池 */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">
            备选图案（点击或拖拽填入 ? 格）
          </h3>
          <div className="flex flex-wrap justify-center gap-2 mx-auto">
            {(isPhase1 ? puzzle.choices : puzzle.phase2Choices).map((choice, i) => {
              return (
                <button
                  key={i}
                  onClick={() => selectChoice(choice)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, choice)}
                  className="flex items-center justify-center rounded-lg border-2 transition border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:scale-105 active:scale-95 cursor-grab"
                  style={{ width: '80px', height: '80px', containerType: 'inline-size' }}
                >
                  <CellRenderer content={choice} size="normal" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="text-center mt-6">
          <button
            onClick={isPhase1 ? handlePhase1Submit : handlePhase2Submit}
            disabled={answers.filter(Boolean).length < totalCells}
            className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isPhase1 ? '确认，进入阶段二' : '提交答案'}
          </button>
          {answers.filter(Boolean).length < totalCells && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              还有 {totalCells - answers.filter(Boolean).length} 个格子未填
            </p>
          )}
        </div>
      </div>
    );
  };

  // 渲染结果页
  const renderResult = () => {
    const phase1Result = checkAnswer(puzzle.matrix, puzzle.phase1Hidden, phase1Answers as MiniGrid);

    const p2Mat = puzzle.phase2Matrix;
    // 阶段二隐藏格：phase2Hidden[0] 和 phase2Hidden[1]
    const p2Hidden0 = puzzle.phase2Hidden[0];
    const p2Hidden1 = puzzle.phase2Hidden[1];
    const phase2Answers0 = [phase2Answers[0], phase2Answers[1], phase2Answers[2], phase2Answers[3]];
    const phase2Answers1 = [phase2Answers[4], phase2Answers[5], phase2Answers[6], phase2Answers[7]];

    const phase2Result0 = checkAnswer(p2Mat, p2Hidden0, phase2Answers0 as MiniGrid);
    const phase2Result1 = checkAnswer(p2Mat, p2Hidden1, phase2Answers1 as MiniGrid);

    const totalCorrect = phase1Result.correct + phase2Result0.correct + phase2Result1.correct;
    const totalQuestions = 12;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);

    const resultColor =
      accuracy === 100 ? 'text-emerald-500'
        : accuracy >= 75 ? 'text-green-500'
        : accuracy >= 50 ? 'text-amber-500'
        : 'text-red-500';
    const resultBg =
      accuracy === 100 ? 'bg-emerald-100 dark:bg-emerald-900/30'
        : accuracy >= 75 ? 'bg-green-100 dark:bg-green-900/30'
        : accuracy >= 50 ? 'bg-amber-100 dark:bg-amber-900/30'
        : 'bg-red-100 dark:bg-red-900/30';
    const ResultIcon = accuracy === 100 ? Trophy : accuracy >= 50 ? Target : Frown;

    // 渲染单个格子（复用做题页样式）
    const renderCell = (
      miniGrid: CellContent[],
      opts?: {
        userCells?: CellContent[];
        borderClass?: string;
        /** 只显示答错位置的正确答案，答对位置留空 */
        onlyWrong?: { userCells: CellContent[] };
      },
    ) => {
      const { userCells, borderClass, onlyWrong } = opts || {};
      const displayCells = userCells || miniGrid;
      const defaultBorder = 'border-[3px] border-gray-800 dark:border-gray-300';

      // onlyWrong 模式：如果全部答对，不渲染这个格子
      if (onlyWrong) {
        const allCorrect = miniGrid.every((cell, i) =>
          JSON.stringify(cell) === JSON.stringify(onlyWrong.userCells[i])
        );
        if (allCorrect) return <div className="aspect-square" />;
      }

      return (
        <div
          className={`aspect-square rounded-lg overflow-hidden relative bg-white dark:bg-gray-800 ${borderClass || defaultBorder}`}
          style={{ containerType: 'inline-size' }}
        >
          {/* 虚线十字分隔线 — 最上层 */}
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
            <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
          </div>
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full relative" style={{ gridTemplateRows: '1fr 1fr' }}>
            {displayCells.map((cell, i) => {
              const correctCell = miniGrid[i];
              const showMark = !!userCells;
              const isCorrect = showMark && JSON.stringify(cell) === JSON.stringify(correctCell);

              // onlyWrong 模式：答对的位置不显示内容
              const isOnlyWrong = !!onlyWrong;
              const wrongCorrect = isOnlyWrong && JSON.stringify(onlyWrong.userCells[i]) !== JSON.stringify(correctCell);

              return (
                <div
                  key={i}
                  className={`flex items-center justify-center relative overflow-hidden ${
                    showMark
                      ? isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                      : isOnlyWrong && wrongCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  {isOnlyWrong ? (
                    wrongCorrect ? <CellRenderer content={cell} size="small" /> : null
                  ) : (
                    <>
                      <CellRenderer content={cell} size="small" />
                      {showMark && (
                        <div className="absolute top-0 right-0 z-20">
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-600 drop-shadow-sm" strokeWidth={3} />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 drop-shadow-sm" strokeWidth={3} />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    // 渲染 3×4 结果矩阵：前3列=九宫格，第4列=隐藏行的正确答案（绿框）
    const renderResultGrid = (
      matrixToRender: Matrix,
      userAnswersMap: Map<string, CellContent[]>,
      highlightCells: { row: number; col: number }[],
    ) => (
      <div className="grid grid-cols-4 gap-2 mx-auto select-none" style={{ maxWidth: '686px' }}>
        {matrixToRender.map((row, rowIdx) =>
          <Fragment key={rowIdx}>
            {row.map((miniGrid, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const userCells = userAnswersMap.get(key);
              const isHighlighted = highlightCells.some((h) => h.row === rowIdx && h.col === colIdx);
              const borderClass = isHighlighted
                ? 'border-[3px] border-blue-400 dark:border-blue-500'
                : 'border-[3px] border-gray-800 dark:border-gray-300';

              return (
                <div key={key}>
                  {renderCell(miniGrid, { userCells, borderClass })}
                </div>
              );
            })}
            {/* 第4列：隐藏格的正确答案，只显示答错位置 */}
            {(() => {
              const hiddenInRow = highlightCells.find((h) => h.row === rowIdx);
              if (hiddenInRow) {
                const correctGrid = matrixToRender[hiddenInRow.row][hiddenInRow.col];
                const key = `${hiddenInRow.row}-${hiddenInRow.col}`;
                const userCells = userAnswersMap.get(key);
                return (
                  <div key={`answer-${rowIdx}`}>
                    {renderCell(correctGrid, {
                      borderClass: 'border-[3px] border-emerald-500 dark:border-emerald-400',
                      onlyWrong: userCells ? { userCells } : undefined,
                    })}
                  </div>
                );
              }
              return <div key={`empty-${rowIdx}`} />;
            })()}
          </Fragment>
        )}
      </div>
    );

    // 构建阶段一用户答案 map
    const phase1UserMap = new Map<string, CellContent[]>();
    phase1UserMap.set(
      `${puzzle.phase1Hidden.row}-${puzzle.phase1Hidden.col}`,
      phase1Answers as CellContent[]
    );

    // 构建阶段二用户答案 map
    const phase2UserMap = new Map<string, CellContent[]>();
    phase2UserMap.set(
      `${p2Hidden0.row}-${p2Hidden0.col}`,
      phase2Answers0 as CellContent[]
    );
    phase2UserMap.set(
      `${p2Hidden1.row}-${p2Hidden1.col}`,
      phase2Answers1 as CellContent[]
    );

    return (
      <div className="max-w-lg mx-auto">
        {/* 成绩摘要 */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className={`flex items-center justify-center w-11 h-11 rounded-full ${resultBg}`}>
            <ResultIcon className={`w-6 h-6 ${resultColor}`} />
          </div>
          <div>
            <span className={`text-3xl font-bold ${resultColor}`}>{accuracy}%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
              答对 {totalCorrect}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* 阶段一 */}
        <div className="mb-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            阶段一 <span className="text-gray-400 dark:text-gray-500">({phase1Result.correct}/4)</span>
          </h4>
          {renderResultGrid(puzzle.matrix, phase1UserMap, [puzzle.phase1Hidden])}
        </div>

        {/* 阶段二 */}
        <div className="mb-5">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            阶段二 <span className="text-gray-400 dark:text-gray-500">({phase2Result0.correct + phase2Result1.correct}/8)</span>
          </h4>
          {renderResultGrid(p2Mat, phase2UserMap, puzzle.phase2Hidden)}
        </div>

        {/* 解析 + 口诀 */}
        <div className="mb-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">阶段一 发现：</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 indent-8">
              {(puzzle.phase1Rules || []).join('；') || '无'}
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">阶段二 新发现：</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 indent-8">
              {(puzzle.phase2NewRules || []).join('；') || '无'}
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">完整规律：</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 indent-8">
              {describeAnalysis(puzzle.rules)}
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1 mb-0.5">口诀</p>
            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 tracking-wide indent-8">
              {generateMnemonic(puzzle.rules)}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setPuzzle(generatePuzzle());
              setPhase('watch1');
              setTimeLeft(90);
              setPhase1Answers([]);
              setPhase2Answers([]);
              setCurrentAnswerIndex(0);
            }}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            再玩一题
          </button>
          <button
            onClick={() => navigate(`/${userId}/memory`)}
            className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            返回选择
          </button>
        </div>
      </div>
    );
  };

  // 主渲染
  const allPhases: { key: GamePhase; label: string }[] = [
    { key: 'watch1', label: '观察一' },
    { key: 'answer1', label: '答题一' },
    { key: 'watch2', label: '观察二' },
    { key: 'answer2', label: '答题二' },
    { key: 'result', label: '结果' },
  ];

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/memory`} maxWidth="max-w-4xl">
      {/* Debug Tab — 左侧竖排，fixed 不影响布局 */}
      {isFixture && (
        <div className="fixed left-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1">
          {allPhases.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setPhase(p.key);
                const url = new URL(window.location.href);
                url.searchParams.set('phase', p.key);
                window.history.replaceState(null, '', url.toString());
              }}
              className={`px-2 py-1.5 text-[10px] rounded-md whitespace-nowrap transition shadow-sm ${
                phase === p.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {/* 标题 + 阶段 + 进度条 + 秒数，一行，与宫格等宽 */}
      {phase !== 'result' && (
        <div className="max-w-lg mx-auto flex items-center gap-3 mb-4">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
            宫格记忆
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
            {phase === 'watch1' || phase === 'answer1' ? '阶段一' : '阶段二'}·
            {phase === 'watch1' || phase === 'watch2' ? '观察' : '答题'}
          </span>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timeLeft > 30 ? 'bg-blue-500' : timeLeft > 10 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${(timeLeft / 90) * 100}%` }}
            />
          </div>
          <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {timeLeft}秒
          </span>
        </div>
      )}

      {/* 阶段内容 */}
      {phase === 'watch1' && (
        <div>
          {renderMatrix(true, false)}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setPhase('answer1');
                setTimeLeft(90);
              }}
              className="px-6 py-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              我看好了，开始答题 →
            </button>
          </div>
        </div>
      )}

      {phase === 'answer1' && renderAnswerInterface(true)}

      {phase === 'watch2' && (
        <div>
          {renderMatrix(false, true, puzzle.phase2Matrix)}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setPhase('answer2');
                setTimeLeft(90);
              }}
              className="px-6 py-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              我看好了，开始答题 →
            </button>
          </div>
        </div>
      )}

      {phase === 'answer2' && renderAnswerInterface(false)}

      {phase === 'result' && renderResult()}
    </Layout>
  );
}
