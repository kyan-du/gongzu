import { getSlug, isMemoryGameTag, memoryGameType } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { CheckCircle, Clock, BookX, ChevronLeft, ChevronRight, BookOpen, Languages, PenLine, Brain } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ActivityRings from '../components/ActivityRings';

interface Quiz {
  id: string;
  tag: string;
  title: string;
  date: string;
  questions: any[];
}

interface QuizStatus {
  completed: boolean;
  answered: number;
  total: number;
  correct: number;
  accuracy: number | null;
}

interface MonthlyDayData {
  date: string;
  quizCount: number;
  completedCount: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number | null;
  reviewDue: number;
  reviewDone: number;
  memoryGames: number;
  memoryGamesTarget: number;
  memoryTotal: number;
  memoryCorrect: number;
  memoryMatryoshka: number;
  memoryGrid: number;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatDateLabel(dateStr: string, todayStr: string) {
  if (dateStr === todayStr) return '今天';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const todayStr = toDateStr(new Date());

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizStatus, setQuizStatus] = useState<Record<string, QuizStatus>>({});
  const [loadingDay, setLoadingDay] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [cardCount, setCardCount] = useState<number>(0);
  const [cardTotalWords, setCardTotalWords] = useState<number>(0);
  const [cardMastered, setCardMastered] = useState<number>(0);
  const [cardLearning, setCardLearning] = useState<number>(0);
  const [cardReviewDue, setCardReviewDue] = useState<number>(0);
  const [matryoshkaCompleted, setMatryoshkaCompleted] = useState<number>(0);
  const [gridCompleted, setGridCompleted] = useState<number>(0);

  // 用户模块配置（从 API 获取）
  interface UserModule {
    module: string;
    enabled: boolean;
    isTask: boolean;
    dailyTarget: number | null;
    config: Record<string, any>;
  }
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const mod = (name: string) => userModules.find(m => m.module === name);
  const modEnabled = (name: string) => mod(name)?.enabled ?? false;
  const modIsTask = (name: string) => mod(name)?.isTask ?? false;
  const modTarget = (name: string) => mod(name)?.dailyTarget ?? 0;

  const [calMonth, setCalMonth] = useState(() => new Date());
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyDayData>>({});
  const [monthlyCache, setMonthlyCache] = useState<Record<string, Record<string, MonthlyDayData>>>({});

  // 获取用户模块配置
  useEffect(() => {
    if (!userId) return;
    // Clear calendar cache when user switches
    setMonthlyCache({});
    setMonthlyData({});
    fetch(`/api/modules?userId=${userId}`)
      .then(r => r.json())
      .then((data: any) => setUserModules(data.modules || []))
      .catch(() => {});
  }, [userId]);

  // Fetch selected day's data
  const fetchDayData = useCallback(async (dateStr: string) => {
    setLoadingDay(true);
    try {
      const [quizRes, statusRes] = await Promise.all([
        fetch(`/api/quiz?userId=${userId}&date=${dateStr}`),
        fetch(`/api/status?userId=${userId}&date=${dateStr}`),
      ]);
      const quizData = await quizRes.json();
      setQuizzes((quizData.quizzes || []).map(normalizeQuiz));

      const statusData = await statusRes.json();
      const statusMap: Record<string, QuizStatus> = {};
      for (const q of (statusData.quizzes || [])) {
        statusMap[String(q.quizId)] = {
          completed: q.completed, answered: q.answered,
          total: q.totalQuestions, correct: q.correct, accuracy: q.accuracy,
        };
      }
      setQuizStatus(statusMap);
    } catch (e) {
      console.error('Failed to fetch day data:', e);
    } finally {
      setLoadingDay(false);
    }
  }, [userId]);

  useEffect(() => { fetchDayData(selectedDate); }, [selectedDate, fetchDayData]);

  // Fetch mistakes count once
  useEffect(() => {
    fetch(`/api/review?userId=${userId}`)
      .then(r => r.json())
      .then(d => setMistakesCount((d.points || []).length))
      .catch(() => {});
  }, [userId]);

