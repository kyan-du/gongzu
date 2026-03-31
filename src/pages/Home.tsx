import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizzes, formatDate, getTodayDate, type DailyQuiz } from '../lib/api';

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<DailyQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayDate = getTodayDate();
  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;

  useEffect(() => {
    loadQuizzes();
  }, [userId]);

  const loadQuizzes = async () => {
    try {
      const data = await getQuizzes(userId);
      setQuizzes(data);
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        // 未登录，跳转到登录页
        navigate(`/${userId}/login`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const todayQuizzes = quizzes.filter((q) => q.date === todayDate);
  const historyQuizzes = quizzes.filter((q) => q.date !== todayDate);

  // 按日期分组历史作业
  const quizzesByDate = historyQuizzes.reduce((acc, quiz) => {
    if (!acc[quiz.date]) {
      acc[quiz.date] = [];
    }
    acc[quiz.date].push(quiz);
    return acc;
  }, {} as Record<string, DailyQuiz[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mobile-container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">🏠 拱卒</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{userName}</span>
            <button className="text-gray-400 hover:text-gray-600">⚙️</button>
          </div>
        </div>
      </div>

      <div className="mobile-container">
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* 今日作业 */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-gray-900">📅 今天</span>
            <span className="text-sm text-gray-500">{formatDate(todayDate)}</span>
          </div>

          {todayQuizzes.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              今天还没有作业哦～
            </div>
          ) : (
            <div className="space-y-3">
              {todayQuizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => navigate(`/${userId}/quiz/${quiz.id}`)}
                  className="w-full bg-white rounded-xl p-4 text-left hover:shadow-md transition border-l-4 border-red-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        🔴 {quiz.title || quiz.tag}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {quiz.questions.length} 题
                      </div>
                    </div>
                    <div className="text-2xl">→</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 历史作业 */}
        {Object.keys(quizzesByDate).length > 0 && (
          <div className="mt-8">
            {Object.entries(quizzesByDate).map(([date, dateQuizzes]) => (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    📅 {formatDate(date)}
                  </span>
                </div>
                <div className="space-y-2">
                  {dateQuizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => navigate(`/${userId}/quiz/${quiz.id}`)}
                      className="w-full bg-white rounded-lg p-3 text-left hover:shadow transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {quiz.title || quiz.tag}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {quiz.questions.length} 题
                          </div>
                        </div>
                        <div className="text-gray-400">→</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部统计（占位） */}
        <div className="mt-8 mb-8 bg-white rounded-xl p-6">
          <div className="text-center text-gray-500 text-sm">
            ──── 📊 本周统计 ────
          </div>
          <div className="text-center text-gray-400 text-xs mt-2">
            即将上线
          </div>
        </div>
      </div>
    </div>
  );
}
