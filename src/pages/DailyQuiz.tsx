import { getSlug } from '../lib/tags';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isLoggedIn, login } from '../lib/api';

export default function DailyQuiz() {
  const { userId, date } = useParams<{ userId: string; date: string }>();
  const navigate = useNavigate();
  const [needsAuth, setNeedsAuth] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const avatarSrc = userId === 'cyan' ? '/avatar-cyan.jpg' : userId === 'ryan' ? '/avatar-ryan.jpg' : '/avatar-parent.jpg';

  useEffect(() => {
    if (!isLoggedIn()) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }
    fetchQuizzes();
  }, [userId, date]);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch(`/api/quiz?userId=${userId}&date=${date}`);
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(passphrase, userId);
      setNeedsAuth(false);
      setLoading(true);
      fetchQuizzes();
    } catch (err: any) {
      setError(err.message || '密码错误');
    }
  };

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Unified header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/${userId}/home`)} className="hover:opacity-80 transition">
                <img src="/logo-night-64.png" alt="拱卒" className="w-8 h-8 rounded-full object-cover dark:hidden" />
                <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8 rounded-full object-cover hidden dark:block" />
              </button>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">日拱一卒，功不唐捐</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
              <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
        </div>

        <div className="max-w-sm mx-auto px-4 mt-16">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {userName}，{date} 的练习
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <form onSubmit={handleLogin}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">请输入密码</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="密码"
                  autoFocus
                  required
                />
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm">
                进入
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-dvh flex items-center justify-center text-gray-400 dark:text-gray-500 dark:bg-gray-900">加载中...</div>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/${userId}/home`)} className="hover:opacity-80 transition">
                <img src="/logo-night-64.png" alt="拱卒" className="w-8 h-8 rounded-full object-cover dark:hidden" />
                <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8 rounded-full object-cover hidden dark:block" />
              </button>
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">日拱一卒，功不唐捐</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userName}</span>
              <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500 dark:text-gray-400">{date} 还没有作业</p>
            <button onClick={() => navigate(`/${userId}/home`)} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline">
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If only one quiz, go directly to it
  if (quizzes.length === 1) {
    navigate(`/${userId}/${date}/${getSlug(quizzes[0].tag)}`, { replace: true });
    return null;
  }

  // Multiple quizzes: show list (same style as Home)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(`/${userId}/home`)} className="hover:opacity-80 transition">
            <img src="/logo-night-64.png" alt="拱卒" className="w-8 h-8 rounded-full object-cover dark:hidden" />
            <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8 rounded-full object-cover hidden dark:block" />
          </button>
          <div>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">拱卒</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">日拱一卒，功不唐捐</p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">📅 {date} 的作业</h2>
        <div className="space-y-3">
          {quizzes.map((quiz: any) => (
            <button
              key={quiz.id}
              onClick={() => navigate(`/${userId}/${date}/${getSlug(quiz.tag)}`)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {quiz.tag.includes('阅读') ? '📖' : quiz.tag.includes('英语') ? '🔤' : quiz.tag.includes('西游') ? '🐒' : '📝'}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{quiz.title || quiz.tag}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{quiz.questions?.length || 0} 题</div>
                </div>
              </div>
              <span className="text-gray-300 dark:text-gray-600">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
