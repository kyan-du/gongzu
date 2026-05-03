import { useMemo, useState } from 'react';
import { toggleCell, isSolved } from './engine';
import { LIGHTS_OUT_LEVELS } from './levels';
import type { LightsOutMove } from './types';

export function useLightsOutGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LIGHTS_OUT_LEVELS[levelIndex] || LIGHTS_OUT_LEVELS[0];
  const [board, setBoard] = useState<boolean[]>(() => level.start);
  const [history, setHistory] = useState<LightsOutMove[]>([]);
  const solved = useMemo(() => isSolved(board), [board]);

  function chooseLevel(index: number) {
    const nextLevel = LIGHTS_OUT_LEVELS[index] || LIGHTS_OUT_LEVELS[0];
    setLevelIndex(index);
    setBoard(nextLevel.start);
    setHistory([]);
  }

  function press(index: number) {
    if (solved) return;
    const next = toggleCell(board, level.size, index);
    setHistory(prev => [...prev, { index, before: board, after: next }]);
    setBoard(next);
  }

  function undo() {
    setHistory(prev => {
      const last = prev[prev.length - 1];
      if (last) setBoard(last.before);
      return prev.slice(0, -1);
    });
  }

  function reset() {
    setBoard(level.start);
    setHistory([]);
  }

  return {
    level,
    levelIndex,
    levels: LIGHTS_OUT_LEVELS,
    board,
    history,
    solved,
    chooseLevel,
    press,
    undo,
    reset,
  };
}
