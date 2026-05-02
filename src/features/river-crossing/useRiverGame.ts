import { useMemo, useState } from 'react';
import { checkDanger, initialPositions, isWon, opposite } from './engine';
import { LEVELS } from './levels';
import type { Bank, GameStatus, ItemId, MoveRecord } from './types';

const INITIAL_MESSAGE = '把角色放上船，再点「开船」。';

export function useRiverGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const [positions, setPositions] = useState<Record<ItemId, Bank>>(() => initialPositions(level));
  const [boatBank, setBoatBank] = useState<Bank>('left');
  const [passengers, setPassengers] = useState<ItemId[]>([]);
  const [message, setMessage] = useState(INITIAL_MESSAGE);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<MoveRecord[]>([]);

  const leftItems = useMemo(
    () => level.items.filter(item => positions[item.id] === 'left' && !passengers.includes(item.id)),
    [level.items, positions, passengers]
  );
  const rightItems = useMemo(
    () => level.items.filter(item => positions[item.id] === 'right' && !passengers.includes(item.id)),
    [level.items, positions, passengers]
  );
  const boatItems = useMemo(
    () => level.items.filter(item => passengers.includes(item.id)),
    [level.items, passengers]
  );
  const totalWeight = useMemo(
    () => boatItems.reduce((sum, item) => sum + (item.weight || 0), 0),
    [boatItems]
  );

  const chooseLevel = (index: number) => {
    const next = LEVELS[index];
    setLevelIndex(index);
    setPositions(initialPositions(next));
    setBoatBank('left');
    setPassengers([]);
    setMessage(INITIAL_MESSAGE);
    setStatus('playing');
    setMoves(0);
    setHistory([]);
  };

  const reset = () => chooseLevel(levelIndex);

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) {
      setMessage('还没有可以撤销的步骤。');
      return;
    }
    setPositions(last.beforePositions);
    setBoatBank(last.beforeBoatBank);
    setPassengers([]);
    setStatus(last.beforeStatus);
    setMoves(Math.max(0, moves - 1));
    setHistory(history.slice(0, -1));
    setMessage(`已撤销一步，回到${last.beforeBoatBank === 'left' ? '左岸' : '右岸'}出发。`);
  };

  const boardItem = (id: ItemId) => {
    if (status !== 'playing') return;
    if (positions[id] !== boatBank) {
      setMessage('船不在这一岸，先把船开回来。');
      return;
    }
    if (passengers.includes(id)) {
      setPassengers(passengers.filter(p => p !== id));
      setMessage('角色下船了，可以换一个。');
      return;
    }
    if (passengers.length >= level.capacity) {
      setMessage(`船最多只能坐 ${level.capacity} 个。`);
      return;
    }
    const item = level.items.find(i => i.id === id)!;
    if (level.maxWeight && totalWeight + (item.weight || 0) > level.maxWeight) {
      setMessage(`太重了，船最多承重 ${level.maxWeight}。`);
      return;
    }
    setPassengers([...passengers, id]);
    setMessage(`已把${item.name}放上船。`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (level.items.some(item => item.id === id)) boardItem(id);
  };

  const canSail = status === 'playing';

  const sail = () => {
    if (status !== 'playing') return;
    if (passengers.length === 0 && level.needsDriver) {
      setMessage('这关需要会划船的人在船上。');
      return;
    }
    if (level.needsDriver && !boatItems.some(i => i.canDrive)) {
      setMessage('这关需要会划船的人在船上。');
      return;
    }

    const nextBank = opposite(boatBank);
    const nextPositions = { ...positions };
    passengers.forEach(id => nextPositions[id] = nextBank);
    setHistory(prev => [...prev, { from: boatBank, to: nextBank, passengers, beforePositions: positions, beforeBoatBank: boatBank, beforeStatus: status, beforeMessage: message }]);
    setPositions(nextPositions);
    setBoatBank(nextBank);
    setPassengers([]);
    setMoves(m => m + 1);

    const danger = checkDanger(level, nextPositions, nextBank);
    if (danger) {
      setStatus('failed');
      setMessage(`失败：${danger}`);
      return;
    }
    if (isWon(level, nextPositions)) {
      setStatus('won');
      setMessage(`第 ${levelIndex + 1} 关通过！`);
      return;
    }
    setMessage(passengers.length ? `船到了${nextBank === 'left' ? '左岸' : '右岸'}，下一步从这里出发。` : `空船回到${nextBank === 'left' ? '左岸' : '右岸'}，可以继续接角色。`);
  };

  return {
    level,
    levelIndex,
    levels: LEVELS,
    positions,
    boatBank,
    passengers,
    message,
    status,
    moves,
    history,
    leftItems,
    rightItems,
    boatItems,
    totalWeight,
    canSail,
    chooseLevel,
    reset,
    undo,
    boardItem,
    handleDrop,
    sail,
  };
}
