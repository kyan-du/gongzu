import { Droplets, PartyPopper, RotateCcw, Undo2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useParams } from 'react-router-dom';
import { useWaterGame } from '../features/water-pouring/useWaterGame';

export default function WaterPouring() {
  const { userId } = useParams<{ userId: string }>();
  const game = useWaterGame();
  const selectedJug = game.level.jugs.find(j => j.id === game.selected);

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-5xl">
      <div className="py-4 space-y-4 relative">
        {game.status === 'won' && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-yellow-300/10 animate-pulse" />
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                key={index}
                className="absolute top-[-10%] text-2xl animate-bounce"
                style={{
                  left: `${(index * 37) % 100}%`,
                  animationDelay: `${(index % 7) * 0.12}s`,
                  animationDuration: `${1.2 + (index % 5) * 0.18}s`,
                }}
              >
                {['🎉', '✨', '🎊', '⭐', '💧'][index % 5]}
              </span>
            ))}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">杯子倒水</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">装满、倒空、互倒，量出目标水量</p>
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
                className={`rounded-xl px-3 py-2 text-left text-sm transition ${index === game.levelIndex ? 'bg-blue-600 text-white shadow' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
              >
                <div className="font-semibold truncate">{level.title}</div>
                <div className={`text-xs truncate ${index === game.levelIndex ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{level.target.amount}L</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 rounded-3xl p-5 shadow-sm border border-blue-100 dark:border-blue-900/40">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{game.level.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{game.level.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/80 dark:bg-gray-900/70 px-4 py-3">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">目标</div>
                <div className="font-bold text-blue-700 dark:text-blue-300">量出 {game.level.target.amount}L</div>
              </div>
            </div>
          </div>

          <div className="flex flex-nowrap gap-3 md:gap-4 items-end overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {game.level.jugs.map(jug => {
              const amount = game.water[jug.id] || 0;
              const percent = Math.round((amount / jug.capacity) * 100);
              const active = game.selected === jug.id;
              return (
                <button
                  key={jug.id}
                  onClick={() => game.selectJug(jug.id)}
                  className={`relative shrink-0 w-[calc((100%-0.75rem)/2)] min-w-[136px] md:w-auto md:flex-1 rounded-3xl bg-white dark:bg-gray-900 p-3 md:p-4 border-2 transition active:scale-[0.99] snap-start ${active ? 'border-blue-500 shadow-lg ring-4 ring-blue-100 dark:ring-blue-900/40' : 'border-gray-100 dark:border-gray-700 hover:border-blue-200'}`}
                >
                  <div className="h-44 md:h-48 rounded-2xl border-4 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-end relative">
                    <div className="absolute inset-x-0 top-3 z-10 text-center font-bold text-gray-700 dark:text-gray-200">{jug.name}</div>
                    <div className={`w-full bg-gradient-to-t ${jug.color} transition-all duration-500`} style={{ height: `${percent}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-white/85 dark:bg-gray-950/80 px-3 md:px-4 py-2 text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 shadow">
                        {amount} / {jug.capacity}L
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {game.status === 'won' && (
            <div className="mt-5 rounded-3xl border-4 border-yellow-300 bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 dark:from-yellow-900/40 dark:via-orange-900/30 dark:to-pink-900/30 p-5 shadow-xl text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-3xl font-black text-orange-600 dark:text-orange-300">
                <PartyPopper className="w-8 h-8" />
                闯关成功！
              </div>
              <div className="mt-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                {game.message} 共用了 {game.history.length} 步。
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className={`text-sm font-medium mb-3 ${game.status === 'won' ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
              {game.status === 'won' ? '太棒了，可以换下一关继续挑战。' : game.message}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button disabled={!game.selected} onClick={game.fillSelected} className="rounded-xl bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 text-white py-3 font-bold active:scale-[0.98]">
                装满{selectedJug ? selectedJug.name : ''}
              </button>
              <button disabled={!game.selected} onClick={game.emptySelected} className="rounded-xl bg-cyan-600 disabled:bg-gray-300 disabled:text-gray-500 text-white py-3 font-bold active:scale-[0.98]">
                倒空{selectedJug ? selectedJug.name : ''}
              </button>
              <button disabled={!game.history.length} onClick={game.undo} className="rounded-xl bg-gray-100 dark:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-200 py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
                <Undo2 className="w-4 h-4" />撤销一步
              </button>
              <button onClick={game.reset} className="rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
                <RotateCcw className="w-4 h-4" />重新开始
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">步骤记录</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{game.history.length} 步{game.level.optimalMoves ? ` / 参考 ${game.level.optimalMoves} 步` : ''}</span>
          </div>
          {game.history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">还没有操作。</p>
          ) : (
            <ol className="space-y-2">
              {game.history.map((move, index) => (
                <li key={index} className="text-sm rounded-xl bg-gray-50 dark:bg-gray-900 px-3 py-2 text-gray-700 dark:text-gray-200">
                  {index + 1}. {move.action}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Layout>
  );
}
