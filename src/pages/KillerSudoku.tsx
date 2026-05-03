import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { cageForCell, cagePositionClass } from '../features/killer-sudoku/engine';
import { useKillerSudokuGame } from '../features/killer-sudoku/useKillerSudokuGame';

export default function KillerSudoku() {
  const { userId } = useParams<{ userId: string }>();
  const game = useKillerSudokuGame();
  const nums = Array.from({ length: game.puzzle.size }, (_, i) => i + 1);
  return <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-3xl"><div className="py-4">
    <div className="text-center mb-5"><div className="text-5xl mb-2">🔢</div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">杀手数独 Killer Sudoku</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-2">每行、每列、每个小宫不重复；虚线小笼数字和等于左上角提示。</p></div>
    <div className="flex gap-2 overflow-x-auto pb-3 mb-4">{game.levels.map((level, index) => <button key={level.id} onClick={() => game.chooseLevel(index)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${game.levelIndex === index ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}>第{index + 1}关</button>)}</div>
    <div className="rounded-3xl bg-white dark:bg-gray-900 p-4 shadow-sm mb-4"><div className="flex items-center justify-between mb-3"><div><div className="font-bold text-gray-900 dark:text-gray-100">{game.puzzle.title}</div><div className="text-xs text-gray-500 dark:text-gray-400">4×4 入门版：每个 2×2 小宫也不能重复。</div></div><button onClick={game.reset} className="text-sm text-gray-500 dark:text-gray-400 underline">清空</button></div>
      <div className="grid mx-auto w-full max-w-[390px] aspect-square border-2 border-gray-900 dark:border-gray-100 overflow-hidden" style={{ gridTemplateColumns: `repeat(${game.puzzle.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${game.puzzle.size}, minmax(0, 1fr))` }}>{game.grid.map((row, r) => row.map((value, c) => { const cage = cageForCell(game.puzzle, r, c)!; const isStart = cage.cells[0].row === r && cage.cells[0].col === c; const selected = game.selected?.row === r && game.selected?.col === c; return <button key={`${r}-${c}`} onClick={() => game.setSelected({ row: r, col: c })} className={`relative min-h-0 min-w-0 overflow-hidden flex items-center justify-center text-2xl font-black leading-none border-amber-500/80 ${cagePositionClass(cage, r, c)} ${selected ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-gray-950'} text-gray-900 dark:text-gray-100`}>{isStart && <span className="absolute top-1 left-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">{cage.sum}</span>}{value ?? ''}</button>; }))}</div>
      <div className="grid grid-cols-5 gap-2 mt-4 max-w-[390px] mx-auto">{nums.map(n => <button key={n} onClick={() => game.setCell(n)} className="rounded-2xl py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-black text-xl">{n}</button>)}<button onClick={() => game.setCell(null)} className="rounded-2xl py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold">擦除</button></div>
    </div>{game.result && <div className={`rounded-2xl p-4 mb-4 font-bold text-center ${game.result.ok ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'}`}>{game.result.message}</div>}<button onClick={game.submit} className="w-full rounded-2xl bg-amber-600 text-white py-4 font-bold shadow-lg">提交答案</button>
  </div></Layout>;
}
