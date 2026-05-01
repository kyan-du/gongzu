import type { Item, ItemId } from '../types';
import { ItemButton } from './ItemButton';

type BankPanelProps = {
  title: string;
  items: Item[];
  onBoardItem: (id: ItemId) => void;
};

export function BankPanel({ title, items, onBoardItem }: BankPanelProps) {
  return <section className="rounded-3xl bg-lime-100/90 p-3 shadow-inner dark:bg-lime-900/30">
    <h2 className="mb-3 text-center text-lg font-bold text-lime-800 dark:text-lime-100">{title}</h2>
    <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
      {items.map(item => <ItemButton key={item.id} item={item} onClick={() => onBoardItem(item.id)} />)}
      {items.length === 0 && <span className="text-sm text-lime-700/60 dark:text-lime-200/60">空空的</span>}
    </div>
  </section>;
}
