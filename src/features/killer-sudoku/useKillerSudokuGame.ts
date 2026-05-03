import { useState } from 'react';
import { emptyKillerGrid, validateKillerSudoku } from './engine';
import { KILLER_SUDOKU_LEVELS } from './levels';
import type { KillerCheck } from './types';

export function useKillerSudokuGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const puzzle = KILLER_SUDOKU_LEVELS[levelIndex];
  const [grid, setGrid] = useState(() => emptyKillerGrid(puzzle));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [result, setResult] = useState<KillerCheck | null>(null);
  const reset = (next = levelIndex) => { const p = KILLER_SUDOKU_LEVELS[next]; setGrid(emptyKillerGrid(p)); setSelected(null); setResult(null); };
  const chooseLevel = (next: number) => { setLevelIndex(next); reset(next); };
  const setCell = (value: number | null) => { if (!selected) return; setGrid(current => current.map((row, r) => row.map((cell, c) => (r === selected.row && c === selected.col ? value : cell)))); setResult(null); };
  const submit = () => setResult(validateKillerSudoku(puzzle, grid));
  return { levels: KILLER_SUDOKU_LEVELS, levelIndex, puzzle, grid, selected, result, chooseLevel, setSelected, setCell, reset: () => reset(), submit };
}
