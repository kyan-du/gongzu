import { useState } from 'react';
import { emptySkyscrapersGrid, isGiven, validateSkyscrapers } from './engine';
import { SKYSCRAPERS_LEVELS } from './levels';
import type { SkyscrapersCheck } from './types';

export function useSkyscrapersGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const puzzle = SKYSCRAPERS_LEVELS[levelIndex];
  const [grid, setGrid] = useState(() => emptySkyscrapersGrid(puzzle));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [result, setResult] = useState<SkyscrapersCheck | null>(null);
  const reset = (next = levelIndex) => { const p = SKYSCRAPERS_LEVELS[next]; setGrid(emptySkyscrapersGrid(p)); setSelected(null); setResult(null); };
  const chooseLevel = (next: number) => { setLevelIndex(next); reset(next); };
  const setCell = (value: number | null) => {
    if (!selected || isGiven(puzzle, selected.row, selected.col)) return;
    setGrid(current => current.map((row, r) => row.map((cell, c) => (r === selected.row && c === selected.col ? value : cell))));
    setResult(null);
  };
  const submit = () => setResult(validateSkyscrapers(puzzle, grid));
  return { levels: SKYSCRAPERS_LEVELS, levelIndex, puzzle, grid, selected, result, chooseLevel, setSelected, setCell, reset: () => reset(), submit };
}
