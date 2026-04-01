import { getSlug } from '../lib/tags';
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
      <div className="relative h-dvh flex items-center justify-center p-4 overflow-hidden">
        <video autoPlay muted loop playsInline poster="/bg-poster.jpg" className="absolute inset-0 w-full h-full object-cover">
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 drop-shadow-sm">拱卒</h1>
            <p className="text-lg text-gray-700">
              {userName}，{date} 的练习
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">请输入密码</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90"
                  placeholder="密码"
                  autoFocus
                  required
                />
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
              <button type="submit" className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
                进入
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-dvh flex items-center justify-center text-gray-400">加载中...</div>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500">{date} 还没有作业</p>
          <button onClick={() => navigate(`/${userId}/home`)} className="mt-4 text-blue-600 hover:underline">
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // If only one quiz, go directly to it
  if (quizzes.length === 1) {
    navigate(`/${userId}/${date}/${getSlug(quizzes[0].tag)}`, { replace: true });
    return null;
  }

  // Multiple quizzes: show list
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <img src="/logo-64.png" alt="拱卒" className="w-8 h-8 rounded" />
        <span className="text-lg font-bold text-gray-900">拱卒</span>
      </div>
      <div className="max-w-md mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📅 {date} 的作业</h2>
        <div className="space-y-3">
          {quizzes.map((quiz: any) => (
            <button
              key={quiz.id}
              onClick={() => navigate(`/${userId}/${date}/${getSlug(quiz.tag)}`)}
              className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {quiz.tag.includes('英语') ? '🔤' : quiz.tag.includes('西游') ? '🐒' : '📝'}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{quiz.tag}</div>
                  <div className="text-sm text-gray-500">{quiz.questions?.length || 0} 题</div>
                </div>
              </div>
              <span className="text-blue-600">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
