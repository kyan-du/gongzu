import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Layout from '../components/Layout';
import type { Matrix } from '../lib/grid-engine';
import { MemoryMatrix } from '../features/memory-grid/components/MemoryMatrix';
import { AnswerInterface } from '../features/memory-grid/components/AnswerInterface';
import { ResultView } from '../features/memory-grid/components/ResultView';
import { useMemoryGridGame } from '../features/memory-grid/hooks/useMemoryGridGame';
import type { GamePhase } from '../features/memory-grid/types';

export default function MemoryGrid() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isFixture = searchParams.get('debug') === 'fixture';
  const initialPhase = (searchParams.get('phase') as GamePhase) || 'watch1';
  const examMode = searchParams.get('mode') === 'exam';
  const quizId = searchParams.get('quizId');

  const {
    puzzle,
    phase,
    setPhase,
    timeLeft,
    currentAnswerIndex,
    phase1Answers,
    phase2Answers,
    setCurrentAnswerIndex,
    setPhase1Answers,
    setPhase2Answers,
    dragDroppedRef,
    handlePhase1Submit,
    handlePhase2Submit,
    startAnswerPhase1,
    startAnswerPhase2,
    restart,
  } = useMemoryGridGame({
    userId,
    isFixture,
    initialPhase,
    examMode,
    quizId,
  });

  if (!puzzle) {
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/home`}>
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">加载中...</div>
      </Layout>
    );
  }

  // 渲染 3×3 矩阵 — 独立方块 + 间距 + 粗边框
  const renderMatrix = (hidePhase1: boolean, hidePhase2: boolean, matrixOverride?: Matrix, hiddenOverride?: { row: number; col: number }[]) => (
    <MemoryMatrix
      puzzle={puzzle}
      hidePhase1={hidePhase1}
      hidePhase2={hidePhase2}
      matrixOverride={matrixOverride}
      hiddenOverride={hiddenOverride}
    />
  );

  // 渲染答题界面 — 纯记忆：一排连续格子 + 大备选池
  const renderAnswerInterface = (isPhase1: boolean) => (
    <AnswerInterface
      puzzle={puzzle}
      isPhase1={isPhase1}
      currentAnswerIndex={currentAnswerIndex}
      phase1Answers={phase1Answers}
      phase2Answers={phase2Answers}
      setCurrentAnswerIndex={setCurrentAnswerIndex}
      setPhase1Answers={setPhase1Answers}
      setPhase2Answers={setPhase2Answers}
      onPhase1Submit={handlePhase1Submit}
      onPhase2Submit={handlePhase2Submit}
      dragDroppedRef={dragDroppedRef}
    />
  );

  // 渲染结果页
  const renderResult = () => (
    <ResultView
      puzzle={puzzle}
      phase1Answers={phase1Answers}
      phase2Answers={phase2Answers}
      onRestart={() => {
        restart();
      }}
      onBack={() => navigate(`/${userId}/brain`)}
    />
  );

  // 主渲染
  const allPhases: { key: GamePhase; label: string }[] = [
    { key: 'watch1', label: '观察一' },
    { key: 'answer1', label: '答题一' },
    { key: 'watch2', label: '观察二' },
    { key: 'answer2', label: '答题二' },
    { key: 'result', label: '结果' },
  ];

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-4xl">
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
                startAnswerPhase1();
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
                startAnswerPhase2();
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
