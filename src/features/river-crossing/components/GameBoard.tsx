import type { Bank, Item, ItemId } from '../types';
import { BankPanel } from './BankPanel';
import { Boat } from './Boat';

type GameBoardProps = {
  boatBank: Bank;
  leftItems: Item[];
  rightItems: Item[];
  boatItems: Item[];
  maxWeight?: number;
  totalWeight: number;
  onBoardItem: (id: ItemId) => void;
  onDrop: (e: React.DragEvent) => void;
};

export function GameBoard({ boatBank, leftItems, rightItems, boatItems, maxWeight, totalWeight, onBoardItem, onDrop }: GameBoardProps) {
  return <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-sky-200 to-blue-200 p-3 shadow-sm dark:from-sky-950 dark:via-blue-950 dark:to-slate-900">
    <div className="grid grid-cols-[0.85fr_1.7fr_0.85fr] gap-2 min-h-[360px]">
      <BankPanel title="左岸" items={leftItems} onBoardItem={onBoardItem} />
      <Boat boatBank={boatBank} boatItems={boatItems} maxWeight={maxWeight} totalWeight={totalWeight} onBoardItem={onBoardItem} onDrop={onDrop} />
      <BankPanel title="右岸" items={rightItems} onBoardItem={onBoardItem} />
    </div>
  </div>;
}
