import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Target, Frown, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../components/Layout';
import BalanceScale from '../components/BalanceScale';
import {
  generateBalancePuzzle,
  type BalancePuzzle,
  type BalanceDifficulty,
} from '../lib/balance-engine';

type GamePhase = 'playing' | 'feedback' | 'result';

const TOTAL_ROUNDS = 5;


function randomDifficulty(): BalanceDifficulty {
  const choices: BalanceDifficulty[] = ['easy', 'medium', 'hard'];
  return choices[Math.floor(Math.random() * choices.length)];
}

function difficultyLabel(d: BalanceDifficulty): string {
  switch (d) {
    case 'easy': return '⭐';
    case 'medium': return '⭐⭐';
    case 'hard': return '⭐⭐⭐';
  }
}

export default function BalanceSort() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>('playing');
  const [round, setRound] = useState(1);
  const [puzzle, setPuzzle] = useState<BalancePuzzle | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [scores, setScores] = useState<boolean[]>([]);    // true = correct per round
  const [roundDifficulties, setRoundDifficulties] = useState<BalanceDifficulty[]>([]);
  const [wrongPicks, setWrongPicks] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Generate puzzle for current round
  const newPuzzle = useCallback(() => {
    const difficulty = randomDifficulty();
    setPuzzle(generateBalancePuzzle(difficulty));
    setRoundDifficulties((prev) => {
      const next = [...prev];
      next[round - 1] = difficulty;
      return next;
    });
    setSelectedOption(null);
    setWrongPicks(new Set());
    setPhase('playing');
  }, [round]);

  useEffect(() => {
    newPuzzle();
  }, [newPuzzle]);

  // Handle option selection
  const handleSelect = (index: number) => {
    if (phase !== 'playing') return;
    if (wrongPicks.has(index)) return; // already tried this one

    if (puzzle && index === puzzle.correctIndex) {
      // Correct! Record score (first try = no wrong picks)
      setSelectedOption(index);
      setScores((prev) => [...prev, wrongPicks.size === 0]);
      setPhase('feedback');
    } else {
      // Wrong — mark this option and let them try again
      setWrongPicks((prev) => new Set(prev).add(index));
    }
  };

  // After feedback, advance round or show results
  const handleNext = () => {
    if (round >= TOTAL_ROUNDS) {
      setPhase('result');
    } else {
      setRound((r) => r + 1);
      // newPuzzle will be called via useEffect
    }
  };

  // Submit results to API
  useEffect(() => {
    if (phase !== 'result' || submitted || !userId) return;

    const correctCount = scores.filter(Boolean).length;
    const today = new Date().toLocaleDateString('sv-SE');

    fetch('/api/memory-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        date: today,
        type: 'balance',
        completed: 1,
        total: TOTAL_ROUNDS,
        correct: correctCount,
        details: {
          rounds: scores.map((s, i) => ({
            round: i + 1,
            difficulty: roundDifficulties[i] || 'easy',
            correct: s,
          })),
        },
      }),
    })
      .then(() => setSubmitted(true))
      .catch(() => setSubmitted(true));
  }, [phase, submitted, userId, scores, roundDifficulties]);

  // Restart game
  const handleRestart = () => {
    setRound(1);
    setScores([]);
    setRoundDifficulties([]);
    setSubmitted(false);
    // newPuzzle will fire via useEffect
  };

  // ── Result screen ──
  if (phase === 'result') {
    const correctCount = scores.filter(Boolean).length;
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100);

    const resultColor =
      accuracy === 100 ? 'text-emerald-500' :
      accuracy >= 60 ? 'text-amber-500' : 'text-red-500';
    const resultBg =
      accuracy === 100 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
      accuracy >= 60 ? 'bg-amber-100 dark:bg-amber-900/30' :
      'bg-red-100 dark:bg-red-900/30';
    const ResultIcon = accuracy === 100 ? Trophy : accuracy >= 40 ? Target : Frown;

    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-2xl">
        <div className="flex flex-col items-center py-8">
          {/* Score summary */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${resultBg}`}>
              <ResultIcon className={`w-7 h-7 ${resultColor}`} />
            </div>
            <div>
              <span className={`text-4xl font-bold ${resultColor}`}>{accuracy}%</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                答对 {correctCount} / {TOTAL_ROUNDS}
              </span>
            </div>
          </div>

          {/* Round details */}
          <div className="w-full max-w-sm mb-8 space-y-2">
            {scores.map((correct, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                  correct
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  第 {i + 1} 轮 {difficultyLabel(roundDifficulties[i] || 'easy')}
                </span>
                {correct ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-700 transition"
            >
              再玩一次
            </button>
            <button
              onClick={() => navigate(`/${userId}/brain`)}
              className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              返回选择
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Loading ──
  if (!puzzle) {
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-2xl">
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">加载中...</div>
      </Layout>
    );
  }

  // ── Playing / Feedback ──

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-2xl">
      <div className="flex flex-col items-center">
        {/* Header: round + difficulty */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ⚖️ 天平排序
            </h1>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {difficultyLabel(puzzle.difficulty)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i < round - 1
                    ? scores[i]
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                    : i === round - 1
                    ? 'bg-violet-500 scale-125'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Prompt */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          观察天平，选出{puzzle.direction === 'heavy-to-light' ? '从重到轻' : '从轻到重'}的正确顺序
        </p>

        {/* Balance scales grid */}
        <div className={`w-full grid gap-3 mb-6 ${
          puzzle.comparisons.length <= 4
            ? 'grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}>
          {puzzle.comparisons.map((comp, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 aspect-[5/4] flex items-center justify-center"
            >
              <BalanceScale
                leftItem={comp.left}
                rightItem={comp.right}
                heavier={comp.heavier}
              />
            </div>
          ))}
        </div>

        {/* Answer options */}
        <div className="w-full space-y-2.5 mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            选择正确的排序（{puzzle.direction === 'heavy-to-light' ? '重 → 轻' : '轻 → 重'}）
          </p>

          {/* Numbered style legend — big emojis with number badges */}
          {puzzle.answerStyle === 'numbered' && puzzle.numberMap && (
            <div className="flex items-center justify-center gap-5 flex-wrap py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-2">
              {puzzle.items.map((emoji) => (
                <div key={emoji} className="flex flex-col items-center gap-0.5">
                  <span className="text-3xl">{emoji}</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-sm font-bold">
                    {puzzle.numberMap![emoji]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Options: 2-col grid for numbered, stacked for emoji */}
          {(() => {
            const isNumbered = puzzle.answerStyle === 'numbered' && puzzle.numberMap;
            return (
              <div className="grid grid-cols-2 gap-2.5">
                {puzzle.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isAnswer = idx === puzzle.correctIndex;
                  const isWrong = wrongPicks.has(idx);

                  let btnClass =
                    'w-full px-4 py-3 rounded-xl font-medium transition-all ';
                  btnClass += isNumbered ? 'text-center ' : 'text-left ';

                  if (phase === 'feedback') {
                    if (isAnswer) {
                      btnClass += 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500';
                    } else if (isSelected && !isAnswer) {
                      btnClass += 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-2 ring-red-500';
                    } else {
                      btnClass += 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
                    }
                  } else if (isWrong) {
                    // Wrong pick during playing: dim with red strike-through
                    btnClass += 'bg-red-50 dark:bg-red-900/10 text-red-300 dark:text-red-800 border border-red-200 dark:border-red-800 opacity-50 cursor-not-allowed';
                  } else {
                    btnClass +=
                      'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border border-gray-200 dark:border-gray-700';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={phase !== 'playing'}
                      className={btnClass}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {phase === 'feedback' && isAnswer && (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mr-1 flex-shrink-0" />
                        )}
                        {phase === 'feedback' && isSelected && !isAnswer && (
                          <XCircle className="w-5 h-5 text-red-500 mr-1 flex-shrink-0" />
                        )}
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-bold text-gray-600 dark:text-gray-300 mr-1 flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {isNumbered ? (
                          <span className="text-xl font-bold tracking-widest">
                            {option.map((emoji) => puzzle.numberMap![emoji]).join('')}
                          </span>
                        ) : (
                          <span className="text-lg tracking-wide">
                            {option.join(puzzle.direction === 'heavy-to-light' ? ' > ' : ' < ')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Feedback: Next button */}
        {phase === 'feedback' && (
          <button
            onClick={handleNext}
            className="px-8 py-3 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition shadow-lg"
          >
            {round >= TOTAL_ROUNDS ? '查看成绩' : '下一题 →'}
          </button>
        )}
      </div>
    </Layout>
  );
}
