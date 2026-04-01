import { getSlug } from '../lib/tags';
import { Users, LogOut, ChevronLeft, ChevronRight, BookOpen, Languages, PenLine, Clock } from 'lucide-react';
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
  return d.toISOString().split('T')[0];
}

function isToday(d: Date) {
  return toDateStr(d) === toDateStr(new Date());
}

export default function Home() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;
  const avatarSrc = userId === 'cyan' ? '/avatar-cyan.jpg' : '/avatar-ryan.jpg';

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const dateStr = toDateStr(currentDate);
        const res = await fetch(`/api/quiz?userId=${userId}&date=${dateStr}`);
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      } catch (e) {
        console.error('Failed to fetch quizzes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [userId, currentDate]);

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

  const goPrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goNext = () => {
    if (isToday(currentDate)) return; // don't go past today
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-day-64.png" alt="拱卒" className="w-8 h-8" />
            <div>
              <span className="text-lg font-bold text-gray-900">拱卒</span>
              <p className="text-xs text-gray-400 -mt-0.5">日拱一卒，功不唐捐</p>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <span className="text-sm font-medium text-gray-700">{userName}</span>
              <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200/60 py-2 z-50 origin-top-right animate-[dropdown_0.15s_ease-out]">
                <div className="px-4 py-3 flex items-center gap-3">
                  <img src={avatarSrc} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-400">{userId}</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100 mx-3 my-1" />
                <button
                  onClick={() => { setShowMenu(false); navigate('/login/select'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-2.5"><Users className="w-4 h-4 text-gray-400" />切换用户</span>
                </button>
                <div className="h-px bg-gray-100 mx-3 my-1" />
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-2.5"><LogOut className="w-4 h-4 text-gray-400" />退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date navigation */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 transition text-gray-500 text-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {isToday(currentDate) ? '今天' : ''} {formatDate(currentDate)}
            </h2>
            {!isToday(currentDate) && (
              <button onClick={goToday} className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1">
                回到今天
              </button>
            )}
          </div>
          <button
            onClick={goNext}
            disabled={isToday(currentDate)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition text-lg ${isToday(currentDate) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quiz list */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center text-gray-400 py-12">加载中...</div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500">{isToday(currentDate) ? '今天还没有作业' : '这天没有作业'}</p>
            {isToday(currentDate) && <p className="text-sm text-gray-400 mt-2">明天见！</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => navigate(`/${userId}/${quiz.date}/${getSlug(quiz.tag)}`)}
                className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    {quiz.tag.includes('英语') ? <Languages className="w-5 h-5 text-blue-500" /> : quiz.tag.includes('西游') ? <BookOpen className="w-5 h-5 text-amber-500" /> : <PenLine className="w-5 h-5 text-gray-500" />}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{quiz.tag}</div>
                    <div className="text-sm text-gray-500">{quiz.questions?.length || 0} 题</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-amber-500 font-medium"><Clock className="w-3.5 h-3.5" />未完成</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
