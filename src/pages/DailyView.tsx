import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { CheckCircle, ChevronLeft, ChevronRight, BookOpen, Languages, PenLine, Clock, BookX, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';

interface Quiz {
  id: string;
  tag: string;
  title: string;
  date: string;
  passage?: string | null;
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
  const [currentDate, setCurrentDate] = useState(() => {
    if (dateParam && dateParam !== 'today' && dateParam !== 'home') {
      const parsed = new Date(dateParam + 'T00:00:00');
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [quizStatus, setQuizStatus] = useState<Record<string, { completed: boolean; answered: number; total: number; correct: number; accuracy: number | null }>>({});
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [redoLoading, setRedoLoading] = useState(false);
  const [hasRedoToday, setHasRedoToday] = useState(false);

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
      <Header userId={userId || ''} showBack />

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

            {/* 错题本入口 */}
            {mistakesCount > 0 && (
              <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
                <button
                  onClick={() => navigate(`/${userId}/mistakes`)}
                  className="flex items-center gap-3 flex-1 active:scale-[0.98] transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <BookX className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">错题本</div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">{mistakesCount}个知识点待复习</div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  {isToday(currentDate) && !hasRedoToday && (
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
            )}
          </div>

        )}
      </div>
    </div>
  );
}
