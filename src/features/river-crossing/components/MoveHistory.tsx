import type { Item, MoveRecord } from '../types';

type MoveHistoryProps = {
  history: MoveRecord[];
  items: Item[];
  onUndo: () => void;
  onReset: () => void;
};

export function MoveHistory({ history, items, onUndo, onReset }: MoveHistoryProps) {
  return <section className="mt-5 rounded-3xl bg-white p-4 shadow-sm dark:bg-gray-800">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">前序步骤</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">共 {history.length} 步</span>
      </div>
      <button onClick={onUndo} disabled={history.length === 0} className="rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300 dark:bg-amber-900/30 dark:text-amber-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-600">撤销一步</button>
    </div>
    {history.length === 0 ? <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-900 dark:text-gray-400">还没有开船。每走一步，这里都会记录下来。</p> : <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {history.map((step, index) => <li key={`${index}-${step.from}-${step.to}`} className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-200"><span className="font-bold text-blue-600 dark:text-blue-300">{index + 1}.</span> {step.from === 'left' ? '左岸' : '右岸'} → {step.to === 'left' ? '左岸' : '右岸'}<span className="ml-2 font-bold">{step.passengers.length ? step.passengers.map(id => items.find(i => i.id === id)?.emoji || id).join(' ') : '空船'}</span></li>)}
    </ol>}
    <div className="mt-4 flex justify-center border-t border-gray-100 pt-3 dark:border-gray-700">
      <button onClick={onReset} className="text-sm font-medium text-gray-400 underline-offset-4 hover:text-red-500 hover:underline dark:text-gray-500 dark:hover:text-red-300">重新开始</button>
    </div>
  </section>;
}
