import { Lightbulb, PartyPopper, RotateCcw, Undo2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLightsOutGame } from '../features/lights-out/useLightsOutGame';

export default function LightsOut() {
  const { userId } = useParams<{ userId: string }>();
  const game = useLightsOutGame();
  const litCount = game.board.filter(Boolean).length;

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-4xl">
      <div className="py-4 space-y-4 relative">
        {game.solved && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-yellow-300/10 animate-pulse" />
            {Array.from({ length: 24 }).map((_, index) => (
              <span
                key={index}
                className="absolute top-[-10%] text-2xl animate-bounce"
                style={{
                  left: `${(index * 41) % 100}%`,
                  animationDelay: `${(index % 6) * 0.13}s`,
                  animationDuration: `${1.1 + (index % 5) * 0.2}s`,
                }}
              >
                {['💡', '✨', '🎉', '⭐'][index % 4]}
              </span>
            ))}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">灯泡开关</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">点一个灯，会切换自己和上下左右；把灯全部关掉</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <select
            value={game.levelIndex}
            onChange={e => game.chooseLevel(Number(e.target.value))}
            className="w-full md:hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {game.levels.map((level, index) => <option key={level.id} value={index}>{level.title}</option>)}
          </select>

          <div className="hidden md:grid grid-cols-5 gap-2">
            {game.levels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => game.chooseLevel(index)}
                className={`rounded-xl px-3 py-2 text-left text-sm transition ${index === game.levelIndex ? 'bg-yellow-500 text-white shadow' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'}`}
              >
                <div className="font-semibold truncate">{level.title}</div>
                <div className={`text-xs truncate ${index === game.levelIndex ? 'text-yellow-50' : 'text-gray-500 dark:text-gray-400'}`}>{level.size}×{level.size} · 参考 {level.optimalMoves} 步</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/20 rounded-3xl p-5 shadow-sm border border-yellow-100 dark:border-yellow-900/40">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{game.level.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{game.level.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 dark:bg-gray-900/70 px-4 py-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">目标</div>
                <div className="font-bold text-yellow-700 dark:text-yellow-300">关掉全部灯泡</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              className="grid gap-2 sm:gap-3 w-full max-w-[min(92vw,520px)] rounded-3xl bg-gray-900 dark:bg-gray-950 p-3 sm:p-4 shadow-inner"
              style={{ gridTemplateColumns: `repeat(${game.level.size}, minmax(0, 1fr))` }}
            >
              {game.board.map((light, index) => (
                <button
                  key={index}
                  onClick={() => game.press(index)}
                  disabled={game.solved}
                  aria-label={`第 ${index + 1} 个灯泡，${light ? '亮着' : '关着'}`}
                  className={`aspect-square rounded-2xl border-2 transition active:scale-95 disabled:cursor-default ${light ? 'border-yellow-200 bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 shadow-[0_0_22px_rgba(251,191,36,0.8)]' : 'border-gray-700 bg-gray-800 shadow-inner hover:border-gray-500'}`}
                >
                  <span className={`text-3xl sm:text-4xl ${light ? '' : 'opacity-30 grayscale'}`}>💡</span>
                </button>
              ))}
            </div>
          </div>

          {game.solved && (
            <div className="mt-5 rounded-3xl border-4 border-yellow-300 bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 dark:from-yellow-900/40 dark:via-orange-900/30 dark:to-pink-900/30 p-5 shadow-xl text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-3xl font-black text-orange-600 dark:text-orange-300">
                <PartyPopper className="w-8 h-8" />
                全部关灯！
              </div>
              <div className="mt-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                共用了 {game.history.length} 步{game.level.optimalMoves ? `，参考最优 ${game.level.optimalMoves} 步。` : '。'}
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className={`text-sm font-medium mb-3 ${game.solved ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
              {game.solved ? '太棒了，可以换下一关。' : `还亮着 ${litCount} 盏灯。点击一个灯泡，会同时切换上下左右。`}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 py-3 font-bold text-center">
                {game.history.length} 步
              </div>
              <div className="rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 py-3 font-bold text-center">
                参考 {game.level.optimalMoves} 步
              </div>
              <button disabled={!game.history.length} onClick={game.undo} className="rounded-xl bg-gray-100 dark:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-200 py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
                <Undo2 className="w-4 h-4" />撤销一步
              </button>
              <button onClick={game.reset} className="rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
                <RotateCcw className="w-4 h-4" />重新开始
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
