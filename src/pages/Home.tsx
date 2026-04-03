import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { LogOut, CheckCircle, Clock, Sun, Moon, Monitor, Users, Palette, Check, BookX, Calendar, ChevronDown, BookOpen, Languages, PenLine } from 'lucide-react';
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

interface QuizStatus {
  completed: boolean;
  answered: number;
  total: number;
  correct: number;
  accuracy: number | null;
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [quizStatus, setQuizStatus] = useState<Record<string, QuizStatus>>({});
  const [mistakesCount, setMistakesCount] = useState<number>(0);

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;
  const avatarSrc = userId === 'cyan' ? '/avatar-cyan.jpg' : '/avatar-ryan.jpg';
  const todayStr = toDateStr(new Date());

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

  // Calculate progress
  const totalQuizzes = quizzes.length;
  const completedQuizzes = quizzes.filter(q => quizStatus[q.id]?.completed).length;
  const allCompleted = totalQuizzes > 0 && completedQuizzes === totalQuizzes;

  // Sort quizzes: incomplete first, completed last
  const sortedQuizzes = [...quizzes].sort((a, b) => {
    const aCompleted = quizStatus[a.id]?.completed || false;
    const bCompleted = quizStatus[b.id]?.completed || false;
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? 1 : -1;
  });

  // Progress ring color
  let ringColor = 'text-gray-300 dark:text-gray-600';
  let ringBgColor = 'text-gray-100 dark:text-gray-800';
  if (totalQuizzes > 0) {
    if (allCompleted) {
      ringColor = 'text-emerald-500';
      ringBgColor = 'text-emerald-100 dark:text-emerald-900/30';
    } else if (completedQuizzes > 0) {
      ringColor = 'text-amber-500';
      ringBgColor = 'text-amber-100 dark:text-amber-900/30';
    }
  }

  const progress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/${userId}/home`)}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <img src="/logo-night-64.png" alt="拱卒" className="w-8 h-8 dark:hidden" />
            <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8 hidden dark:block" />
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 -mt-0.5">日拱一卒，功不唐捐</p>
            </div>
          </button>
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
                <button
                  onClick={() => { setShowMenu(false); navigate(`/${userId}/mistakes`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <BookX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    错题本
                  </span>
                </button>
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
                        onClick={() => { setShowMenu(false); setExpandedSection(null); navigate('/cyan/home'); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <span className="flex items-center gap-2.5"><img src="/avatar-cyan.jpg" alt="彤彤" className="w-5 h-5 rounded-full object-cover" />彤彤</span>
                      </button>
                    )}
                    {userId !== 'ryan' && (
                      <button
                        onClick={() => { setShowMenu(false); setExpandedSection(null); navigate('/ryan/home'); }}
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

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : (
          <>
            {/* Section 1: Progress Ring */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-[120px] h-[120px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    strokeWidth="8"
                    className={totalQuizzes === 0 ? 'stroke-gray-300 dark:stroke-gray-700' : ringBgColor}
                    strokeDasharray={totalQuizzes === 0 ? '4 8' : 'none'}
                  />
                  {/* Progress circle */}
                  {totalQuizzes > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      strokeWidth="8"
                      className={ringColor}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {completedQuizzes}/{totalQuizzes}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {totalQuizzes === 0 ? '今天暂无作业' : '今日进度'}
              </div>
            </div>

            {/* Section 2: Today's Quiz Cards */}
            {totalQuizzes > 0 && (
              <div className="mb-8">
                {allCompleted && (
                  <div className="text-center mb-4 text-emerald-500 dark:text-emerald-400 text-sm font-medium">
                    ✅ 全部完成！干得漂亮
                  </div>
                )}
                <div className="space-y-3">
                  {sortedQuizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)}
                      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          {quiz.tag.includes('英语') ? (
                            <Languages className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                          ) : quiz.tag.includes('阅读') ? (
                            <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                          ) : quiz.tag.includes('西游') ? (
                            <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                          ) : (
                            <PenLine className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
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

            {/* Section 3: Bottom Cards */}
            <div className="flex gap-3">
              {/* Mistakes Book Card */}
              <button
                onClick={() => navigate(`/${userId}/mistakes`)}
                className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    mistakesCount > 0
                      ? 'bg-red-50 dark:bg-red-900/30'
                      : 'bg-green-50 dark:bg-green-900/30'
                  }`}>
                    <BookX className={`w-6 h-6 ${
                      mistakesCount > 0
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-green-500 dark:text-green-400'
                    }`} />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    错题本
                    {mistakesCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                        {mistakesCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {mistakesCount > 0 ? `${mistakesCount} 个知识点待复习` : '暂无错题 ✓'}
                  </div>
                </div>
              </button>

              {/* History Card */}
              <button
                onClick={() => navigate(`/${userId}/today`)}
                className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    历史记录
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    查看往日练习
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
