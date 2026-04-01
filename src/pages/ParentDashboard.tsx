import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, Monitor, CheckCircle, Target, BookOpen } from 'lucide-react';
import { getStoredTheme, setStoredTheme } from '../lib/theme';
import { logout } from '../lib/api';

interface DayData {
  date: string;
  total: number;
  completed: number;
  correct: number;
  rate: number;
}

interface TagData {
  tag: string;
  total: number;
  correct: number;
  rate: number;
}

interface ParentData {
  today: { total: number; completed: number; correct: number; rate: number };
  history: DayData[];
  byTag: TagData[];
}

const children = [
  { id: 'cyan', name: '彤彤', avatar: '/avatar-cyan.jpg' },
  { id: 'ryan', name: '可可', avatar: '/avatar-ryan.jpg' },
];

function TrendChart({ data, range }: { data: DayData[]; range: 'week' | 'month' }) {
  if (data.length === 0) {
    return <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">暂无数据</div>;
  }

  const W = 100;
  const H = 50;
  const padX = 2;
  const padY = 5;
  const points = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * (W - padX * 2),
    y: padY + (1 - d.rate) * (H - padY * 2),
    ...d,
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${points[points.length - 1].x},${H - padY} L${points[0].x},${H - padY} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${range}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line
            key={v}
            x1={padX}
            y1={padY + (1 - v) * (H - padY * 2)}
            x2={W - padX}
            y2={padY + (1 - v) * (H - padY * 2)}
            stroke="currentColor"
            className="text-gray-100 dark:text-gray-700"
            strokeWidth="0.3"
          />
        ))}
        <path d={area} fill={`url(#grad-${range})`} />
        <path d={line} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#3B82F6" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [activeChild, setActiveChild] = useState('cyan');
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const menuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/parent?child=${activeChild}&range=${range}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeChild, range]);

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

  const cycleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    setStoredTheme(next);
  };

  const themeLabel = theme === 'light' ? '浅色模式' : theme === 'dark' ? '深色模式' : '跟随系统';
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  const rateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600 dark:text-green-400';
    if (rate >= 0.6) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const rateBg = (rate: number) => {
    if (rate >= 0.8) return 'bg-green-50 dark:bg-green-900/20';
    if (rate >= 0.6) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">家长</span>
              <img src="/avatar-parent.jpg" alt="家长" className="w-8 h-8 rounded-full object-cover" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 py-2 z-50 origin-top-right animate-[dropdown_0.15s_ease-out]">
                <div className="px-4 py-3 flex items-center gap-3">
                  <img src="/avatar-parent.jpg" alt="家长" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">家长</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">parent</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1" />
                <div className="px-4 py-1.5">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">切换到孩子</p>
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => { setShowMenu(false); navigate(`/${child.id}/home`); }}
                      className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition rounded-lg flex items-center gap-2.5"
                    >
                      <img src={child.avatar} alt={child.name} className="w-6 h-6 rounded-full object-cover" />
                      {child.name}
                    </button>
                  ))}
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3 my-1" />
                <button
                  onClick={cycleTheme}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <span className="flex items-center gap-2.5"><ThemeIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />{themeLabel}</span>
                </button>
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Child tabs with avatars */}
        <div className="flex gap-3 mb-6">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setActiveChild(child.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium transition ${
                activeChild === child.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md'
              }`}
            >
              <img
                src={child.avatar}
                alt={child.name}
                className={`w-7 h-7 rounded-full object-cover ${activeChild === child.id ? 'ring-2 ring-white/50' : ''}`}
              />
              {child.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : data ? (
          <>
            {/* Today overview */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
                <Target className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.today.completed}/{data.today.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">今日完成</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${rateColor(data.today.rate)}`}>
                  {data.today.total > 0 ? Math.round(data.today.rate * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">正确率</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
                <BookOpen className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.today.correct}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">答对题数</div>
              </div>
            </div>

            {/* By tag */}
            {data.byTag.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">按科目</h3>
                <div className="space-y-2">
                  {data.byTag.map((t) => (
                    <div key={t.tag} className={`flex items-center justify-between p-3 rounded-xl ${rateBg(t.rate)}`}>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.tag}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t.correct}/{t.total}</span>
                        <span className={`text-sm font-bold ${rateColor(t.rate)}`}>
                          {Math.round(t.rate * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trend chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">正确率趋势</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setRange('week')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      range === 'week'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    7天
                  </button>
                  <button
                    onClick={() => setRange('month')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      range === 'month'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    30天
                  </button>
                </div>
              </div>
              <TrendChart data={data.history} range={range} />
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载失败</div>
        )}
      </div>
    </div>
  );
}
