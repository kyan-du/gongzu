import { useEffect, useMemo, useRef, useState } from 'react';
import { checkAnswer, generatePuzzle, type CellContent, type GamePuzzle, type MiniGrid } from '../../../lib/grid-engine';
import { buildFixtureAnswers, buildFixturePuzzle } from '../fixtures/debugFixture';
import type { GamePhase } from '../types';

type UseMemoryGridGameOptions = {
  userId?: string;
  isFixture: boolean;
  initialPhase: GamePhase;
  examMode: boolean;
  quizId: string | null;
};

export function useMemoryGridGame({
  userId,
  isFixture,
  initialPhase,
  examMode,
  quizId,
}: UseMemoryGridGameOptions) {
  // Fixture data (stable across renders)
  const fixtureData = useMemo(() => {
    if (!isFixture) return null;
    const p = buildFixturePuzzle();
    const a = buildFixtureAnswers(p);
    return { puzzle: p, ...a };
  }, [isFixture]);

  const [phase, setPhase] = useState<GamePhase>(isFixture ? initialPhase : 'watch1');
  const [puzzle, setPuzzle] = useState<GamePuzzle | null>(isFixture ? fixtureData!.puzzle : null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0);
  const [phase1Answers, setPhase1Answers] = useState<CellContent[]>(isFixture ? fixtureData!.phase1Answers : []);
  const [phase2Answers, setPhase2Answers] = useState<CellContent[]>(isFixture ? fixtureData!.phase2Answers : []);
  const [startTime] = useState(Date.now());

  // 每日进度（从 API 获取）
  const [dailyCompleted, setDailyCompleted] = useState(0);

  const timerRef = useRef<number | null>(null);
  const timeUpRef = useRef(false);
  const dragDroppedRef = useRef(false);

  // 获取今日进度
  useEffect(() => {
    if (!userId) return;
    const today = new Date().toLocaleDateString('sv-SE');

    fetch(`/api/memory-game?userId=${userId}&date=${today}&type=grid`)
      .then((r) => r.json())
      .then((data: any) => setDailyCompleted(data.completed || 0))
      .catch(() => {});
  }, [userId]);

  // 初始化游戏（fixture 模式跳过）
  useEffect(() => {
    if (!isFixture) setPuzzle(generatePuzzle());
  }, [isFixture]);

  const handlePhase1Submit = () => {
    setPhase('watch2');
    setTimeLeft(90);
    setCurrentAnswerIndex(0);
  };

  const handlePhase2Submit = () => {
    setPhase('result');
    if (timerRef.current) clearInterval(timerRef.current);

    // 提交成绩到 API（fixture 模式不提交）
    if (!puzzle) return;
    if (isFixture) return;
    const phase1Result = checkAnswer(puzzle.matrix, puzzle.phase1Hidden, phase1Answers as MiniGrid);
    const phase2Result1 = checkAnswer(puzzle.matrix, puzzle.phase2Hidden[0], [
      phase2Answers[0],
      phase2Answers[1],
      phase2Answers[2],
      phase2Answers[3],
    ] as MiniGrid);
    const phase2Result2 = checkAnswer(puzzle.matrix, puzzle.phase2Hidden[1], [
      phase2Answers[4],
      phase2Answers[5],
      phase2Answers[6],
      phase2Answers[7],
    ] as MiniGrid);

    const totalCorrect = phase1Result.correct + phase2Result1.correct + phase2Result2.correct;
    const totalQuestions = 12;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
    const durationSec = Math.round((Date.now() - startTime) / 1000);

    const cellTransformsCount = puzzle.rules.cellTransforms.filter(t => t !== 'none').length;
    const detail = {
      phase1: { correct: phase1Result.correct, total: 4 },
      phase2: {
        correct: phase2Result1.correct + phase2Result2.correct,
        total: 8,
      },
      rule: `cellTransforms:${cellTransformsCount}+${puzzle.rules.positionTransform}+${puzzle.rules.sizeTransform}`,
    };

    // Exam mode: submit to exam endpoint
    if (examMode && quizId) {
      fetch('/api/memory-game/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          quizId,
          total: totalQuestions,
          correct: totalCorrect,
          accuracy,
          durationSec,
          detail: JSON.stringify(detail),
        }),
      })
        .then((r) => r.json())
        .then((data: any) => setDailyCompleted(data.alreadySubmitted ? dailyCompleted : dailyCompleted + 1))
        .catch(() => {});
      return;
    }

    // Training mode: no recording
  };

  // 倒计时（fixture 的 result 阶段不启动）
  useEffect(() => {
    if (phase === 'result') return;
    if (isFixture && initialPhase === 'result') return;
    timeUpRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          timeUpRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isFixture, initialPhase]);

  // 时间到了，自动进入下一阶段（在 render cycle 外处理）
  useEffect(() => {
    if (timeLeft !== 0 || !timeUpRef.current) return;
    timeUpRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === 'watch1') { setPhase('answer1'); setTimeLeft(90); }
    else if (phase === 'answer1') { handlePhase1Submit(); }
    else if (phase === 'watch2') { setPhase('answer2'); setTimeLeft(90); }
    else if (phase === 'answer2') { handlePhase2Submit(); }
  }, [timeLeft]);

  const startAnswerPhase1 = () => {
    setPhase('answer1');
    setTimeLeft(90);
  };

  const startAnswerPhase2 = () => {
    setPhase('answer2');
    setTimeLeft(90);
  };

  const restart = () => {
    setPuzzle(generatePuzzle());
    setPhase('watch1');
    setTimeLeft(90);
    setPhase1Answers([]);
    setPhase2Answers([]);
    setCurrentAnswerIndex(0);
  };

  return {
    puzzle,
    phase,
    setPhase,
    timeLeft,
    currentAnswerIndex,
    phase1Answers,
    phase2Answers,
    setCurrentAnswerIndex,
    setPhase1Answers,
    setPhase2Answers,
    dragDroppedRef,
    handlePhase1Submit,
    handlePhase2Submit,
    startAnswerPhase1,
    startAnswerPhase2,
    restart,
  };
}
