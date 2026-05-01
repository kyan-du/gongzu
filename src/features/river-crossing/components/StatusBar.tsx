import type { GameStatus } from '../types';

type StatusBarProps = {
  moves: number;
  status: GameStatus;
  message: string;
};

export function StatusBar({ moves, status, message }: StatusBarProps) {
  return <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">步数：{moves}</span>
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${status === 'won' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' : status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'}`}>{message}</span>
  </div>;
}
