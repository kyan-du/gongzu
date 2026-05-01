import type { Level } from '../types';

type LevelPickerProps = {
  levels: Level[];
  levelIndex: number;
  onChooseLevel: (index: number) => void;
};

export function LevelPicker({ levels, levelIndex, onChooseLevel }: LevelPickerProps) {
  return <>
    <div className="mb-3 sm:hidden">
      <label className="mb-1 block text-xs font-bold text-gray-500 dark:text-gray-400">选择关卡</label>
      <select value={levelIndex} onChange={(e) => onChooseLevel(Number(e.target.value))} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base font-bold text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
        {levels.map((l, i) => <option key={l.id} value={i}>{l.title} · {l.capacity}人船{l.maxWeight ? ` · ${l.maxWeight}重` : ''}</option>)}
      </select>
    </div>
    <div className="mb-4 hidden grid-cols-2 gap-2 sm:grid sm:grid-cols-5">
      {levels.map((l, i) => <button key={l.id} onClick={() => onChooseLevel(i)} className={`rounded-2xl px-3 py-2 text-left text-sm font-bold transition ${i === levelIndex ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200'}`}>
        <div>{l.title}</div>
        <div className={`mt-1 text-xs font-normal ${i === levelIndex ? 'text-blue-100' : 'text-gray-400'}`}>{l.capacity}人船{l.maxWeight ? ` · ${l.maxWeight}重` : ''}</div>
      </button>)}
    </div>
  </>;
}