  // Fetch card stats
  useEffect(() => {
    fetch(`/api/vocab?userId=${userId}&mode=stats`)
      .then(r => r.json())
      .then(d => {
        const s = d.stats || {};
        setCardTotalWords(s.totalWords || 0);
        setCardMastered(s.masteredCount || 0);
        setCardLearning((s.learnedCount || 0) - (s.masteredCount || 0));
        setCardReviewDue(s.reviewDueCount || 0);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (selectedDate !== todayStr) { setCardCount(0); return; }
    fetch(`/api/vocab?userId=${userId}`)
      .then(r => r.json())
      .then(d => setCardCount((d.words || []).length))
      .catch(() => setCardCount(0));
  }, [userId, selectedDate, todayStr]);

  // 记忆游戏今日进度（仅启用了的用户）
  useEffect(() => {
    if (!userId || !modEnabled('memory_game')) return;
    Promise.all([
      fetch(`/api/memory-game?userId=${userId}&date=${todayStr}&type=matryoshka`).then(r => r.json()),
      fetch(`/api/memory-game?userId=${userId}&date=${todayStr}&type=grid`).then(r => r.json()),
    ])
      .then(([matryoshkaData, gridData]) => {
        setMatryoshkaCompleted(matryoshkaData.completed || 0);
        setGridCompleted(gridData.completed || 0);
      })
      .catch(() => {});
  }, [userId, todayStr, userModules]);

  // Monthly data with cache — load current + adjacent months for overflow dates
  useEffect(() => {
    const monthKey = toMonthStr(calMonth);
    const prevMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1);
    const nextMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1);
    const prevKey = toMonthStr(prevMonth);
    const nextKey = toMonthStr(nextMonth);
    const keysToLoad = [monthKey, prevKey, nextKey].filter(k => !monthlyCache[k]);

    if (keysToLoad.length === 0) {
      // All cached, merge and set
      setMonthlyData({ ...monthlyCache[prevKey], ...monthlyCache[monthKey], ...monthlyCache[nextKey] });
      return;
    }

    Promise.all(keysToLoad.map(k =>
      fetch(`/api/status/monthly?userId=${userId}&month=${k}`)
        .then(r => r.json())
        .then(data => {
          const map: Record<string, MonthlyDayData> = {};
          const days = data.days || {};
          for (const [date, d] of Object.entries(days) as [string, any][]) {
            map[date] = { date, ...d };
          }
          return { key: k, map };
        })
        .catch(() => ({ key: k, map: {} as Record<string, MonthlyDayData> }))
    )).then(results => {
      const newCache = { ...monthlyCache };
      for (const r of results) newCache[r.key] = r.map;
      setMonthlyCache(newCache);
      setMonthlyData({ ...newCache[prevKey], ...newCache[monthKey], ...newCache[nextKey] });
    });
  }, [userId, calMonth, monthlyCache]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear(), month = calMonth.getMonth();
    let startWeekday = new Date(year, month, 1).getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean }[] = [];

    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pm = month === 0 ? 12 : month, py = month === 0 ? year - 1 : year;
      days.push({ date: `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false, isToday: false, isFuture: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: ds, day: d, isCurrentMonth: true, isToday: ds === todayStr, isFuture: ds > todayStr });
    }
    const rem = days.length % 7;
    if (rem > 0) {
      for (let d = 1; d <= 7 - rem; d++) {
        const nm = month + 2 > 12 ? 1 : month + 2, ny = month + 2 > 12 ? year + 1 : year;
        days.push({ date: `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false, isToday: false, isFuture: false });
      }
    }
    return days;
  }, [calMonth, todayStr]);

  // Progress
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(q => quizStatus[q.id]?.completed).length;
  const allCompleted = totalQuizzes > 0 && completedQuizzes === totalQuizzes;
  const hasAnyAnswer = quizzes.some(q => (quizStatus[q.id]?.answered || 0) > 0);

  const sortedQuizzes = [...quizzes].sort((a, b) => {
    const ac = quizStatus[a.id]?.completed || false, bc = quizStatus[b.id]?.completed || false;
    return ac === bc ? 0 : ac ? 1 : -1;
  });

  const prevMonth = () => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1);
    if (toMonthStr(next) <= toMonthStr(new Date())) setCalMonth(next);
  };
  const isCurrentMonthView = toMonthStr(calMonth) === toMonthStr(new Date());

  const handleRequestQuiz = async () => {
    setRequesting(true);
    try {
      const res = await fetch('/api/request-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.alreadyExists) {
        // Quizzes exist — just refresh the day data
        await fetchDayData(selectedDate);
      }
      setRequested(true);
    } catch (e) {
      console.error('Failed to request quiz:', e);
    } finally {
      setRequesting(false);
    }
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setRequested(false);
    // Ensure calendar shows the right month
    const [y, m] = dateStr.split('-').map(Number);
    if (toMonthStr(calMonth) !== `${y}-${String(m).padStart(2, '0')}`) {
      setCalMonth(new Date(y, m - 1, 1));
    }
  };

  return (
    <Layout userId={userId || ''} maxWidth="max-w-3xl">
      {/* Two-column: left (calendar+mistakes) / right (day content) */}
        {/* On mobile: stacked. On md+: side by side */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* LEFT COLUMN: Calendar + Mistakes */}
          <div className="md:w-[280px] flex-shrink-0">
            {/* Mini Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <button onClick={prevMonth} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {calMonth.getFullYear()}年{calMonth.getMonth() + 1}月
                </span>
                <button onClick={nextMonth} disabled={isCurrentMonthView}
                  className={`p-0.5 rounded transition ${isCurrentMonthView ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {WEEKDAYS.map(w => (
                  <div key={w} className="text-center text-[10px] text-gray-400 dark:text-gray-500 py-0.5">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((d, i) => {
                  const isClickable = !d.isFuture;
                  const isSelected = d.date === selectedDate;
                  const md = monthlyData[d.date];
                  const isDimmed = !d.isCurrentMonth;

                  // Build rings: 2 rings for every day — progress (red) + accuracy (green)
                  const ringDefs: { filledPercentage: number; color: string; ringWidth?: number }[] = [];
                  if (!d.isFuture) {
                    // Compute combined progress: quiz completion + memory game completion
                    const quizTotal = md ? md.quizCount : 0;
                    const quizDone = md ? md.completedCount : 0;
                    const showMemoryRing = modIsTask('memory_game');
                    const mgTarget = showMemoryRing ? (md?.memoryGamesTarget || modTarget('memory_game') || 5) : 0;
                    const mgDone = showMemoryRing && md ? Math.min(md.memoryGames, mgTarget) : 0;
                    const totalTasks = quizTotal + mgTarget;
                    const doneTasks = quizDone + mgDone;
                    const hasAnyTask = d.isToday || (md && (quizTotal > 0 || (showMemoryRing && md.memoryGames > 0)));

                    if (hasAnyTask) {
                      // Outer: progress (Apple red/pink)
                      ringDefs.push({
                        filledPercentage: totalTasks > 0 ? doneTasks / totalTasks : 0,
                        color: '#FA114F',
                      });

                      // Inner: accuracy (Apple green) — combine quiz + memory game accuracy
                      const quizAnswered = md ? md.answeredQuestions : 0;
                      const quizCorrect = md ? md.correctAnswers : 0;
                      const mgTotal = showMemoryRing && md ? md.memoryTotal : 0;
                      const mgCorrect = showMemoryRing && md ? md.memoryCorrect : 0;
                      const allAnswered = quizAnswered + mgTotal;
                      const allCorrect = quizCorrect + mgCorrect;
                      if (allAnswered > 0) {
                        ringDefs.push({
                          filledPercentage: allCorrect / allAnswered,
                          color: '#92E82A',
                        });
                      } else if (d.isToday) {
                        // Today with no answers yet — show empty green ring
                        ringDefs.push({
                          filledPercentage: 0,
                          color: '#92E82A',
                        });
                      }
                    }
                  }

                  return (
                    <button key={i} disabled={!isClickable}
                      onClick={() => isClickable && handleDateClick(d.date)}
                      className={`
                        relative w-full aspect-square flex items-center justify-center text-xs rounded-md transition
                        ${!d.isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : ''}
                        ${d.isCurrentMonth && d.isFuture ? 'text-gray-300 dark:text-gray-600' : ''}
                        ${d.isCurrentMonth && !d.isFuture && !d.isToday && !isSelected ? 'text-gray-700 dark:text-gray-300' : ''}
                        ${d.isToday && !isSelected ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}
                        ${isSelected ? 'ring-2 ring-amber-500 dark:ring-amber-400 text-amber-600 dark:text-amber-400 font-bold' : ''}
                        ${isClickable && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                        ${!isClickable ? 'cursor-default' : ''}
                      `}>
                      {ringDefs.length > 0 && (
                        <ActivityRings
                          rings={ringDefs}
                          dimmed={isDimmed}
                          size={32}
                          animationMs={500}
                          bgOpacity={0.2}
                        />
                      )}
                      <span className="relative z-10">{d.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mistakes Card — 按模块配置 */}
            {modEnabled('mistakes') && (
            <button onClick={() => navigate(`/${userId}/mistakes`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 hover:shadow-md transition active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  mistakesCount > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'
                }`}>
                  <BookX className={`w-4 h-4 ${
                    mistakesCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
                  }`} />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    错题本
                    {mistakesCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[10px] font-bold inline-flex items-center justify-center">{mistakesCount}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {mistakesCount > 0 ? `${mistakesCount} 个知识点待复习` : '暂无错题 ✓'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </button>
            )}

            {/* Word Book Card — 按模块配置 */}
            {modEnabled('vocab') && (
            <button onClick={() => navigate(`/${userId}/vocab`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 hover:shadow-md transition active:scale-[0.98] mt-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-900/30">
                  <BookOpen className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">单词本 <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({cardTotalWords} 词)</span></div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {cardTotalWords > 0
                      ? `已掌握 ${cardMastered} · 学习中 ${Math.max(cardLearning, 0)} · 待复习 ${cardReviewDue}`
                      : '添加生词开始学习'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </button>
            )}

            {/* 记忆游戏 — 按模块配置 */}
            {modEnabled('memory_game') && (
            <button onClick={() => navigate(`/${userId}/memory`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 hover:shadow-md transition active:scale-[0.98] mt-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-900/30">
                  <Brain className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">思维训练</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">套娃 / 宫格</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </button>
            )}
          </div>

          {/* RIGHT COLUMN: Selected day content */}
          <div className="flex-1 min-w-0">
            {/* Date label + progress badge / request button */}
            <div className="flex items-baseline justify-between mb-4">
              <button
                onClick={() => navigate(`/${userId}/${selectedDate}`)}
                className="text-lg font-bold text-gray-900 dark:text-gray-100 underline decoration-gray-300 dark:decoration-gray-600 underline-offset-4 hover:decoration-amber-500 dark:hover:decoration-amber-400 transition"
              >
                {formatDateLabel(selectedDate, todayStr)}
              </button>
              <div className="flex items-center gap-2">
                {totalQuizzes > 0 && (
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    allCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    completedQuizzes > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {allCompleted ? '✅ 全部完成' : `${completedQuizzes}/${totalQuizzes} 完成`}
                  </div>
                )}
                {selectedDate === todayStr && !loadingDay && !hasAnyAnswer && (totalQuizzes > 0 || !modIsTask('memory_game')) && (
                  requested ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">已通知出题 ✓</span>
                  ) : (
                    <button
                      onClick={handleRequestQuiz}
                      disabled={requesting}
                      className="text-sm font-medium px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition disabled:opacity-50"
                    >
                      {requesting ? '通知中...' : totalQuizzes > 0 ? '重新出题' : '出题'}
                    </button>
                  )
                )}
              </div>
            </div>

            {loadingDay ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
            ) : totalQuizzes === 0 ? (
              <>
              {selectedDate !== todayStr && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                  <div className="text-gray-400 dark:text-gray-500 text-sm">
                    当天没有作业
                  </div>
                </div>
              )}
              {/* 记忆游戏任务卡 — 仅 isTask 的用户 */}
              {modIsTask('memory_game') && selectedDate === todayStr && (
                <>
                  {/* 套娃记忆 */}
                  <button
                    onClick={() => navigate(`/${userId}/memory/matryoshka`)}
                    className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30">
                        <span className="text-xl">🪆</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100">套娃记忆</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {matryoshkaCompleted >= modTarget('memory_game') ? '今日已完成' : `${matryoshkaCompleted}/${modTarget('memory_game')} 完成`}
                        </div>
                      </div>
                    </div>
                    {matryoshkaCompleted >= modTarget('memory_game') ? (
                      <div className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已完成
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-amber-500 dark:text-amber-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {matryoshkaCompleted > 0 ? `${matryoshkaCompleted}/${modTarget('memory_game')}` : '未完成'}
                      </div>
                    )}
                  </button>

                  {/* 宫格记忆 */}
                  <button
                    onClick={() => navigate(`/${userId}/memory/grid`)}
                    className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                        <span className="text-xl">🔲</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100">宫格记忆</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {gridCompleted >= modTarget('memory_game') ? '今日已完成' : `${gridCompleted}/${modTarget('memory_game')} 完成`}
                        </div>
                      </div>
                    </div>
                    {gridCompleted >= modTarget('memory_game') ? (
                      <div className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已完成
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-amber-500 dark:text-amber-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {gridCompleted > 0 ? `${gridCompleted}/${modTarget('memory_game')}` : '未完成'}
                      </div>
                    )}
                  </button>

                  {/* 宫格推理 */}
                  <button
                    onClick={() => navigate(`/${userId}/memory/reasoning`)}
                    className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30">
                        <span className="text-xl">🧩</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100">宫格推理</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">今天可做</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      去挑战
                    </div>
                  </button>
                </>
              )}
              </>
            ) : (
              <>
                {/* Quiz cards */}
                <div className="space-y-3">
                  {sortedQuizzes.map((quiz) => {
                    const isMemGame = isMemoryGameTag(quiz.tag);
                    const gameType = memoryGameType(quiz.tag);
                    return (
                    <button key={quiz.id}
                      onClick={() => isMemGame && gameType
                        ? navigate(`/${userId}/memory/${gameType}?mode=exam&quizId=${quiz.id}`)
                        : navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)
                      }
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isMemGame ? 'bg-amber-50 dark:bg-amber-900/30' :
                          quiz.tag.includes('英语') ? 'bg-blue-50 dark:bg-blue-900/30' :
                          quiz.tag.includes('阅读') ? 'bg-emerald-50 dark:bg-emerald-900/30' :
                          quiz.tag.includes('西游') ? 'bg-amber-50 dark:bg-amber-900/30' :
                          'bg-gray-50 dark:bg-gray-700'
                        }`}>
                          {isMemGame ? <span className="text-xl">{gameType === 'matryoshka' ? '🎭' : '🔢'}</span> :
                           quiz.tag.includes('英语') ? <Languages className="w-5 h-5 text-blue-500 dark:text-blue-400" /> :
                           quiz.tag.includes('阅读') ? <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> :
                           quiz.tag.includes('西游') ? <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" /> :
                           <PenLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{quiz.tag}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {isMemGame ? (gameType === 'matryoshka' ? '套娃记忆' : '宫格记忆') : (<>
                            {quiz.questions?.length || 0} 题
                            {(() => {
                              const reviewCount = (quiz.questions || []).filter((q: any) => q.tags?.includes('review')).length;
                              return reviewCount > 0 ? (
                                <span className="ml-1.5 text-blue-500 dark:text-blue-400">· {reviewCount} 题复习</span>
                              ) : null;
                            })()}
                            </>)}
                          </div>
                        </div>
                      </div>
                      {quizStatus[quiz.id]?.completed ? (
                        <div className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {quizStatus[quiz.id]?.accuracy != null ? `${quizStatus[quiz.id].accuracy}%` : '已完成'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-amber-500 dark:text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          未完成
                        </div>
                      )}
                    </button>
                    );
                  })}
                </div>

                {/* Vocabulary card entry — 按模块配置 */}
                {modEnabled('vocab') && (
                <button
                  onClick={() => navigate(`/${userId}/${selectedDate}/vocab`)}
                  className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-900/30">
                      <BookOpen className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">单词记忆</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cardCount > 0 ? `${cardCount} 个单词待背` : '今日已完成'}
                      </div>
                    </div>
                  </div>
                  {cardCount > 0 ? (
                    <div className="flex items-center gap-1 text-sm text-amber-500 dark:text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      未完成
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      已完成
                    </div>
                  )}
                </button>
                )}

                {/* 记忆游戏任务卡 — 按模块配置 */}
                {modIsTask('memory_game') && selectedDate === todayStr && (
                  <>
                    {/* 套娃记忆 */}
                    <button
                      onClick={() => navigate(`/${userId}/memory/matryoshka`)}
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30">
                          <span className="text-xl">🪆</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">套娃记忆</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {matryoshkaCompleted >= modTarget('memory_game') ? '今日已完成' : `${matryoshkaCompleted}/${modTarget('memory_game')} 完成`}
                          </div>
                        </div>
                      </div>
                      {matryoshkaCompleted >= modTarget('memory_game') ? (
                        <div className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          已完成
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-amber-500 dark:text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {matryoshkaCompleted > 0 ? `${matryoshkaCompleted}/${modTarget('memory_game')}` : '未完成'}
                        </div>
                      )}
                    </button>

                    {/* 宫格记忆 */}
                    <button
                      onClick={() => navigate(`/${userId}/memory/grid`)}
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                          <span className="text-xl">🔲</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">宫格记忆</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {gridCompleted >= modTarget('memory_game') ? '今日已完成' : `${gridCompleted}/${modTarget('memory_game')} 完成`}
                          </div>
                        </div>
                      </div>
                      {gridCompleted >= modTarget('memory_game') ? (
                        <div className="flex items-center gap-1 text-sm text-green-500 dark:text-green-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          已完成
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-amber-500 dark:text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {gridCompleted > 0 ? `${gridCompleted}/${modTarget('memory_game')}` : '未完成'}
                        </div>
                      )}
                    </button>

                    {/* 宫格推理 */}
                    <button
                      onClick={() => navigate(`/${userId}/memory/reasoning`)}
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98] mt-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30">
                          <span className="text-xl">🧩</span>
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">宫格推理</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">今天可做</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        去挑战
                      </div>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
    </Layout>
  );
}
