import { useState, useEffect } from 'react';
import { CheckCircle, Target, BookOpen } from 'lucide-react';
import Header from '../components/Header';

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

  const W = 320;
  const H = 160;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Fill missing dates with 0
  const startDate = new Date(data[0].date);
  const endDate = new Date(data[data.length - 1].date);
  const dateMap = new Map(data.map(d => [d.date, d]));
  const filledData: DayData[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().split('T')[0];
    filledData.push(dateMap.get(ds) || { date: ds, total: 0, completed: 0, correct: 0, rate: 0 });
  }

  const points = filledData.map((d, i) => ({
    x: padL + (i / Math.max(filledData.length - 1, 1)) * chartW,
    y: padT + (1 - d.rate) * chartH,
    ...d,
  }));

  // Smooth curve using cardinal spline
  const lineSegments: string[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      lineSegments.push(`M${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`);
    } else {
      lineSegments.push(`L${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`);
    }
  }
  const line = lineSegments.join(' ');
  const area = `${line} L${points[points.length - 1].x.toFixed(1)},${padT + chartH} L${points[0].x.toFixed(1)},${padT + chartH} Z`;

  // Y axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // X axis labels (show ~5 labels evenly)
  const xLabelCount = Math.min(5, filledData.length);
  const xIndices: number[] = [];
  for (let i = 0; i < xLabelCount; i++) {
    xIndices.push(Math.round(i * (filledData.length - 1) / Math.max(xLabelCount - 1, 1)));
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '200px' }}>
      <defs>
        <linearGradient id={`grad-${range}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yLabels.map((v) => {
        const y = padT + (1 - v / 100) * chartH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray={v === 0 ? 'none' : '2,2'} />
            <text x={padL - 4} y={y + 3} textAnchor="end" className="fill-gray-400" style={{ fontSize: '8px' }}>{v}%</text>
          </g>
        );
      })}

      {/* Area + Line */}
      <path d={area} fill={`url(#grad-${range})`} />
      <path d={line} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          {p.total > 0 && (
            <>
              <circle cx={p.x} cy={p.y} r="3" fill="white" stroke="#10B981" strokeWidth="1.5" />
              {/* Show rate label on points where data exists and not too crowded */}
              {(filledData.length <= 10 || i % Math.ceil(filledData.length / 8) === 0) && (
                <text x={p.x} y={p.y - 6} textAnchor="middle" className="fill-gray-600 dark:fill-gray-300" style={{ fontSize: '7px', fontWeight: 600 }}>
                  {Math.round(p.rate * 100)}%
                </text>
              )}
            </>
          )}
          {p.total === 0 && (
            <circle cx={p.x} cy={p.y} r="2" fill="#D1D5DB" />
          )}
        </g>
      ))}

      {/* X axis labels */}
      {xIndices.map((idx) => (
        <text key={idx} x={points[idx].x} y={H - 6} textAnchor="middle" className="fill-gray-400" style={{ fontSize: '8px' }}>
          {filledData[idx].date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

export default function ParentDashboard() {
  const [activeChild, setActiveChild] = useState('cyan');
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month'>('week');

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
      <Header userId="parent" />

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
