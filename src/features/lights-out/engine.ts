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

  let best = Number.POSITIVE_INFINITY;
  const size = level.size;

  for (let firstRowMask = 0; firstRowMask < 2 ** size; firstRowMask += 1) {
    let board = [...level.start];
    let moves = 0;

    for (let col = 0; col < size; col += 1) {
      if ((firstRowMask & (1 << col)) !== 0) {
        board = toggleCell(board, size, col);
        moves += 1;
      }
    }

    for (let row = 1; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const above = (row - 1) * size + col;
        if (board[above]) {
          board = toggleCell(board, size, row * size + col);
          moves += 1;
        }
      }
    }

    if (isSolved(board)) {
      best = Math.min(best, moves);
    }
  }

  return Number.isFinite(best) ? best : -1;
}
