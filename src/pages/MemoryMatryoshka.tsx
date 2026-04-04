import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, Target, Frown } from 'lucide-react';
import Layout from '../components/Layout';

// 莫兰迪色调（柔和不刺眼）
const COLORS = [
  { name: 'rose', text: '#d4677a', border: '#d4677a' },
  { name: 'orange', text: '#e89b6d', border: '#e89b6d' },
  { name: 'gold', text: '#ddb76c', border: '#ddb76c' },
  { name: 'green', text: '#7fae89', border: '#7fae89' },
  { name: 'sky', text: '#79a8bd', border: '#79a8bd' },
  { name: 'indigo', text: '#7c87b8', border: '#7c87b8' },
  { name: 'purple', text: '#9f7bb0', border: '#9f7bb0' },
  { name: 'coral', text: '#e0877d', border: '#e0877d' },
];

type GamePhase = 'prepare' | 'memorize' | 'answer' | 'result';

interface Card {
  id: string;
  position: number; // 0-11
  number: number | string; // 1-9 或 A-K
  textColor: string;
  borderColor: string;
}

interface UserAnswer {
  position: number;
  cardId: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 生成套娃规则的卡片
function generateCards(): { cards: Card[]; decoys: Card[] } {
  const cardCount = 6;

  // 为每列随机选上排(0-5)或下排(6-11)，保证上下各至少2张
  let positions: number[] = [];
  let topCount = 0;
  let bottomCount = 0;
  do {
    positions = [];
    topCount = 0;
    bottomCount = 0;
    for (let col = 0; col < 6; col++) {
      const row = Math.random() < 0.5 ? 0 : 1;
      positions.push(row * 6 + col);
      if (row === 0) topCount++;
      else bottomCount++;
    }
  } while (topCount < 2 || bottomCount < 2);
  // 按行优先阅读顺序排列（上排左→右，下排左→右）
  positions.sort((a, b) => a - b);

  // 每张卡片分配独立的边框色和文字色，保证不重复
  const shuffledColors = shuffle([...COLORS]);
  const borderColors = shuffledColors.slice(0, cardCount);
  // 文字色：旋转一位，保证每张卡片文字色≠自己的边框色
  const textColors = [...borderColors.slice(1), borderColors[0]];

  // 随机选择本题使用数字还是字母
  const useLetters = Math.random() < 0.5;
  const pool = useLetters
    ? ['A','B','C','D','E','F','G','H','J','K']
    : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const symbols = shuffle([...pool]).slice(0, cardCount);

  const cards: Card[] = [];
  for (let i = 0; i < cardCount; i++) {
    cards.push({
      id: `card-${i}`,
      position: positions[i],
      number: symbols[i],
      textColor: textColors[i].text,
      borderColor: borderColors[i].border,
    });
  }

  // 为每张正确卡片生成 1 个迷惑项（同数字/字母，但颜色组合不同）
  const decoys: Card[] = [];
  for (let i = 0; i < cards.length; i++) {
    const original = cards[i];
    // 随机选不同的颜色对
    const otherTextColors = COLORS.filter(c => c.text !== original.textColor);
    const otherBorderColors = COLORS.filter(c => c.border !== original.borderColor);
    const decoyText = otherTextColors[Math.floor(Math.random() * otherTextColors.length)];
    const decoyBorder = otherBorderColors[Math.floor(Math.random() * otherBorderColors.length)];

    decoys.push({
      id: `decoy-${i}`,
      position: -1, // 不在网格中
      number: original.number,
      textColor: decoyText.text,
      borderColor: decoyBorder.border,
    });
  }

  return {
    cards: cards.sort((a, b) => a.position - b.position),
    decoys,
  };
}

export default function MemoryMatryoshka() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>('prepare');
  const [cards, setCards] = useState<Card[]>([]);
  const [allChoices, setAllChoices] = useState<Card[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [memorizeTime, setMemorizeTime] = useState(30);
  const [answerTime, setAnswerTime] = useState(30);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // 每日进度
  const [dailyCompleted, setDailyCompleted] = useState(0);
  const dailyTarget = 5;
  // 计时
  const [startTime, setStartTime] = useState<number>(0);
  // 是否已提交
  const [submitted, setSubmitted] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 获取今日进度
  useEffect(() => {
    if (!userId) return;
    const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    fetch(`/api/memory-game?userId=${userId}&date=${today}&type=matryoshka`)
      .then(r => r.json())
      .then((data: any) => setDailyCompleted(data.completed || 0))
      .catch(() => {});
  }, [userId]);

  // 初始化游戏
  useEffect(() => {
    const { cards: newCards, decoys: newDecoys } = generateCards();
    setCards(newCards);
    setAllChoices(shuffle([...newCards, ...newDecoys]));
  }, []);

  // 准备阶段倒计时
  useEffect(() => {
    if (phase === 'prepare' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'prepare' && countdown === 0) {
      setPhase('memorize');
      setMemorizeTime(30);
    }
  }, [phase, countdown]);

  // 记忆阶段倒计时
  useEffect(() => {
    if (phase === 'memorize' && memorizeTime > 0) {
      const timer = setTimeout(() => setMemorizeTime(memorizeTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'memorize' && memorizeTime === 0) {
      setTimeout(() => { setPhase('answer'); setStartTime(Date.now()); }, 1000);
    }
  }, [phase, memorizeTime]);

  // 答题阶段倒计时
  useEffect(() => {
    if (phase === 'answer' && answerTime > 0) {
      const timer = setTimeout(() => setAnswerTime(answerTime - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'answer' && answerTime === 0) {
      setPhase('result');
    }
  }, [phase, answerTime]);

  // 拖拽处理
  const handlePointerDown = (e: React.PointerEvent, cardId: string) => {
    if (e.button !== 0) return; // 只处理左键/主指
    e.preventDefault(); // 防止拖拽时触发文本选中
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDraggedCard(cardId);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!draggedCard) return;

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      setDragPosition({ x: e.clientX, y: e.clientY });
    };

    const onUp = (e: PointerEvent) => {
      if (!gridRef.current) {
        setDraggedCard(null);
        setDragPosition(null);
        return;
      }

      const cells = gridRef.current.querySelectorAll('[data-position]');
      let targetPosition: number | null = null;
      cells.forEach((cell) => {
        const rect = cell.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          targetPosition = Number(cell.getAttribute('data-position'));
        }
      });

      if (targetPosition !== null && cards.find(c => c.position === targetPosition)) {
        setUserAnswers(prev => {
          const newAnswers = prev.filter(a => a.position !== targetPosition);
          newAnswers.push({ position: targetPosition!, cardId: draggedCard });
          return newAnswers;
        });
      }

      setDraggedCard(null);
      setDragPosition(null);
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [draggedCard, cards]);

  // 点击选择卡片
  const handleCardClick = (cardId: string) => {
    if (selectedCard === cardId) {
      setSelectedCard(null);
    } else {
      setSelectedCard(cardId);
    }
  };

  // 点击格子放置卡片
  const handleCellClick = (position: number) => {
    if (selectedCard) {
      // 移除该位置的旧答案
      const newAnswers = userAnswers.filter(a => a.position !== position);
      // 添加新答案
      newAnswers.push({ position, cardId: selectedCard });
      setUserAnswers(newAnswers);
      setSelectedCard(null);
    } else {
      // 点击已占格子，弹回选项区
      setUserAnswers(userAnswers.filter(a => a.position !== position));
    }
  };

  // 提交答案
  const handleSubmit = () => {
    setPhase('result');
  };

  // 计算得分
  const correctCount = userAnswers.filter(a => {
    const card = cards.find(c => c.id === a.cardId);
    return card && card.position === a.position;
  }).length;

  // 进入结果页时自动提交成绩
  useEffect(() => {
    if (phase !== 'result' || submitted || !userId) return;
    const today = new Date().toLocaleDateString('sv-SE');
    const durationSec = startTime > 0 ? Math.round((Date.now() - startTime) / 1000) : null;
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

    fetch('/api/memory-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        date: today,
        gameType: 'matryoshka',
        total: cards.length,
        correct: correctCount,
        accuracy,
        durationSec,
      }),
    })
      .then(r => r.json())
      .then((data: any) => {
        setDailyCompleted(data.completed || dailyCompleted + 1);
        setSubmitted(true);
      })
      .catch(() => setSubmitted(true));
  }, [phase]);

