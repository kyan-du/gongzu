import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { LogOut, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, BookOpen, Languages, PenLine, Clock, Sun, Moon, Monitor, Users, Palette, Check, BookX, RotateCcw } from 'lucide-react';
import { getStoredTheme, setStoredTheme } from '../lib/theme';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logout } from '../lib/api';

interface Quiz {
  id: string;
  tag: string;
  title: string;
  date: string;
  questions: any[];
}

interface DayStatus {
  quizCount: number;
  allCompleted: boolean;
  accuracy: number | null;
}

interface MonthlyData {
  userId: string;
  month: string;
  days: Record<string, DayStatus>;
  streak: number;
}

function formatDate(d: Date) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${m}月${day}日 星期${weekDays[d.getDay()]}`;
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toMonthStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isToday(d: Date) {
  return toDateStr(d) === toDateStr(new Date());
}

function isSameDay(d1: Date, d2: Date) {
  return toDateStr(d1) === toDateStr(d2);
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days: Date[] = [];

  // Add padding days from previous month to start on Monday
  const firstDayOfWeek = firstDay.getDay();
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  for (let i = paddingDays; i > 0; i--) {
    const d = new Date(year, month - 1, 1 - i);
    days.push(d);
  }

  // Add all days of the month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month - 1, i));
  }

  // Add padding days from next month to complete the grid
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month, i));
    }
  }

  return days;
}

export default function Home() {
  const { userId, date: dateParam } = useParams<{ userId: string; date?: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (dateParam && dateParam !== 'today' && dateParam !== 'home') {
      const parsed = new Date(dateParam + 'T00:00:00');
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<Record<string, { completed: boolean; answered: number; total: number; correct: number; accuracy: number | null }>>({});
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [redoLoading, setRedoLoading] = useState(false);
  const [hasRedoToday, setHasRedoToday] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;
  const avatarSrc = userId === 'cyan' ? '/avatar-cyan.jpg' : '/avatar-ryan.jpg';

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const dateStr = toDateStr(currentDate);
        const [quizRes, statusRes] = await Promise.all([
          fetch(`/api/quiz?userId=${userId}&date=${dateStr}`),
          fetch(`/api/status?userId=${userId}&date=${dateStr}`),
        ]);
        const data = await quizRes.json();
        const allQuizzes = (data.quizzes || []).map(normalizeQuiz);
        setQuizzes(allQuizzes);
        setHasRedoToday(allQuizzes.some((q: Quiz) => q.tag.includes('错题重做')));
        try {
          const statusData = await statusRes.json();
          const statusMap: Record<string, any> = {};
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
        } catch {}
      } catch (e) {
        console.error('Failed to fetch quizzes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [userId, currentDate]);

  useEffect(() => {
    const fetchMistakesCount = async () => {
      try {
        const res = await fetch(`/api/review?userId=${userId}`);
        const data = await res.json();
        setMistakesCount((data.points || []).length);
      } catch (e) {
        console.error("Failed to fetch mistakes count:", e);
      }
    };
    fetchMistakesCount();
  }, [userId]);

  // Fetch monthly data when month changes
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const monthStr = toMonthStr(currentDate);
        const res = await fetch(`/api/status/monthly?userId=${userId}&month=${monthStr}`);
        const data = await res.json();
        setMonthlyData(data);
      } catch (e) {
        console.error("Failed to fetch monthly data:", e);
      }
    };
    fetchMonthlyData();
  }, [userId, currentDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);



  const getDayStatus = (date: Date): { status: string; hasData: boolean; answered: number } => {
    if (!monthlyData) return { status: 'no-quiz', hasData: false, answered: 0 };
    const dateStr = toDateStr(date);
    const dayData = monthlyData.days[dateStr];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate > today) return { status: 'future', hasData: false, answered: 0 };

    // No quiz data for this day
    if (!dayData || dayData.quizCount === 0) return { status: 'no-quiz', hasData: false, answered: 0 };

    // Past day with quiz data
    if (dayData.allCompleted && (dayData.accuracy === null || dayData.accuracy >= 80)) {
      return { status: 'completed-high', hasData: true, answered: dayData.quizCount }; // Green border
    } else if (dayData.allCompleted && dayData.accuracy !== null && dayData.accuracy < 80) {
      return { status: 'completed-low', hasData: true, answered: dayData.quizCount }; // Amber border
    } else if (!dayData.allCompleted && dayData.quizCount > 0) {
      // Has quiz but not completed - check if any answers
      // We assume incomplete with quizCount > 0 means some answers
      const hasAnswers = dayData.accuracy !== null; // If accuracy exists, there were answers
      return { status: hasAnswers ? 'incomplete' : 'no-answers', hasData: true, answered: 0 };
    }

    return { status: 'no-quiz', hasData: false, answered: 0 };
  };

  const selectDate = (date: Date) => {
    setCurrentDate(date);
    const dateStr = toDateStr(date);
    navigate(isToday(date) ? `/${userId}/today` : `/${userId}/${dateStr}`, { replace: true });
    if (calendarExpanded) {
      setCalendarExpanded(false);
    }
  };

  const changeCalendarMonth = (delta: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + delta);
    setCalendarMonth(newMonth);
  };

  const weekDays = getWeekDays(currentDate);
  const monthDays = getMonthDays(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1);
  const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-night-64.png" alt="拱卒" className="w-8 h-8 dark:hidden" />
            <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8 hidden dark:block" />
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 -mt-0.5">日拱一卒，功不唐捐</p>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
              <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 py-2 z-50 origin-top-right animate-[dropdown_0.15s_ease-out]">
                <div className="px-4 py-3 flex items-center gap-3">
                  <img src={avatarSrc} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{userId}</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1" />
                {/* Mistakes book */}
                <button
                  onClick={() => { setShowMenu(false); navigate(`/${userId}/mistakes`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <BookX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    错题本
                  </span>
                </button>
                {/* Switch user group */}
                <button
                  onClick={() => setExpandedSection(expandedSection === 'user' ? null : 'user')}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    切换用户
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${expandedSection === 'user' ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {expandedSection === 'user' && (
                  <div className="pl-4">
                    {userId !== 'cyan' && (
                      <button
                        onClick={() => { setShowMenu(false); setExpandedSection(null); navigate('/cyan/today'); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <span className="flex items-center gap-2.5"><img src="/avatar-cyan.jpg" alt="彤彤" className="w-5 h-5 rounded-full object-cover" />彤彤</span>
                      </button>
                    )}
                    {userId !== 'ryan' && (
                      <button
                        onClick={() => { setShowMenu(false); setExpandedSection(null); navigate('/ryan/today'); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <span className="flex items-center gap-2.5"><img src="/avatar-ryan.jpg" alt="可可" className="w-5 h-5 rounded-full object-cover" />可可</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setShowMenu(false); setExpandedSection(null); navigate('/parent'); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <span className="flex items-center gap-2.5"><img src="/avatar-parent.jpg" alt="家长" className="w-5 h-5 rounded-full object-cover" />家长</span>
                    </button>
                  </div>
                )}
                {/* Theme group */}
                <button
                  onClick={() => setExpandedSection(expandedSection === 'theme' ? null : 'theme')}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    主题
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${expandedSection === 'theme' ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {expandedSection === 'theme' && (
                  <div className="pl-4">
                    <button
                      onClick={() => { setTheme('light'); setStoredTheme('light'); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <span className="flex items-center gap-2.5"><Sun className="w-4 h-4" />浅色{theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}</span>
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setStoredTheme('dark'); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <span className="flex items-center gap-2.5"><Moon className="w-4 h-4" />深色{theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}</span>
                    </button>
                    <button
                      onClick={() => { setTheme('system'); setStoredTheme('system'); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <span className="flex items-center gap-2.5"><Monitor className="w-4 h-4" />自动{theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-500 ml-auto" />}</span>
                    </button>
                  </div>
                )}
                <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1" />
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5"><LogOut className="w-4 h-4 text-gray-400 dark:text-gray-500" />退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Week Strip */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3">
          <div className="flex items-center justify-between gap-2">
            {weekDays.map((day, idx) => {
              const statusData = getDayStatus(day);
              const isSelected = isSameDay(day, currentDate);
              const isTodayDate = isToday(day);

              let bgClass = 'bg-transparent';
              let textClass = 'text-gray-700 dark:text-gray-300';
              let borderClass = '';
              let shadowClass = '';

              // Future dates
              if (statusData.status === 'future') {
                bgClass = 'bg-transparent';
                textClass = 'text-gray-300 dark:text-gray-600 opacity-50';
              }
              // Today - solid amber fill with shadow
              else if (isTodayDate) {
                bgClass = 'bg-amber-500';
                textClass = 'text-white';
                shadowClass = 'shadow-sm';
              }
              // Selected (not today) - amber background
              else if (isSelected) {
                bgClass = 'bg-amber-100 dark:bg-amber-900/30';
                textClass = 'text-amber-600 dark:text-amber-400';
              }
              // Past days with status shown via bottom border
              else if (statusData.hasData) {
                bgClass = 'bg-transparent';
                textClass = 'text-gray-700 dark:text-gray-300';

                if (statusData.status === 'completed-high') {
                  borderClass = 'border-b-2 border-green-500';
                } else if (statusData.status === 'completed-low') {
                  borderClass = 'border-b-2 border-amber-500';
                } else if (statusData.status === 'incomplete') {
                  borderClass = 'border-b-2 border-amber-500';
                } else if (statusData.status === 'no-answers') {
                  borderClass = 'border-b-2 border-red-400';
                }
              }
              // Past with no quiz
              else if (statusData.status === 'no-quiz') {
                bgClass = 'bg-transparent';
                textClass = 'text-gray-400 dark:text-gray-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => selectDate(day)}
                  disabled={statusData.status === 'future'}
                  className={`flex-1 min-w-[40px] py-2 rounded-lg flex flex-col items-center justify-center transition hover:scale-105 disabled:hover:scale-100 disabled:cursor-default ${bgClass} ${borderClass} ${shadowClass}`}
                >
                  <div className={`text-xs ${textClass} mb-0.5`}>{weekDayNames[idx]}</div>
                  <div className={`text-base font-bold ${textClass}`}>{day.getDate()}</div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCalendarExpanded(!calendarExpanded)}
            className="w-full mt-2 py-1 flex items-center justify-center text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
          >
            {calendarExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Month Calendar */}
      <div
        className={`max-w-2xl mx-auto px-4 transition-all duration-300 overflow-hidden ${
          calendarExpanded ? 'max-h-[280px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 overflow-y-auto max-h-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => changeCalendarMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
            </div>
            <button
              onClick={() => changeCalendarMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDayNames.map((name) => (
              <div key={name} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, idx) => {
              const statusData = getDayStatus(day);
              const isSelected = isSameDay(day, currentDate);
              const isTodayDate = isToday(day);
              const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();

              let bgClass = 'bg-transparent';
              let textClass = 'text-gray-700 dark:text-gray-300';
              let borderClass = '';

              if (!isCurrentMonth) {
                textClass = 'text-gray-300 dark:text-gray-700 opacity-30';
              } else {
                // Future dates
                if (statusData.status === 'future') {
                  bgClass = 'bg-transparent';
                  textClass = 'text-gray-400 dark:text-gray-600 opacity-40';
                }
                // Today - solid amber fill pill
                else if (isTodayDate) {
                  bgClass = 'bg-amber-500';
                  textClass = 'text-white';
                }
                // Selected (not today) - amber background
                else if (isSelected) {
                  bgClass = 'bg-amber-100 dark:bg-amber-900/30';
                  textClass = 'text-amber-600 dark:text-amber-400';
                }
                // Past days with data - show bottom border
                else if (statusData.hasData) {
                  bgClass = 'bg-transparent';
                  textClass = 'text-gray-700 dark:text-gray-300';

                  if (statusData.status === 'completed-high') {
                    borderClass = 'border-b-2 border-green-500';
                  } else if (statusData.status === 'completed-low') {
                    borderClass = 'border-b-2 border-amber-500';
                  } else if (statusData.status === 'incomplete') {
                    borderClass = 'border-b-2 border-amber-500';
                  } else if (statusData.status === 'no-answers') {
                    borderClass = 'border-b-2 border-red-400';
                  }
                }
                // Past without data
                else if (statusData.status === 'no-quiz') {
                  bgClass = 'bg-transparent';
                  textClass = 'text-gray-400 dark:text-gray-500';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => selectDate(day)}
                  disabled={statusData.status === 'future' || !isCurrentMonth}
                  className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition hover:scale-105 disabled:hover:scale-100 disabled:cursor-default ${bgClass} ${borderClass}`}
                >
                  <div className={`text-sm font-medium ${textClass}`}>{day.getDate()}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Separator between calendar and content */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Date Title */}
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isToday(currentDate) ? '今天 ' : ''}{formatDate(currentDate)}
        </h2>
      </div>

      {/* Quiz list */}
      <div className="max-w-2xl mx-auto px-4 py-4 mb-4">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center py-6">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-gray-500 dark:text-gray-400">今天暂无作业</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    {quiz.tag.includes('英语') ? <Languages className="w-5 h-5 text-blue-500 dark:text-blue-400" /> : quiz.tag.includes('阅读') ? <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : quiz.tag.includes('西游') ? <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" /> : <PenLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
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
                    {quizStatus[quiz.id]?.answered > 0 ? `${quizStatus[quiz.id].answered}/${quizStatus[quiz.id].total}` : '未完成'}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Always-visible mistakes summary */}
      <div className="max-w-2xl mx-auto px-4 pb-6">
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
          <button
            onClick={() => navigate(`/${userId}/mistakes`)}
            className="flex items-center gap-3 flex-1 active:scale-[0.98] transition"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              mistakesCount > 0
                ? 'bg-red-50 dark:bg-red-900/30'
                : 'bg-green-50 dark:bg-green-900/30'
            }`}>
              <BookX className={`w-5 h-5 ${
                mistakesCount > 0
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-green-500 dark:text-green-400'
              }`} />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                错题本
                {mistakesCount > 0 ? (
                  <span className="bg-red-500 text-white rounded-full w-6 h-6 text-sm font-bold inline-flex items-center justify-center">
                    {mistakesCount}
                  </span>
                ) : (
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 text-sm font-bold inline-flex items-center justify-center">
                    ✓
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                {mistakesCount > 0
                  ? '个知识点待复习'
                  : '暂无错题，继续加油💪'}
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {isToday(currentDate) && mistakesCount > 0 && !hasRedoToday && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (redoLoading) return;
                  setRedoLoading(true);
                  try {
                    const res = await fetch('/api/mistakes/redo', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, count: 5 }),
                    });
                    if (res.ok) {
                      // Refresh quiz list
                      const dateStr = toDateStr(currentDate);
                      const quizRes = await fetch(`/api/quiz?userId=${userId}&date=${dateStr}`);
                      const data = await quizRes.json();
                      const allQuizzes = (data.quizzes || []).map(normalizeQuiz);
                      setQuizzes(allQuizzes);
                      setHasRedoToday(true);
                    }
                  } catch (err) {
                    console.error('Redo failed:', err);
                  } finally {
                    setRedoLoading(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition active:scale-95"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${redoLoading ? 'animate-spin' : ''}`} />
                {redoLoading ? '生成中...' : '错题重做'}
              </button>
            )}
            {hasRedoToday && isToday(currentDate) && (
              <span className="text-xs text-gray-400 dark:text-gray-500">今日已重做</span>
            )}
            <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
