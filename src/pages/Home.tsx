import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { CheckCircle, Clock, BookX, ChevronLeft, ChevronRight, BookOpen, Languages, PenLine } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyDayData>>({});
  const [monthlyCache, setMonthlyCache] = useState<Record<string, Record<string, MonthlyDayData>>>({});

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

  // Monthly data with cache
  useEffect(() => {
    const monthKey = toMonthStr(calMonth);
    if (monthlyCache[monthKey]) { setMonthlyData(monthlyCache[monthKey]); return; }
    fetch(`/api/status/monthly?userId=${userId}&month=${monthKey}`)
      .then(r => r.json())
      .then(data => {
        const map: Record<string, MonthlyDayData> = {};
        for (const d of (data.dailyData || [])) map[d.date] = d;
        setMonthlyData(map);
        setMonthlyCache(prev => ({ ...prev, [monthKey]: map }));
      })
      .catch(() => {});
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

  function getDayStatus(dateStr: string, isFuture: boolean): 'none' | 'complete' | 'partial' | 'empty' {
    if (isFuture) return 'none';
    const d = monthlyData[dateStr];
    if (!d || d.quizCount === 0) return 'none';
    if (d.completedCount === d.quizCount) return 'complete';
    if (d.answeredQuestions > 0) return 'partial';
    return 'empty';
  }

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Ensure calendar shows the right month
    const [y, m] = dateStr.split('-').map(Number);
    if (toMonthStr(calMonth) !== `${y}-${String(m).padStart(2, '0')}`) {
      setCalMonth(new Date(y, m - 1, 1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header userId={userId || ''} maxWidth="max-w-3xl" />

      <div className="max-w-3xl mx-auto px-4 py-6">
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
                  const status = getDayStatus(d.date, d.isFuture);
                  const isClickable = d.isCurrentMonth && !d.isFuture;
                  const isSelected = d.date === selectedDate;

                  return (
                    <button key={i} disabled={!isClickable}
                      onClick={() => isClickable && handleDateClick(d.date)}
                      className={`
                        relative w-full aspect-square flex items-center justify-center text-xs rounded-md transition
                        ${!d.isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : ''}
                        ${d.isCurrentMonth && d.isFuture ? 'text-gray-300 dark:text-gray-600' : ''}
                        ${d.isCurrentMonth && !d.isFuture && !d.isToday && !isSelected ? 'text-gray-700 dark:text-gray-300' : ''}
                        ${d.isToday && !isSelected ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold' : ''}
                        ${isSelected ? 'bg-amber-500 text-white font-bold shadow-sm' : ''}
                        ${isClickable && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                        ${!isClickable ? 'cursor-default' : ''}
                      `}>
                      {d.day}
                      {d.isCurrentMonth && !d.isFuture && !isSelected && status !== 'none' && (
                        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                          status === 'complete' ? 'bg-emerald-500' :
                          status === 'partial' ? 'bg-amber-500' : 'bg-red-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mistakes Card */}
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
          </div>

          {/* RIGHT COLUMN: Selected day content */}
          <div className="flex-1 min-w-0">
            {/* Date label */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatDateLabel(selectedDate, todayStr)}
              </h2>
              {selectedDate !== todayStr && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDate}</p>
              )}
            </div>

            {loadingDay ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
            ) : totalQuizzes === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 text-sm">
                  {selectedDate === todayStr ? '今天暂无作业' : '当天没有作业'}
                </div>
              </div>
            ) : (
              <>
                {/* Progress summary */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    allCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    completedQuizzes > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {allCompleted ? '✅ 全部完成' : `${completedQuizzes}/${totalQuizzes} 完成`}
                  </div>
                </div>

                {/* Quiz cards */}
                <div className="space-y-3">
                  {sortedQuizzes.map((quiz) => (
                    <button key={quiz.id}
                      onClick={() => navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)}
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          quiz.tag.includes('英语') ? 'bg-blue-50 dark:bg-blue-900/30' :
                          quiz.tag.includes('阅读') ? 'bg-emerald-50 dark:bg-emerald-900/30' :
                          quiz.tag.includes('西游') ? 'bg-amber-50 dark:bg-amber-900/30' :
                          'bg-gray-50 dark:bg-gray-700'
                        }`}>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
