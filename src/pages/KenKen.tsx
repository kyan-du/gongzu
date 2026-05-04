import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { cageLabel, findCage } from '../features/kenken/engine';
import { useKenKenGame } from '../features/kenken/useKenKenGame';

export default function KenKen() {
  const { userId } = useParams<{ userId: string }>();
  const game = useKenKenGame();
  const nums = Array.from({ length: game.puzzle.size }, (_, i) => i + 1);

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-3xl">
      <div className="py-4">
        <div className="text-center mb-5"><div className="text-5xl mb-2">🧮</div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">运算笼 KenKen</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">每行每列填 1-{game.puzzle.size} 且不重复；每个粗框小笼子要满足左上角运算。</p></div>
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 px-1">{game.levels.map((level, index) => <button key={level.id} onClick={() => game.chooseLevel(index)} className={`shrink-0 min-w-[4.25rem] whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${game.levelIndex === index ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}>第{index + 1}关</button>)}</div>
        <div className="rounded-3xl bg-white dark:bg-gray-900 p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3"><div><div className="font-bold text-gray-900 dark:text-gray-100">{game.puzzle.title}</div><div className="text-xs text-gray-500 dark:text-gray-400">点格子，再点下面数字填入。</div></div><button onClick={game.reset} className="text-sm text-gray-500 dark:text-gray-400 underline">清空</button></div>
          <div className="grid border-2 border-gray-900 dark:border-gray-100 mx-auto w-full max-w-[360px] aspect-square overflow-hidden" style={{ gridTemplateColumns: `repeat(${game.puzzle.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${game.puzzle.size}, minmax(0, 1fr))` }}>
            {game.grid.map((row, r) => row.map((value, c) => {
              const cage = findCage(game.puzzle, r, c); const first = cage?.cells[0]?.row === r && cage?.cells[0]?.col === c; const selected = game.selected?.row === r && game.selected?.col === c;
              const topSame = cage?.cells.some(cell => cell.row === r - 1 && cell.col === c); const leftSame = cage?.cells.some(cell => cell.row === r && cell.col === c - 1); const rightSame = cage?.cells.some(cell => cell.row === r && cell.col === c + 1); const bottomSame = cage?.cells.some(cell => cell.row === r + 1 && cell.col === c);
              return <button key={`${r}-${c}`} onClick={() => game.setSelected({ row: r, col: c })} className={`relative min-h-0 min-w-0 overflow-hidden bg-white dark:bg-gray-950 flex items-center justify-center text-2xl font-black leading-none text-gray-900 dark:text-gray-100 ${selected ? 'ring-4 ring-orange-400 ring-inset bg-orange-50 dark:bg-orange-900/20' : ''}`} style={{ borderTop: topSame ? '1px solid #d1d5db' : '3px solid #111827', borderLeft: leftSame ? '1px solid #d1d5db' : '3px solid #111827', borderRight: rightSame ? '1px solid #d1d5db' : '3px solid #111827', borderBottom: bottomSame ? '1px solid #d1d5db' : '3px solid #111827' }}>{first && <span className="absolute top-1 left-1 text-[13px] sm:text-sm font-black leading-none text-orange-700 dark:text-orange-300">{cage ? cageLabel(cage) : ''}</span>}{value ?? ''}</button>;
            }))}
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4 max-w-[360px] mx-auto">{nums.map(n => <button key={n} onClick={() => game.setCell(n)} className="rounded-2xl py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 font-black text-xl active:scale-95">{n}</button>)}<button onClick={() => game.setCell(null)} className="rounded-2xl py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold active:scale-95">擦除</button></div>
        </div>
        {game.result && <div className={`rounded-2xl p-4 mb-4 font-bold text-center ${game.result.ok ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}>{game.result.message}</div>}
        <button onClick={game.submit} className="w-full rounded-2xl bg-orange-600 text-white py-4 font-bold shadow-lg active:scale-[0.98]">提交答案</button>
      </div>
    </Layout>
  );
}
