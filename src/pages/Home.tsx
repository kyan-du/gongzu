import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { CheckCircle, Clock, BookX, ChevronLeft, ChevronRight, BookOpen, Languages, PenLine } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';

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
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStatus, setQuizStatus] = useState<Record<string, QuizStatus>>({});
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyDayData>>({});
  const [monthlyCache, setMonthlyCache] = useState<Record<string, Record<string, MonthlyDayData>>>({});

  const todayStr = toDateStr(new Date());

  // Fetch today's data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [quizRes, statusRes, reviewRes] = await Promise.all([
          fetch(`/api/quiz?userId=${userId}&date=${todayStr}`),
          fetch(`/api/status?userId=${userId}&date=${todayStr}`),
          fetch(`/api/review?userId=${userId}`),
        ]);

        const quizData = await quizRes.json();
        const allQuizzes = (quizData.quizzes || []).map(normalizeQuiz);
        setQuizzes(allQuizzes);

        const statusData = await statusRes.json();
        const statusMap: Record<string, QuizStatus> = {};
        for (const q of (statusData.quizzes || [])) {
          statusMap[String(q.quizId)] = {
            completed: q.completed,
            answered: q.answered,
            total: q.totalQuestions,
            correct: q.correct,
            accuracy: q.accuracy,
          };
        }
        setQuizStatus(statusMap);

        const reviewData = await reviewRes.json();
        setMistakesCount((reviewData.points || []).length);
      } catch (e) {
        console.error('Failed to fetch data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, todayStr]);

  // Fetch monthly data (with cache)
  useEffect(() => {
    const monthKey = toMonthStr(calMonth);
    if (monthlyCache[monthKey]) {
      setMonthlyData(monthlyCache[monthKey]);
      return;
    }
    const fetchMonthly = async () => {
      try {
        const res = await fetch(`/api/status/monthly?userId=${userId}&month=${monthKey}`);
        const data = await res.json();
        const map: Record<string, MonthlyDayData> = {};
        for (const d of (data.dailyData || [])) {
          map[d.date] = d;
        }
        setMonthlyData(map);
        setMonthlyCache(prev => ({ ...prev, [monthKey]: map }));
      } catch (e) {
        console.error('Failed to fetch monthly data:', e);
      }
    };
    fetchMonthly();
  }, [userId, calMonth, monthlyCache]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isFuture: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false, isFuture: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr, day: d, isCurrentMonth: true,
        isToday: dateStr === todayStr, isFuture: dateStr > todayStr,
      });
    }

    // Next month padding
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let d = 1; d <= 7 - remainder; d++) {
        const nextM = month + 2 > 12 ? 1 : month + 2;
        const nextY = month + 2 > 12 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: false, isFuture: false });
      }
    }

    return days;
  }, [calMonth, todayStr]);

  // Progress calc
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(q => quizStatus[q.id]?.completed).length;
  const allCompleted = totalQuizzes > 0 && completedQuizzes === totalQuizzes;

  const sortedQuizzes = [...quizzes].sort((a, b) => {
    const ac = quizStatus[a.id]?.completed || false;
    const bc = quizStatus[b.id]?.completed || false;
    return ac === bc ? 0 : ac ? 1 : -1;
  });

  let ringColor = 'text-gray-300 dark:text-gray-600';
  let ringBgColor = 'text-gray-100 dark:text-gray-800';
  if (totalQuizzes > 0) {
    if (allCompleted) { ringColor = 'text-emerald-500'; ringBgColor = 'text-emerald-100 dark:text-emerald-900/30'; }
    else if (completedQuizzes > 0) { ringColor = 'text-amber-500'; ringBgColor = 'text-amber-100 dark:text-amber-900/30'; }
  }

  const progress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const prevMonth = () => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1);
    if (toMonthStr(next) <= toMonthStr(new Date())) setCalMonth(next);
  };
  const isCurrentMonth = toMonthStr(calMonth) === toMonthStr(new Date());

  function getDayStatus(dateStr: string, isFuture: boolean): 'none' | 'complete' | 'partial' | 'empty' {
    if (isFuture) return 'none';
    const d = monthlyData[dateStr];
    if (!d || d.quizCount === 0) return 'none';
    if (d.completedCount === d.quizCount) return 'complete';
    if (d.answeredQuestions > 0) return 'partial';
    return 'empty';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header userId={userId || ''} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : (
          <>
            {/* Progress Ring */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-[120px] h-[120px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                    className={totalQuizzes === 0 ? 'stroke-gray-300 dark:stroke-gray-700' : ringBgColor}
                    strokeDasharray={totalQuizzes === 0 ? '4 8' : 'none'} />
                  {totalQuizzes > 0 && (
                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                      className={ringColor} strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{completedQuizzes}/{totalQuizzes}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {totalQuizzes === 0 ? '今天暂无作业' : '今日进度'}
              </div>
            </div>

            {/* Today's Quizzes */}
            {totalQuizzes > 0 && (
              <div className="mb-6">
                {allCompleted && (
                  <div className="text-center mb-4 text-emerald-500 dark:text-emerald-400 text-sm font-medium">
                    ✅ 全部完成！干得漂亮
                  </div>
                )}
                <div className="space-y-3">
                  {sortedQuizzes.map((quiz) => (
                    <button key={quiz.id}
                      onClick={() => navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)}
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          {quiz.tag.includes('英语') ? <Languages className="w-5 h-5 text-blue-500 dark:text-blue-400" /> :
                           quiz.tag.includes('阅读') ? <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> :
                           quiz.tag.includes('西游') ? <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" /> :
                           <PenLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{quiz.tag}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{quiz.questions?.length || 0} 题</div>
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
                  ))}
                </div>
              </div>
            )}

            {/* Month Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {calMonth.getFullYear()} 年 {calMonth.getMonth() + 1} 月
                </span>
                <button onClick={nextMonth} disabled={isCurrentMonth}
                  className={`p-1 rounded-lg transition ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map(w => (
                  <div key={w} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, i) => {
                  const status = getDayStatus(d.date, d.isFuture);
                  const isClickable = d.isCurrentMonth && !d.isFuture;

                  return (
                    <button key={i} disabled={!isClickable}
                      onClick={() => isClickable && navigate(`/${userId}/${d.date}`)}
                      className={`
                        relative aspect-square flex items-center justify-center text-sm rounded-lg transition
                        ${!d.isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : ''}
                        ${d.isCurrentMonth && d.isFuture ? 'text-gray-300 dark:text-gray-600' : ''}
                        ${d.isCurrentMonth && !d.isFuture && !d.isToday ? 'text-gray-700 dark:text-gray-300' : ''}
                        ${d.isToday ? 'bg-amber-500 text-white font-bold shadow-sm' : ''}
                        ${isClickable && !d.isToday ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                        ${!isClickable ? 'cursor-default' : ''}
                      `}>
                      {d.day}
                      {d.isCurrentMonth && !d.isFuture && !d.isToday && status !== 'none' && (
                        <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                          status === 'complete' ? 'bg-emerald-500' :
                          status === 'partial' ? 'bg-amber-500' :
                          'bg-red-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mistakes Card */}
            <button onClick={() => navigate(`/${userId}/mistakes`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mistakesCount > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'
                }`}>
                  <BookX className={`w-5 h-5 ${
                    mistakesCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
                  }`} />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    错题本
                    {mistakesCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold inline-flex items-center justify-center">{mistakesCount}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {mistakesCount > 0 ? `${mistakesCount} 个知识点待复习` : '暂无错题 ✓'}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