  // 所有选项卡片始终显示，已放置的变灰
  const placedCardIds = new Set(userAnswers.map(a => a.cardId));

  // 准备阶段
  if (phase === 'prepare') {
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/home`} maxWidth="max-w-4xl">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              套娃记忆
            </h2>
            <div className="text-8xl font-bold text-violet-500 mb-2">
              {countdown}
            </div>
            <p className="text-gray-500 dark:text-gray-400">准备好，记住所有卡片的位置</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 记忆阶段
  if (phase === 'memorize') {
    const progress = (1 - memorizeTime / 30) * 100;

    return (
      <Layout userId={userId || ''} maxWidth="max-w-4xl">
        {/* 渐变进度条 */}
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-orange-400 to-red-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-500 dark:text-gray-400">记住卡片的位置和颜色</p>
        </div>

        {/* 2×6 网格 */}
        <div className="grid grid-cols-6 gap-3 max-w-3xl mx-auto mb-6 select-none">
          {[...Array(12)].map((_, idx) => {
            const card = cards.find(c => c.position === idx);
            return (
              <div
                key={idx}
                className={`aspect-[3/4] rounded-xl flex items-center justify-center shadow-md transition-all ${
                  card
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-100 dark:bg-gray-800/50'
                }`}
                style={{
                  border: card ? `5px solid ${card.borderColor}` : undefined,
                }}
              >
                {!card && (
                  <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600" />
                )}
                {card && (
                  <div
                    className="text-5xl font-bold"
                    style={{ color: card.textColor }}
                  >
                    {card.number}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => { setPhase('answer'); setStartTime(Date.now()); }}
            className="px-5 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition"
          >
            记好了，开始答题 →
          </button>
        </div>
      </Layout>
    );
  }

  // 作答阶段
  if (phase === 'answer') {
    return (
      <Layout userId={userId || ''} maxWidth="max-w-4xl">
        <div className="select-none">
        <div className="mb-4">
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${(answerTime / 30) * 100}%`,
                background: answerTime > 10 ? 'linear-gradient(90deg, #8b5cf6, #6366f1)' : answerTime > 5 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : '#ef4444',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{answerTime}秒</p>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            把卡片拖回原位
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            可以拖拽或点击，已放置的卡片可以点击取回
          </p>
        </div>

        {/* 上方：作答网格 */}
        <div
          ref={gridRef}
          className="grid grid-cols-6 gap-3 max-w-3xl mx-auto mb-8 select-none"
        >
          {[...Array(12)].map((_, idx) => {
            const isTarget = cards.some(c => c.position === idx);
            const answer = userAnswers.find(a => a.position === idx);
            const card = answer ? allChoices.find(c => c.id === answer.cardId) : null;

            return (
              <div
                key={idx}
                data-position={idx}
                className={`aspect-[3/4] rounded-xl flex items-center justify-center transition-all ${
                  isTarget ? 'cursor-pointer hover:scale-105' : ''
                } ${
                  isTarget
                    ? card
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-400 dark:border-gray-500'
                    : 'bg-gray-100 dark:bg-gray-800/30 border-2 border-gray-200 dark:border-gray-700'
                }`}
                style={{
                  ...(isTarget && card ? { border: `5px solid ${card.borderColor}` } : {}),
                  touchAction: 'none',
                }}
                onClick={() => isTarget && handleCellClick(idx)}
              >
                {card && (
                  <div
                    className="text-5xl font-bold"
                    style={{ color: card.textColor }}
                  >
                    {card.number}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 下方：选项卡片区 */}
        <div className="max-w-3xl mx-auto mb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-center">
            可选卡片
          </p>
          <div className="grid grid-cols-6 gap-3 max-w-md mx-auto select-none">
            {allChoices.map((card) => {
              const isPlaced = placedCardIds.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`aspect-[3/4] rounded-xl flex items-center justify-center shadow-md transition-all ${
                    isPlaced
                      ? 'opacity-30 cursor-default'
                      : `cursor-pointer bg-white dark:bg-gray-800 ${
                          selectedCard === card.id
                            ? 'ring-4 ring-violet-400 scale-110'
                            : 'hover:scale-105'
                        }`
                  } ${draggedCard === card.id ? 'opacity-50' : ''}`}
                  style={{
                    border: `5px solid ${card.borderColor}`,
                    touchAction: 'none',
                    ...(isPlaced ? { backgroundColor: 'transparent' } : {}),
                  }}
                  onPointerDown={(e) => !isPlaced && handlePointerDown(e, card.id)}
                  onClick={() => !isPlaced && handleCardClick(card.id)}
                >
                  <div
                    className="text-4xl font-bold"
                    style={{ color: card.textColor }}
                  >
                    {card.number}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 拖拽中的卡片副本 */}
        {draggedCard && dragPosition && (
          <div
            className="fixed pointer-events-none z-50 w-16 h-20 rounded-xl flex items-center justify-center shadow-2xl opacity-80 bg-white dark:bg-gray-800"
            style={{
              left: dragPosition.x - dragOffsetRef.current.x,
              top: dragPosition.y - dragOffsetRef.current.y,
              border: `5px solid ${allChoices.find(c => c.id === draggedCard)?.borderColor}`,
            }}
          >
            <div
              className="text-4xl font-bold"
              style={{ color: allChoices.find(c => c.id === draggedCard)?.textColor }}
            >
              {allChoices.find(c => c.id === draggedCard)?.number}
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={userAnswers.length !== cards.length}
            className="px-8 py-3 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            提交答案
          </button>
          {userAnswers.length < cards.length && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              还有 {cards.length - userAnswers.length} 张卡片未放置
            </p>
          )}
        </div>
        </div>
      </Layout>
    );
  }

  // 结果展示
  if (phase === 'result') {
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

    // 根据正确率决定颜色和图标
    const resultColor = accuracy === 100
      ? 'text-emerald-500'
      : accuracy === 0
        ? 'text-red-500'
        : accuracy >= 50
          ? 'text-amber-500'
          : 'text-orange-500';

    const resultBg = accuracy === 100
      ? 'bg-emerald-100 dark:bg-emerald-900/30'
      : accuracy === 0
        ? 'bg-red-100 dark:bg-red-900/30'
        : 'bg-amber-100 dark:bg-amber-900/30';

    const ResultIcon = accuracy === 100
      ? Trophy
      : accuracy === 0
        ? Frown
        : Target;

    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/home`} maxWidth="max-w-4xl">
        {/* 成绩摘要 — 紧凑 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${resultBg}`}>
            <ResultIcon className={`w-6 h-6 ${resultColor}`} />
          </div>
          <div>
            <span className={`text-3xl font-bold ${resultColor}`}>{accuracy}%</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
              答对 {correctCount} / {cards.length}
            </span>
          </div>
        </div>

        {/* 上下对比：你的答案 / 正确答案 */}
        <div className="max-w-2xl mx-auto mb-6">
          {/* 你的答案 */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
              你的答案
            </h3>
            <div className="grid grid-cols-6 gap-2 select-none">
              {[...Array(12)].map((_, idx) => {
                const card = cards.find(c => c.position === idx);
                const answer = userAnswers.find(a => a.position === idx);
                const answerCard = answer ? allChoices.find(c => c.id === answer.cardId) : null;
                const isCorrect = answerCard && card && answerCard.id === card.id;

                if (!card) {
                  return (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800/30"
                    />
                  );
                }

                return (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg flex items-center justify-center relative bg-white dark:bg-gray-800"
                    style={{
                      border: `4px solid ${answerCard?.borderColor || '#d1d5db'}`,
                    }}
                  >
                    {answerCard && (
                      <div
                        className="text-4xl font-bold"
                        style={{ color: answerCard.textColor }}
                      >
                        {answerCard.number}
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1">
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 bg-white dark:bg-gray-800 rounded-full" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 bg-white dark:bg-gray-800 rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 正确答案 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
              正确答案
            </h3>
            <div className="grid grid-cols-6 gap-2 select-none">
              {[...Array(12)].map((_, idx) => {
                const card = cards.find(c => c.position === idx);

                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex items-center justify-center ${
                      card
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-gray-100 dark:bg-gray-800/30'
                    }`}
                    style={{
                      ...(card ? { border: `4px solid ${card.borderColor}` } : {}),
                    }}
                  >
                    {card && (
                      <div
                        className="text-4xl font-bold"
                        style={{ color: card.textColor }}
                      >
                        {card.number}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 今日进度 */}
        <div className="max-w-xs mx-auto mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>今日进度</span>
            <span className={dailyCompleted >= dailyTarget ? 'text-emerald-500 font-medium' : ''}>
              {dailyCompleted} / {dailyTarget}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dailyCompleted >= dailyTarget ? 'bg-emerald-500' : 'bg-violet-500'
              }`}
              style={{ width: `${Math.min((dailyCompleted / dailyTarget) * 100, 100)}%` }}
            />
          </div>
          {dailyCompleted >= dailyTarget && (
            <p className="text-center text-xs text-emerald-500 mt-1 font-medium">🎉 今日任务完成！</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              const { cards: newCards, decoys: newDecoys } = generateCards();
              setCards(newCards);
              setAllChoices(shuffle([...newCards, ...newDecoys]));
              setUserAnswers([]);
              setSubmitted(false);
              setStartTime(0);
              setPhase('prepare');
              setCountdown(3);
              setMemorizeTime(30);
              setAnswerTime(30);
            }}
            className="px-6 py-2.5 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-700 transition"
          >
            再玩一次
          </button>
          <button
            onClick={() => navigate(`/${userId}/home`)}
            className="px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            返回首页
          </button>
        </div>
      </Layout>
    );
  }

  return null;
}
