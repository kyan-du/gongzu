import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
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
  number: number; // 1-9
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
function generateCards(): Card[] {
  const cardCount = 6; // 每列最多一张（同列上下不能同时有），6列最多6张

  // 为每列随机选上排(0-5)或下排(6-11)
  const positions: number[] = [];
  for (let col = 0; col < 6; col++) {
    const row = Math.random() < 0.5 ? 0 : 1;
    positions.push(row * 6 + col);
  }
  // 随机打乱顺序用于颜色链分配
  const shuffledPositions = shuffle([...positions]);

  const cards: Card[] = [];
  const usedColors = shuffle([...COLORS]);

  // 生成不重复的数字（6张卡片，从1-9中取6个不重复的）
  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, cardCount);

  for (let i = 0; i < cardCount; i++) {
    const textColor = usedColors[i % usedColors.length];
    const borderColor = i < cardCount - 1 ? usedColors[(i + 1) % usedColors.length] : usedColors[0];

    cards.push({
      id: `card-${i}`,
      position: shuffledPositions[i],
      number: numbers[i],
      textColor: textColor.text,
      borderColor: borderColor.border,
    });
  }

  return cards.sort((a, b) => a.position - b.position);
}

export default function MemoryMatryoshka() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>('prepare');
  const [cards, setCards] = useState<Card[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [memorizeTime, setMemorizeTime] = useState(30);
  const [answerTime, setAnswerTime] = useState(30);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 初始化游戏
  useEffect(() => {
    const newCards = generateCards();
    setCards(newCards);
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
      setTimeout(() => setPhase('answer'), 1000);
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
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDraggedCard(cardId);
    setDragPosition({ x: e.clientX, y: e.clientY });
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedCard) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggedCard || !gridRef.current) {
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
      // 移除该位置的旧答案
      const newAnswers = userAnswers.filter(a => a.position !== targetPosition);
      // 添加新答案
      newAnswers.push({ position: targetPosition, cardId: draggedCard });
      setUserAnswers(newAnswers);
      setSelectedCard(null);
    }

    setDraggedCard(null);
    setDragPosition(null);
  };

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

  const availableCards = cards.filter(
    c => !userAnswers.some(a => a.cardId === c.id)
  );

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

        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400 mb-3">记住卡片的位置和颜色</p>
          <button
            onClick={() => setPhase('answer')}
            className="px-5 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition"
          >
            记好了，开始答题 →
          </button>
        </div>

        {/* 2×6 网格 */}
        <div className="grid grid-cols-6 gap-3 max-w-3xl mx-auto">
          {[...Array(12)].map((_, idx) => {
            const card = cards.find(c => c.position === idx);
            return (
              <div
                key={idx}
                className="aspect-[3/4] rounded-xl flex items-center justify-center shadow-md transition-all"
                style={{
                  backgroundColor: card ? '#ffffff' : '#f3f4f6',
                  border: card ? `3px solid ${card.borderColor}` : '2px dashed #d1d5db',
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
      </Layout>
    );
  }

  // 作答阶段
  if (phase === 'answer') {
    return (
      <Layout userId={userId || ''} maxWidth="max-w-4xl">
        {/* 答题倒计时进度条 */}
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

        <div className="text-center mb-8">
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
          className="grid grid-cols-6 gap-3 max-w-3xl mx-auto mb-8"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {[...Array(12)].map((_, idx) => {
            const isTarget = cards.some(c => c.position === idx);
            const answer = userAnswers.find(a => a.position === idx);
            const card = answer ? cards.find(c => c.id === answer.cardId) : null;

            return (
              <div
                key={idx}
                data-position={idx}
                className={`aspect-[3/4] rounded-xl flex items-center justify-center transition-all ${
                  isTarget ? 'cursor-pointer hover:scale-105' : ''
                }`}
                style={{
                  backgroundColor: isTarget ? (card ? '#ffffff' : '#fafafa') : '#f3f4f6',
                  border: isTarget
                    ? card
                      ? `3px solid ${card.borderColor}`
                      : '2px dashed #9ca3af'
                    : '2px solid #e5e7eb',
                  touchAction: 'none',
                }}
                onClick={() => isTarget && handleCellClick(idx)}
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

        {/* 下方：选项卡片区 */}
        <div className="max-w-3xl mx-auto mb-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-center">
            可选卡片
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {availableCards.map((card) => (
              <div
                key={card.id}
                className={`w-16 h-20 rounded-xl flex items-center justify-center shadow-md cursor-pointer transition-all ${
                  selectedCard === card.id
                    ? 'ring-4 ring-violet-400 scale-110'
                    : 'hover:scale-105'
                } ${draggedCard === card.id ? 'opacity-50' : ''}`}
                style={{
                  backgroundColor: '#ffffff',
                  border: `3px solid ${card.borderColor}`,
                  touchAction: 'none',
                }}
                onPointerDown={(e) => handlePointerDown(e, card.id)}
                onClick={() => handleCardClick(card.id)}
              >
                <div
                  className="text-3xl font-bold"
                  style={{ color: card.textColor }}
                >
                  {card.number}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 拖拽中的卡片副本 */}
        {draggedCard && dragPosition && (
          <div
            className="fixed pointer-events-none z-50 w-16 h-20 rounded-xl flex items-center justify-center shadow-2xl opacity-80"
            style={{
              left: dragPosition.x - dragOffsetRef.current.x,
              top: dragPosition.y - dragOffsetRef.current.y,
              backgroundColor: '#ffffff',
              border: `3px solid ${cards.find(c => c.id === draggedCard)?.borderColor}`,
            }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: cards.find(c => c.id === draggedCard)?.textColor }}
            >
              {cards.find(c => c.id === draggedCard)?.number}
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
      </Layout>
    );
  }

  // 结果展示
  if (phase === 'result') {
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/home`} maxWidth="max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 mb-4">
            <CheckCircle className="w-10 h-10 text-violet-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            完成！
          </h2>
          <div className="text-5xl font-bold text-violet-500 mb-2">{accuracy}%</div>
          <p className="text-gray-500 dark:text-gray-400">
            答对 {correctCount} / {cards.length}
          </p>
        </div>

        {/* 你的答案 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            你的答案
          </h3>
          <div className="grid grid-cols-6 gap-3 max-w-3xl mx-auto">
            {[...Array(12)].map((_, idx) => {
              const card = cards.find(c => c.position === idx);
              const answer = userAnswers.find(a => a.position === idx);
              const answerCard = answer ? cards.find(c => c.id === answer.cardId) : null;
              const isCorrect = answerCard && card && answerCard.id === card.id;

              if (!card) {
                return (
                  <div
                    key={idx}
                    className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-gray-800"
                  />
                );
              }

              return (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-xl flex items-center justify-center shadow-md relative"
                  style={{
                    backgroundColor: '#ffffff',
                    border: `3px solid ${answerCard?.borderColor || '#d1d5db'}`,
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
                  <div className="absolute -top-2 -right-2">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500 bg-white rounded-full" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 正确答案 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            正确答案
          </h3>
          <div className="grid grid-cols-6 gap-3 max-w-3xl mx-auto">
            {[...Array(12)].map((_, idx) => {
              const card = cards.find(c => c.position === idx);

              return (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: card ? '#ffffff' : '#f3f4f6',
                    border: card ? `3px solid ${card.borderColor}` : '2px solid #e5e7eb',
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

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              const newCards = generateCards();
              setCards(newCards);
              setUserAnswers([]);
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
