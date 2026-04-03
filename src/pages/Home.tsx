import { getSlug } from '../lib/tags';
import { normalizeQuiz } from '../lib/types';
import { CheckCircle, Clock, BookX, Calendar, BookOpen, Languages, PenLine } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  const [quizStatus, setQuizStatus] = useState<Record<string, QuizStatus>>({});
  const [mistakesCount, setMistakesCount] = useState<number>(0);

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
      <Header userId={userId || ''} />

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
