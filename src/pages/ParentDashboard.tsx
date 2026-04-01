import { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, Award } from 'lucide-react';

interface TodayStats {
  total: number;
  completed: number;
  correct: number;
  rate: number;
}

interface DayStats {
  date: string;
  total: number;
  completed: number;
  correct: number;
  rate: number;
}

interface TagStats {
  tag: string;
  total: number;
  correct: number;
  rate: number;
}

interface ParentData {
  today: TodayStats;
  history: DayStats[];
  byTag: TagStats[];
}

export default function ParentDashboard() {
  const [activeChild, setActiveChild] = useState<'cyan' | 'ryan'>('cyan');
  const [data, setData] = useState<ParentData | null>(null);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/parent?child=${activeChild}&range=${range}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to fetch parent data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeChild, range]);

  const renderLineChart = () => {
    if (!data || data.history.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxRate = Math.max(...data.history.map(d => d.rate), 1);
    const points = data.history.map((d, i) => {
      const x = padding + (i / (data.history.length - 1)) * chartWidth;
      const y = padding + chartHeight - (d.rate / maxRate) * chartHeight;
      return { x, y, rate: d.rate };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padding + chartHeight - ratio * chartHeight;
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-400 dark:fill-gray-500"
              >
                {Math.round(ratio * 100)}%
              </text>
            </g>
          );
        })}

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500 dark:text-blue-400"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            className="fill-blue-500 dark:fill-blue-400"
          />
        ))}

        {/* X-axis labels */}
        {data.history.map((d, i) => {
          if (i % Math.ceil(data.history.length / 7) !== 0) return null;
          const x = padding + (i / (data.history.length - 1)) * chartWidth;
          const label = d.date.slice(5);
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-400 dark:fill-gray-500"
            >
              {label}
            </text>
          );
        })}
      </svg>
    );
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
        </div>
      </div>

      {/* Tab switcher */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveChild('cyan')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeChild === 'cyan'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            彤彤
          </button>
          <button
            onClick={() => setActiveChild('ryan')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeChild === 'ryan'
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            可可
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : !data ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载失败</div>
        ) : (
          <>
            {/* Today overview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">今日概览</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>完成进度</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {data.today.completed}/{data.today.total}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>正确率</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(data.today.rate * 100)}%
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>正确题数</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.today.correct}
                  </div>
                </div>
              </div>
            </div>

            {/* By subject */}
            {data.byTag.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">按科目分类</h3>
                <div className="space-y-2">
                  {data.byTag.map(tag => (
                    <div key={tag.tag} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{tag.tag}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{tag.correct}/{tag.total}</span>
                        <span className={`text-sm font-semibold ${tag.rate >= 0.8 ? 'text-green-600 dark:text-green-400' : tag.rate >= 0.6 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                          {Math.round(tag.rate * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trend chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">历史趋势</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRange('week')}
                    className={`text-xs px-3 py-1 rounded-lg transition ${
                      range === 'week'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    7天
                  </button>
                  <button
                    onClick={() => setRange('month')}
                    className={`text-xs px-3 py-1 rounded-lg transition ${
                      range === 'month'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    30天
                  </button>
                </div>
              </div>
              {renderLineChart()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
