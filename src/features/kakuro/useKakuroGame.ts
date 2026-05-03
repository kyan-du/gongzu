import { useState } from 'react';
import { emptyKakuroGrid, isPlayCell, validateKakuro } from './engine';
import { KAKURO_LEVELS } from './levels';
import type { KakuroCheck } from './types';

export function useKakuroGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const puzzle = KAKURO_LEVELS[levelIndex];
  const [grid, setGrid] = useState(() => emptyKakuroGrid(puzzle));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [result, setResult] = useState<KakuroCheck | null>(null);
  const reset = (next = levelIndex) => { const p = KAKURO_LEVELS[next]; setGrid(emptyKakuroGrid(p)); setSelected(null); setResult(null); };
  const chooseLevel = (next: number) => { setLevelIndex(next); reset(next); };
  const setCell = (value: number | null) => { if (!selected || !isPlayCell(puzzle, selected.row, selected.col)) return; setGrid(current => current.map((row, r) => row.map((cell, c) => (r === selected.row && c === selected.col ? value : cell)))); setResult(null); };
  const submit = () => setResult(validateKakuro(puzzle, grid));
  return { levels: KAKURO_LEVELS, levelIndex, puzzle, grid, selected, result, chooseLevel, setSelected, setCell, reset: () => reset(), submit };
}
