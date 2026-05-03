import { useState } from 'react';
import { emptyKenKenGrid, validateKenKen } from './engine';
import { KENKEN_LEVELS } from './levels';
import type { KenKenCheck } from './types';

export function useKenKenGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const puzzle = KENKEN_LEVELS[levelIndex];
  const [grid, setGrid] = useState(() => emptyKenKenGrid(puzzle.size));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [result, setResult] = useState<KenKenCheck | null>(null);

  const reset = (next = levelIndex) => {
    const target = KENKEN_LEVELS[next];
    setGrid(emptyKenKenGrid(target.size));
    setSelected(null);
    setResult(null);
  };
  const chooseLevel = (next: number) => { setLevelIndex(next); reset(next); };
  const setCell = (value: number | null) => {
    if (!selected) return;
    setGrid(current => current.map((row, r) => row.map((cell, c) => (r === selected.row && c === selected.col ? value : cell))));
    setResult(null);
  };
  const submit = () => setResult(validateKenKen(puzzle, grid));
  return { levels: KENKEN_LEVELS, levelIndex, puzzle, grid, selected, result, chooseLevel, setSelected, setCell, reset: () => reset(), submit };
}
