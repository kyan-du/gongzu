import { Fragment } from 'react';
import { CheckCircle, XCircle, Trophy, Target, Frown } from 'lucide-react';
import { checkAnswer, describeAnalysis, generateMnemonic, type CellContent, type GamePuzzle, type MiniGrid, type Matrix } from '../../../lib/grid-engine';
import { CellRenderer } from './cells';

type ResultViewProps = {
  puzzle: GamePuzzle;
  phase1Answers: CellContent[];
  phase2Answers: CellContent[];
  onRestart: () => void;
  onBack: () => void;
};

export function ResultView({ puzzle, phase1Answers, phase2Answers, onRestart, onBack }: ResultViewProps) {

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
        onClick={onRestart}
        className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
      >
        再玩一题
      </button>
      <button
        onClick={onBack}
        className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      >
        返回选择
      </button>
    </div>
  </div>
);
}
