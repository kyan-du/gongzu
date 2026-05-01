import type { Item } from '../types';

type ItemButtonProps = {
  item: Item;
  onClick: () => void;
  draggable?: boolean;
  selected?: boolean;
};

export function ItemButton({ item, onClick, draggable = true, selected = false }: ItemButtonProps) {
  return <button
    type="button"
    draggable={draggable}
    onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
    onClick={onClick}
    className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold shadow-sm transition active:scale-95 ${selected ? 'ring-4 ring-blue-300' : ''} ${item.color}`}
  >
    <span className="text-2xl">{item.emoji}</span>
    <span>{item.name}</span>
  </button>;
}
