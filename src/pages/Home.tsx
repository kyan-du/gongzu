import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logout } from '../lib/api';

interface Quiz {
  id: string;
  tag: string;
  title: string;
  date: string;
  questions: any[];
}

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;
  const avatarSrc = userId === 'cyan' ? '/avatar-cyan.jpg' : '/avatar-ryan.jpg';

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/quiz?userId=${userId}&date=${today}`);
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      } catch (e) {
        console.error('Failed to fetch quizzes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [userId]);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dayStr = `星期${weekDays[today.getDay()]}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-64.png" alt="拱卒" className="w-8 h-8 rounded" />
          <span className="text-lg font-bold text-gray-900">拱卒</span>
        </div>
        <div className="flex items-center gap-3">
          <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
          <span className="text-sm font-medium text-gray-700">{userName}</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white border-b px-4 py-3 shadow-sm">
          <button
            onClick={() => navigate('/login/select')}
            className="w-full text-left py-2 px-3 text-sm text-gray-700 hover:bg-gray-50 rounded"
          >
            🔄 切换用户
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full text-left py-2 px-3 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            🚪 退出登录
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📅 今天 {dateStr}</h2>
          <p className="text-sm text-gray-500">{dayStr}</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">加载中...</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500">今天还没有作业</p>
            <p className="text-sm text-gray-400 mt-2">明天见！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => navigate(`/${userId}/${quiz.date}/${encodeURIComponent(quiz.tag)}`)}
                className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {quiz.tag.includes('英语') ? '🔤' : quiz.tag.includes('西游') ? '🐒' : quiz.tag.includes('单词') ? '📖' : '📝'}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{quiz.tag}</div>
                    <div className="text-sm text-gray-500">{quiz.questions?.length || 0} 题</div>
                  </div>
                </div>
                <div className="text-red-500 text-sm font-medium">🔴 未完成</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
