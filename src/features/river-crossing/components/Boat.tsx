import type { Bank, Item, ItemId } from '../types';
import { ItemButton } from './ItemButton';

type BoatProps = {
  boatBank: Bank;
  boatItems: Item[];
  maxWeight?: number;
  totalWeight: number;
  onBoardItem: (id: ItemId) => void;
  onDrop: (e: React.DragEvent) => void;
};

export function Boat({ boatBank, boatItems, maxWeight, totalWeight, onBoardItem, onDrop }: BoatProps) {
  return <section className="relative rounded-3xl bg-sky-300/60 p-3 dark:bg-sky-900/40">
    <h2 className="mb-3 text-center text-lg font-bold text-sky-800 dark:text-sky-100">河</h2>
    <div className="absolute left-4 right-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/50" />
    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl text-white/80">←</div>
    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl text-white/80">→</div>
    <div className={`absolute top-[62%] rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-900 transition-all duration-700 dark:text-blue-100 ${boatBank === 'left' ? 'left-6' : 'right-6'}`}>{boatBank === 'left' ? '停靠左岸' : '停靠右岸'}</div>
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop} className={`absolute top-1/2 flex w-40 -translate-y-1/2 flex-col items-center rounded-[2rem] border-4 border-amber-700 bg-amber-200 p-3 shadow-xl transition-all duration-700 ease-in-out ${boatBank === 'left' ? 'left-2 sm:left-4' : 'left-[calc(100%-10.5rem)] sm:left-[calc(100%-11rem)]'}`}>
      <div className="text-4xl">🚢</div>
      <div className="mt-2 flex min-h-[72px] flex-wrap items-center justify-center gap-1">
        {boatItems.length ? boatItems.map(item => <ItemButton key={item.id} item={item} onClick={() => onBoardItem(item.id)} draggable={false} selected />) : <span className="rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-amber-800">拖/点上船</span>}
      </div>
      {maxWeight && <div className="mt-1 text-xs font-bold text-amber-900">{totalWeight}/{maxWeight}</div>}
    </div>
  </section>;
}
