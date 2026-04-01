import { getSlug } from '../lib/tags';
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

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
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

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dayStr = `星期${weekDays[today.getDay()]}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-64.png" alt="拱卒" className="w-8 h-8 rounded" />
            <span className="text-lg font-bold text-gray-900">拱卒</span>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <span className="text-sm font-medium text-gray-700">{userName}</span>
              <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-blue-200 transition" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-400">{userId}</p>
                </div>
                <button
                  onClick={() => { setShowMenu(false); navigate('/login/select'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  🔄 切换用户
                </button>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  🚪 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
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
                onClick={() => navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)}
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
