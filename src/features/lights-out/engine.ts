import type { LightsOutLevel } from './types';

export function toggleCell(board: boolean[], size: number, index: number): boolean[] {
  const next = [...board];
  const row = Math.floor(index / size);
  const col = index % size;
  const candidates = [
    [row, col],
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];

  for (const [r, c] of candidates) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      const target = r * size + c;
      next[target] = !next[target];
    }
  }

  return next;
}

export function makeBoard(size: number, clicks: number[]): boolean[] {
  return clicks.reduce((board, index) => toggleCell(board, size, index), Array(size * size).fill(false));
}

export function isSolved(board: boolean[]): boolean {
  return board.every(light => !light);
}

export function boardKey(board: boolean[]): string {
  return board.map(light => (light ? '1' : '0')).join('');
}

export function findOptimalMoves(level: LightsOutLevel): number {
  if (isSolved(level.start)) return 0;
  const queue: Array<{ board: boolean[]; moves: number }> = [{ board: level.start, moves: 0 }];
  const seen = new Set([boardKey(level.start)]);

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;

    for (let index = 0; index < current.board.length; index += 1) {
      const next = toggleCell(current.board, level.size, index);
      const key = boardKey(next);
      if (seen.has(key)) continue;
      if (isSolved(next)) return current.moves + 1;
      seen.add(key);
      queue.push({ board: next, moves: current.moves + 1 });
    }
  }

  return -1;
}
