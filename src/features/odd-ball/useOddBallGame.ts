import { useMemo, useState } from 'react';
import { createBalls, deterministicOddBall, weigh } from './engine';
import { ODD_BALL_LEVELS } from './levels';
import type { PanSide, WeighRecord } from './types';

export function useOddBallGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [left, setLeft] = useState<number[]>([]);
  const [right, setRight] = useState<number[]>([]);
  const [records, setRecords] = useState<WeighRecord[]>([]);
  const [activeSide, setActiveSide] = useState<PanSide>('left');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const level = ODD_BALL_LEVELS[levelIndex];
  const balls = useMemo(() => createBalls(level.ballCount), [level.ballCount]);
  const oddBall = useMemo(() => deterministicOddBall(level.id, level.ballCount), [level.id, level.ballCount]);
  const used = new Set([...left, ...right]);
  const pool = balls.filter(ball => !used.has(ball));
  const remainingWeighs = level.maxWeighs - records.length;
  const solved = submitted && selectedAnswer === oddBall;
  const failed = submitted && selectedAnswer !== oddBall;

  const clearPans = () => {
    setLeft([]);
    setRight([]);
  };

  const chooseLevel = (nextIndex: number) => {
    setLevelIndex(nextIndex);
    setRecords([]);
    setActiveSide('left');
    setSelectedAnswer(null);
    setSubmitted(false);
    clearPans();
  };

  const placeBallOnSide = (ball: number, side: PanSide) => {
    if (submitted) return;
    setLeft(current => current.filter(item => item !== ball));
    setRight(current => current.filter(item => item !== ball));

    if (side === 'left') setLeft(current => [...current, ball].sort((a, b) => a - b));
    if (side === 'right') setRight(current => [...current, ball].sort((a, b) => a - b));
  };

  const placeBall = (ball: number) => placeBallOnSide(ball, activeSide);

  const resetCurrentWeigh = () => clearPans();

  const doWeigh = () => {
    if (submitted || remainingWeighs <= 0 || left.length === 0 || left.length !== right.length) return;
    const result = weigh(left, right, oddBall);
    setRecords(current => [...current, { left, right, result }]);
    clearPans();
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    setSubmitted(true);
  };

  const restart = () => {
    setRecords([]);
    setActiveSide('left');
    setSelectedAnswer(null);
    setSubmitted(false);
    clearPans();
  };

  return {
    levels: ODD_BALL_LEVELS,
    level,
    levelIndex,
    balls,
    pool,
    left,
    right,
    records,
    activeSide,
    selectedAnswer,
    remainingWeighs,
    solved,
    failed,
    oddBall,
    canWeigh: !submitted && remainingWeighs > 0 && left.length > 0 && left.length === right.length,
    chooseLevel,
    setActiveSide,
    placeBall,
    placeBallOnSide,
    resetCurrentWeigh,
    doWeigh,
    setSelectedAnswer,
    submitAnswer,
    restart,
  };
}
