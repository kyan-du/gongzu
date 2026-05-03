import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { findDownRelation, findRightRelation, isGiven } from '../features/futoshiki/engine';
import { useFutoshikiGame } from '../features/futoshiki/useFutoshikiGame';

export default function Futoshiki() {
  const { userId } = useParams<{ userId: string }>();
  const game = useFutoshikiGame();
  const nums = Array.from({ length: game.puzzle.size }, (_, i) => i + 1);
  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-3xl">
      <div className="py-4">
        <div className="text-center mb-5"><div className="text-5xl mb-2">🔢</div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">不等号棋盘</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">每行每列填 1-{game.puzzle.size} 且不重复；相邻格子要满足 &lt; 或 &gt;。</p></div>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">{game.levels.map((level, index) => <button key={level.id} onClick={() => game.chooseLevel(index)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${game.levelIndex === index ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}>第{index + 1}关</button>)}</div>
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3"><div><div className="font-bold text-gray-900 dark:text-gray-100">{game.puzzle.title}</div><div className="text-xs text-gray-500 dark:text-gray-400">灰色数字是题目给定，不能修改。</div></div><button onClick={game.reset} className="text-sm text-gray-500 dark:text-gray-400 underline">清空</button></div>
          <div className="mx-auto max-w-[380px]" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, minmax(0, 1fr))', aspectRatio: '1 / 1' }}>
            {Array.from({ length: 7 }, (_, rr) => Array.from({ length: 7 }, (_, cc) => {
              const isCell = rr % 2 === 0 && cc % 2 === 0;
              if (isCell) {
                const r = rr / 2; const c = cc / 2; const value = game.grid[r][c]; const given = isGiven(game.puzzle, r, c); const selected = game.selected?.row === r && game.selected?.col === c;
                return <button key={`${rr}-${cc}`} onClick={() => game.setSelected({ row: r, col: c })} className={`m-0.5 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${given ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700' : selected ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100'}`}>{value ?? ''}</button>;
              }
              if (rr % 2 === 0 && cc % 2 === 1) { const r = rr / 2; const c = (cc - 1) / 2; const rel = findRightRelation(game.puzzle, r, c); return <div key={`${rr}-${cc}`} className="flex items-center justify-center text-xl font-black text-emerald-700 dark:text-emerald-300">{rel?.op ?? ''}</div>; }
              if (rr % 2 === 1 && cc % 2 === 0) { const r = (rr - 1) / 2; const c = cc / 2; const rel = findDownRelation(game.puzzle, r, c); return <div key={`${rr}-${cc}`} className="flex items-center justify-center text-xl font-black text-emerald-700 dark:text-emerald-300 rotate-90">{rel?.op ?? ''}</div>; }
              return <div key={`${rr}-${cc}`} />;
            }))}
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4 max-w-[380px] mx-auto">{nums.map(n => <button key={n} onClick={() => game.setCell(n)} className="rounded-2xl py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 font-black text-xl active:scale-95">{n}</button>)}<button onClick={() => game.setCell(null)} className="rounded-2xl py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold active:scale-95">擦除</button></div>
        </div>
        {game.result && <div className={`rounded-2xl p-4 mb-4 font-bold text-center ${game.result.ok ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}>{game.result.message}</div>}
        <button onClick={game.submit} className="w-full rounded-2xl bg-emerald-600 text-white py-4 font-bold shadow-lg active:scale-[0.98]">提交答案</button>
      </div>
    </Layout>
  );
}
