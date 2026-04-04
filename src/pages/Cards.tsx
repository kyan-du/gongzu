import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, RotateCcw, Zap, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import WordCard from '../components/WordCard';

interface CardWord {
  id: string;
  front: string;
  back: string;
  phonetic?: string;
  example?: string | null;
  exampleCn?: string | null;
  isReview?: boolean;
  distractors?: string[];
}

interface Stats {
  totalWords: number;
  learnedCount: number;
  masteredCount: number;
  reviewDueCount: number;
  newRemaining: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Cards() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [words, setWords] = useState<CardWord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/cards?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        setWords(data.words || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const current = words[currentIndex];
  const total = words.length;
  const newWords = words.filter(w => !w.isReview);
  const reviewWords = words.filter(w => w.isReview);

  // Build options for current word
  const options = useMemo(() => {
    if (!current) return [];
    let distractors = current.distractors || [];
    if (distractors.length < 3) {
      const otherMeanings = words.filter(w => w.id !== current.id).map(w => w.back);
      distractors = shuffle(otherMeanings).slice(0, 3);
    }
    return shuffle([current.back, ...distractors.slice(0, 3)]);
  }, [current, words]);

  const handleResult = useCallback(async (correct: boolean) => {
    if (!current || submitting) return;
    setSubmitting(true);
    setResults(prev => ({ ...prev, [current.id]: correct }));

    try {
      await fetch('/api/cards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questionId: current.id, remembered: correct }),
      });
    } catch (e) { /* ignore */ }

    setSubmitting(false);
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  }, [current, currentIndex, total, userId, submitting]);

  const handleMaster = useCallback(async () => {
    if (!current) return;
    try {
      await fetch('/api/cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, questionId: current.id }),
      });
    } catch (e) { /* ignore */ }
  }, [current, userId]);

  const correctCount = Object.values(results).filter(Boolean).length;
  const wrongCount = Object.values(results).filter(v => !v).length;

  if (loading) {
    return (
      <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      </Layout>
    );
  }

  // Dashboard — show before starting
  if (!started) {
    const progress = stats ? Math.round((stats.learnedCount / Math.max(stats.totalWords, 1)) * 100) : 0;
    return (
      <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
        <div className="py-4">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">单词打卡</h1>
          </div>

          {/* Progress ring / bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">学习进度</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {stats?.learnedCount || 0} / {stats?.totalWords || 0}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{progress}% 完成</span>
              <span>已掌握 {stats?.masteredCount || 0} 词</span>
            </div>
          </div>

          {/* Today's tasks */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">今日新学</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {newWords.length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">待复习</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reviewWords.length}
              </div>
            </div>
          </div>

          {/* Start button */}
          {total > 0 ? (
            <button
              onClick={() => setStarted(true)}
              className="w-full py-3.5 rounded-full bg-violet-600 dark:bg-violet-500 text-white font-semibold text-base hover:bg-violet-700 dark:hover:bg-violet-600 transition shadow-sm active:scale-[0.98]"
            >
              开始学习（{total} 词）
            </button>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">今天的单词都学完啦 🎉</p>
            </div>
          )}

          {/* Add words entry */}
          <button
            onClick={() => navigate(`/${userId}/cards/add`)}
            className="w-full mt-3 py-3 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-500 dark:hover:text-violet-400 transition"
          >
            + 添加生词
          </button>
        </div>
      </Layout>
    );
  }

  // Finished summary
  if (finished) {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
        <div className="text-center py-10">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            今日打卡完成！
          </h2>
          <div className="text-5xl font-bold text-violet-500 mb-3">{accuracy}%</div>
          <div className="flex justify-center gap-6 mb-6 text-sm">
            <span className="text-emerald-600 dark:text-emerald-400">✅ {correctCount}</span>
            <span className="text-red-500 dark:text-red-400">❌ {wrongCount}</span>
            <span className="text-gray-500 dark:text-gray-400">共 {total} 词</span>
          </div>

          {wrongCount > 0 && (
            <button
              onClick={() => {
                const wrong = words.filter(w => results[w.id] === false);
                setWords(shuffle(wrong));
                setResults({});
                setCurrentIndex(0);
                setFinished(false);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition mb-3"
            >
              <RotateCcw className="w-4 h-4" />
              再练一遍错的
            </button>
          )}

          <div>
            <button
              onClick={() => navigate(`/${userId}/home`)}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              返回首页
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Active learning
  return (
    <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentIndex + 1} / {total}
          </span>
          {current?.isReview && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-1.5 py-0.5 rounded-full">
              复习
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="text-emerald-500">✓ {correctCount}</span>
          <span className="text-red-400">✗ {wrongCount}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / total) * 100}%` }}
        />
      </div>

      {/* Word card */}
      <WordCard
        key={current.id}
        word={current.front}
        phonetic={current.phonetic}
        correctMeaning={current.back}
        options={options}
        example={current.example}
        exampleCn={current.exampleCn}
        onResult={handleResult}
        onMaster={handleMaster}
      />
    </Layout>
  );
}
