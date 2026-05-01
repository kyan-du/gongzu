import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { GameBoard } from '../features/river-crossing/components/GameBoard';
import { LevelPicker } from '../features/river-crossing/components/LevelPicker';
import { MoveHistory } from '../features/river-crossing/components/MoveHistory';
import { StatusBar } from '../features/river-crossing/components/StatusBar';
import { useRiverGame } from '../features/river-crossing/useRiverGame';
export default function RiverCrossing() {
  const { userId } = useParams<{ userId: string }>();
  const {
    level,
    levelIndex,
    levels,
    boatBank,
    message,
    status,
    moves,
    history,
    leftItems,
    rightItems,
    boatItems,
    totalWeight,
    chooseLevel,
    reset,
    undo,
    boardItem,
    handleDrop,
    sail,
  } = useRiverGame();

  return <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-6xl"><div className="py-3 sm:py-5">
    <div className="mb-3 text-center sm:mb-4"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">过河闯关</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:mt-2">10 关难度递增：观察规则，安排谁先过河。</p></div>
    <LevelPicker levels={levels} levelIndex={levelIndex} onChooseLevel={chooseLevel} />
    <div className="mb-3 rounded-3xl bg-white p-3 shadow-sm dark:bg-gray-800 sm:mb-4 sm:p-4"><h2 className="font-bold text-gray-900 dark:text-gray-100">{level.title}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{level.subtitle}</p><p className="mt-1 text-xs text-gray-400 sm:mt-2">船容量：{level.capacity}；{level.maxWeight ? `最大承重：${level.maxWeight}；` : ''}{level.needsDriver ? '必须有会划船的人。' : '不限制驾驶员。'}</p></div>
    <StatusBar moves={moves} status={status} message={message} />
    <GameBoard boatBank={boatBank} leftItems={leftItems} rightItems={rightItems} boatItems={boatItems} maxWeight={level.maxWeight} totalWeight={totalWeight} onBoardItem={boardItem} onDrop={handleDrop} />
    <div className="mt-5 mx-auto max-w-md"><button onClick={sail} disabled={status !== 'playing'} className="min-h-[56px] w-full rounded-2xl bg-blue-600 px-8 py-3 text-lg font-bold text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400">开船</button></div>
    <MoveHistory history={history} items={level.items} onUndo={undo} onReset={reset} />
  </div></Layout>;
}
