import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { LogOut, CheckCircle, ChevronLeft, ChevronRight, ChevronDown, BookOpen, Languages, PenLine, Clock, Sun, Moon, Monitor, Users, Palette, Check } from 'lucide-react';
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

function isToday(d: Date) {
  return toDateStr(d) === toDateStr(new Date());
}

export default function DailyView() {
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
        setQuizzes((data.quizzes || []).map(normalizeQuiz));
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



  const goPrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
    navigate(`/${userId}/${toDateStr(d)}`, { replace: true });
  };

  const goNext = () => {
    if (isToday(currentDate)) return;
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
    navigate(isToday(d) ? `/${userId}/today` : `/${userId}/${toDateStr(d)}`, { replace: true });
  };

  const goToday = () => {
    setCurrentDate(new Date());
    navigate(`/${userId}/today`, { replace: true });
  };

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
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">日拱一卒，功不唐捐</p>
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

      {/* Date navigation */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isToday(currentDate) ? '今天' : ''} {formatDate(currentDate)}
            </h2>
            {!isToday(currentDate) && (
              <button onClick={goToday} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium ml-1">
                回到今天
              </button>
            )}
          </div>
          <button
            onClick={goNext}
            disabled={isToday(currentDate)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition ${isToday(currentDate) ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quiz list */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500 dark:text-gray-400">{isToday(currentDate) ? '今天还没有作业' : '这天没有作业'}</p>
            {isToday(currentDate) && <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">明天见！</p>}
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
    </div>
  );
}
