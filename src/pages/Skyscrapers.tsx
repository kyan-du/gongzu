import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { isGiven } from '../features/skyscrapers/engine';
import { useSkyscrapersGame } from '../features/skyscrapers/useSkyscrapersGame';

export default function Skyscrapers() {
  const { userId } = useParams<{ userId: string }>();
  const game = useSkyscrapersGame();
  const nums = Array.from({ length: game.puzzle.size }, (_, i) => i + 1);
  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-3xl">
      <div className="py-4">
        <div className="text-center mb-5"><div className="text-5xl mb-2">🏙️</div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">高楼谜题</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">每行每列填 1-{game.puzzle.size} 且不重复；边上的数字表示从那边能看到几栋楼。</p></div>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">{game.levels.map((level, index) => <button key={level.id} onClick={() => game.chooseLevel(index)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${game.levelIndex === index ? 'bg-sky-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}>第{index + 1}关</button>)}</div>
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3"><div><div className="font-bold text-gray-900 dark:text-gray-100">{game.puzzle.title}</div><div className="text-xs text-gray-500 dark:text-gray-400">高楼越高数字越大；矮楼会被前面的高楼挡住。</div></div><button onClick={game.reset} className="text-sm text-gray-500 dark:text-gray-400 underline">清空</button></div>
          <div className="mx-auto w-full max-w-[390px] aspect-square" style={{ display: 'grid', gridTemplateColumns: '0.55fr repeat(4, 1fr) 0.55fr', gridTemplateRows: '0.55fr repeat(4, 1fr) 0.55fr' }}>
            <div />
            {game.puzzle.clues.top.map((clue, i) => <div key={`top-${i}`} className="flex items-center justify-center text-sky-700 dark:text-sky-300 font-black">{clue || ''}</div>)}
            <div />
            {game.grid.map((row, r) => [
              <div key={`left-${r}`} className="flex items-center justify-center text-sky-700 dark:text-sky-300 font-black">{game.puzzle.clues.left[r] || ''}</div>,
              ...row.map((value, c) => { const given = isGiven(game.puzzle, r, c); const selected = game.selected?.row === r && game.selected?.col === c; return <button key={`${r}-${c}`} onClick={() => game.setSelected({ row: r, col: c })} className={`m-0.5 rounded-xl border-2 min-h-0 min-w-0 overflow-hidden flex items-center justify-center text-2xl font-black leading-none ${given ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700' : selected ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-500 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100'}`}>{value ?? ''}</button>; }),
              <div key={`right-${r}`} className="flex items-center justify-center text-sky-700 dark:text-sky-300 font-black">{game.puzzle.clues.right[r] || ''}</div>,
            ])}
            <div />
            {game.puzzle.clues.bottom.map((clue, i) => <div key={`bottom-${i}`} className="flex items-center justify-center text-sky-700 dark:text-sky-300 font-black">{clue || ''}</div>)}
            <div />
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4 max-w-[390px] mx-auto">{nums.map(n => <button key={n} onClick={() => game.setCell(n)} className="rounded-2xl py-3 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 font-black text-xl active:scale-95">{n}</button>)}<button onClick={() => game.setCell(null)} className="rounded-2xl py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold active:scale-95">擦除</button></div>
        </div>
        {game.result && <div className={`rounded-2xl p-4 mb-4 font-bold text-center ${game.result.ok ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}>{game.result.message}</div>}
        <button onClick={game.submit} className="w-full rounded-2xl bg-sky-600 text-white py-4 font-bold shadow-lg active:scale-[0.98]">提交答案</button>
      </div>
    </Layout>
  );
}
