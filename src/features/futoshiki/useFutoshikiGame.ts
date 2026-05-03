import { useState } from 'react';
import { emptyFutoshikiGrid, isGiven, validateFutoshiki } from './engine';
import { FUTOSHIKI_LEVELS } from './levels';
import type { FutoshikiCheck } from './types';

export function useFutoshikiGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const puzzle = FUTOSHIKI_LEVELS[levelIndex];
  const [grid, setGrid] = useState(() => emptyFutoshikiGrid(puzzle));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [result, setResult] = useState<FutoshikiCheck | null>(null);
  const reset = (next = levelIndex) => { const p = FUTOSHIKI_LEVELS[next]; setGrid(emptyFutoshikiGrid(p)); setSelected(null); setResult(null); };
  const chooseLevel = (next: number) => { setLevelIndex(next); reset(next); };
  const setCell = (value: number | null) => {
    if (!selected || isGiven(puzzle, selected.row, selected.col)) return;
    setGrid(current => current.map((row, r) => row.map((cell, c) => (r === selected.row && c === selected.col ? value : cell))));
    setResult(null);
  };
  const submit = () => setResult(validateFutoshiki(puzzle, grid));
  return { levels: FUTOSHIKI_LEVELS, levelIndex, puzzle, grid, selected, result, chooseLevel, setSelected, setCell, reset: () => reset(), submit };
}
