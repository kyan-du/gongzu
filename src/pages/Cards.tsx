import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, RotateCcw, Zap, RefreshCw, Settings } from 'lucide-react';
import Layout from '../components/Layout';
import WordCard from '../components/WordCard';

// Simple similarity: shared character bigrams / total bigrams
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0;
  let shared = 0;
  bigramsA.forEach(bg => { if (bigramsB.has(bg)) shared++; });
  return (2 * shared) / (bigramsA.size + bigramsB.size);
}

interface CardWord {
  id: string;
  front: string;
  back: string;
  phonetic?: string;
  example?: string | null;
  exampleCn?: string | null;
  isReview?: boolean;
  distractors?: string[];
  reviewCount?: number;
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
  const { userId, date } = useParams<{ userId: string; date: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isLearnMode = location.pathname.endsWith('/learn');
  const todayDate = new Date().toISOString().split('T')[0];
  const currentDate = date || todayDate;
  const [words, setWords] = useState<CardWord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [dailyNewWords, setDailyNewWords] = useState(15);
  const [dailyTotalLimit, setDailyTotalLimit] = useState(20);
  const [savingSettings, setSavingSettings] = useState(false);
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
    // Fetch settings
    fetch(`/api/cards/settings?userId=${userId}`)
      .then(r => r.json())
      .then(d => {
        setDailyNewWords(d.dailyNewWords ?? 15);
        setDailyTotalLimit(d.dailyTotalLimit ?? 20);
      })
      .catch(() => {});
  }, [userId]);

  const saveSettings = useCallback(async () => {
    if (!userId) return;
    setSavingSettings(true);
    try {
      await fetch('/api/cards/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, dailyNewWords, dailyTotalLimit }),
      });
      setShowSettings(false);
      // Refresh word list with new settings
      const r = await fetch(`/api/cards?userId=${userId}`);
      const data = await r.json();
      setWords(data.words || []);
      setStats(data.stats || null);
    } finally {
      setSavingSettings(false);
    }
  }, [userId, dailyNewWords, dailyTotalLimit]);

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

  // Cycle mode per word based on review count — ensures all types get covered
  const modes = ['en2cn', 'cn2en', 'spell'] as const;
  const cardMode = useMemo(() => {
    if (!current) return 'en2cn' as const;
    const reviewCount = current.reviewCount || 0;
    return modes[reviewCount % modes.length];
  }, [current?.id]);

  // Build confuser words for cn2en mode (similar looking words)
  const confuserWords = useMemo(() => {
    if (!current || cardMode !== 'cn2en') return [];
    const w = current.front.toLowerCase();
    // Find words with similar length or shared prefix/suffix
    const candidates = words
      .filter(c => c.id !== current.id)
      .map(c => ({
        word: c.front,
        score: similarity(w, c.front.toLowerCase())
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.word);
    return candidates;
  }, [current, words, cardMode]);

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
    // Delay before advancing — give time to see result & tap "斩"
    setTimeout(() => {
      if (currentIndex < total - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setFinished(true);
      }
    }, correct ? 2000 : 2500);
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
      <Layout userId={userId || ''} showBack backTo={`/${userId}/${currentDate}`} maxWidth="max-w-3xl">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      </Layout>
    );
  }

  // Dashboard — show before starting
  if (!isLearnMode) {
    const progress = stats ? Math.round((stats.learnedCount / Math.max(stats.totalWords, 1)) * 100) : 0;
    const isDaily = !!date; // has date param = daily task mode

    // ── Global overview (no date) ──
    if (!isDaily) {
      const totalW = stats?.totalWords || 0;
      const mastered = stats?.masteredCount || 0;
      const learned = (stats?.learnedCount || 0) - mastered;
      const reviewDue = stats?.reviewDueCount || 0;
      return (
        <Layout userId={userId || ''} showBack backTo={`/${userId}/home`} maxWidth="max-w-3xl"
          title={`单词本（${totalW} 词）`}
          rightAction={
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(`/${userId}/cards/add`)}
                className="px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500 hover:border-gray-400 hover:text-gray-500 transition"
              >
                +添加
              </button>
            </div>
          }
        >
          {/* Settings panel */}
          {showSettings && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-4 border border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">学习设置</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">每日新词数量</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="1" max="50" value={dailyNewWords}
                      onChange={e => setDailyNewWords(Number(e.target.value))}
                      className="flex-1 accent-violet-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">{dailyNewWords}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">每日总量上限（新词+复习）</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min="1" max="100" value={dailyTotalLimit}
                      onChange={e => setDailyTotalLimit(Number(e.target.value))}
                      className="flex-1 accent-violet-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-8 text-right">{dailyTotalLimit}</span>
                  </div>
                </div>
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition disabled:opacity-50"
                >
                  {savingSettings ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mastered}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">已掌握</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.max(learned, 0)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">学习中</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reviewDue}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">待复习</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
              {mastered > 0 && (
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${(mastered / totalW) * 100}%` }} />
              )}
              {learned > 0 && (
                <div className="h-full bg-amber-400" style={{ width: `${(learned / totalW) * 100}%` }} />
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
              <span>{totalW > 0 ? Math.round(((stats?.learnedCount || 0) / totalW) * 100) : 0}% 学过</span>
              <span>{totalW > 0 ? Math.round((mastered / totalW) * 100) : 0}% 掌握</span>
            </div>
          </div>

          {/* Action entries */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/${userId}/${todayDate}/cards`)}
              className="w-full bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 flex items-center justify-between hover:bg-violet-100 dark:hover:bg-violet-900/30 transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">今日学习</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {total > 0 ? `${newWords.length} 新词 · ${reviewWords.length} 复习` : '今天的任务已完成'}
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">{total > 0 ? '开始' : '查看'}</span>
            </button>

            <button
              onClick={() => navigate(`/${userId}/cards/list`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">全部单词</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">查看、搜索、管理</div>
                </div>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </button>
          </div>
        </Layout>
      );
    }

    // ── Daily task dashboard (with date) ──
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/${currentDate}`} maxWidth="max-w-3xl"
        title="今日单词"
      >
        {/* Today's tasks — primary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">新词</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{newWords.length}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">待复习</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{reviewWords.length}</div>
            </div>
          </div>

          {total > 0 ? (
            <button
              onClick={() => navigate(`/${userId}/${currentDate}/cards/learn`)}
              className="w-full py-3.5 rounded-full bg-violet-600 dark:bg-violet-500 text-white font-semibold text-base hover:bg-violet-700 dark:hover:bg-violet-600 transition shadow-sm active:scale-[0.98]"
            >
              开始学习（{total} 词）
            </button>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">今天的单词都学完啦 🎉</p>
            </div>
          )}
        </div>

        {/* Secondary: overall progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">总进度</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats?.learnedCount || 0} / {stats?.totalWords || 0}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 dark:bg-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">{progress}%</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">已掌握 {stats?.masteredCount || 0} 词</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Finished summary
  if (finished) {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <Layout userId={userId || ''} showBack backTo={`/${userId}/${currentDate}/cards`} maxWidth="max-w-3xl">
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
              onClick={() => navigate(`/${userId}/${currentDate}`)}
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
    <Layout userId={userId || ''} showBack backTo={`/${userId}/${currentDate}/cards`} maxWidth="max-w-3xl">
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
        key={`${current.id}-${cardMode}`}
        word={current.front}
        phonetic={current.phonetic}
        correctMeaning={current.back}
        options={options}
        example={current.example || undefined}
        mode={cardMode}
        confuserWords={confuserWords}
        onResult={handleResult}
        onMaster={handleMaster}
      />
    </Layout>
  );
}
