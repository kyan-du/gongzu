import { useMemo, useState } from 'react';
import { empty, fill, initialWater, isWon, moveLabel, pour } from './engine';
import { WATER_LEVELS } from './levels';
import type { JugId, MoveRecord, WaterLevel } from './types';
export function useWaterGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = WATER_LEVELS[levelIndex];
  const [water, setWater] = useState<WaterLevel>(() => initialWater(level));
  const [selected, setSelected] = useState<JugId | null>(null);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [message, setMessage] = useState('先选一个杯子：可以装满、倒空，或再选另一个杯子互倒。');
  const status = useMemo(() => isWon(level, water) ? 'won' : 'playing', [level, water]);
  function apply(action: string, next: WaterLevel) { if (Object.keys(water).every(id => water[id] === next[id])) return; setHistory(prev => [...prev, { action, before: water, after: next }]); setWater(next); setSelected(null); setMessage(isWon(level, next) ? `成功量出 ${level.target.amount}L！` : action); }
  function chooseLevel(index: number) { const nextLevel = WATER_LEVELS[index]; setLevelIndex(index); setWater(initialWater(nextLevel)); setSelected(null); setHistory([]); setMessage('新关卡开始。先选一个杯子。'); }
  function reset() { setWater(initialWater(level)); setSelected(null); setHistory([]); setMessage('已重新开始。'); }
  function undo() { const last = history[history.length - 1]; if (!last) return; setWater(last.before); setHistory(prev => prev.slice(0, -1)); setSelected(null); setMessage('已撤销一步。'); }
  function selectJug(id: JugId) { if (!selected) { setSelected(id); setMessage('再点另一个杯子可以互倒，也可以点下方按钮装满/倒空。'); return; } if (selected === id) { setSelected(null); setMessage('已取消选择。'); return; } apply(moveLabel(level, 'pour', selected, id), pour(level, water, selected, id)); }
  function fillSelected() { if (selected) apply(moveLabel(level, 'fill', selected), fill(level, water, selected)); }
  function emptySelected() { if (selected) apply(moveLabel(level, 'empty', selected), empty(water, selected)); }
  return { level, levelIndex, levels: WATER_LEVELS, water, selected, history, message, status, chooseLevel, reset, undo, selectJug, fillSelected, emptySelected };
}
