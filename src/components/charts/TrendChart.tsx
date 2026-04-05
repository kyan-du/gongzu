import type { DayData } from '../../lib/types';

interface TrendChartProps {
  data: DayData[];
  range: string;
}

export default function TrendChart({ data, range }: TrendChartProps) {
  if (data.length === 0) {
    return <div className="text-center text-gray-400 py-8 text-sm">暂无数据</div>;
  }

  const W = 320;
  const H = 160;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const startDate = new Date(data[0].date);
  const endDate = new Date(data[data.length - 1].date);
  const dateMap = new Map(data.map((d) => [d.date, d]));

  const filled: DayData[] = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().split('T')[0];
    filled.push(
      dateMap.get(ds) || { date: ds, total: 0, completed: 0, correct: 0, rate: 0 }
    );
  }

  const pts = filled.map((d, i) => ({
    x: padL + (i / Math.max(filled.length - 1, 1)) * chartW,
    y: padT + (1 - d.rate) * chartH,
    ...d,
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${padT + chartH} L${pts[0].x.toFixed(1)},${padT + chartH} Z`;

  const yLabels = [0, 25, 50, 75, 100];
  const xCount = Math.min(5, filled.length);
  const xIdx: number[] = [];
  for (let i = 0; i < xCount; i++) {
    xIdx.push(Math.round((i * (filled.length - 1)) / Math.max(xCount - 1, 1)));
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '180px' }}>
      <defs>
        <linearGradient id={`g-${range}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis labels and grid */}
      {yLabels.map((v) => {
        const y = padT + (1 - v / 100) * chartH;
        return (
          <g key={v}>
            <line
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth="0.5"
              strokeDasharray={v === 0 ? 'none' : '2,2'}
            />
            <text
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-gray-400"
              style={{ fontSize: '8px' }}
            >
              {v}%
            </text>
          </g>
        );
      })}

      {/* Area and line */}
      <path d={area} fill={`url(#g-${range})`} />
      <path
        d={line}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {pts.map((p, i) => (
        <g key={i}>
          {p.total > 0 ? (
            <>
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill="white"
                stroke="#10B981"
                strokeWidth="1.5"
              />
              {(filled.length <= 10 || i % Math.ceil(filled.length / 8) === 0) && (
                <text
                  x={p.x}
                  y={p.y - 6}
                  textAnchor="middle"
                  className="fill-gray-600 dark:fill-gray-300"
                  style={{ fontSize: '7px', fontWeight: 600 }}
                >
                  {Math.round(p.rate * 100)}%
                </text>
              )}
            </>
          ) : (
            <circle cx={p.x} cy={p.y} r="2" fill="#D1D5DB" />
          )}
        </g>
      ))}

      {/* X-axis labels */}
      {xIdx.map((i) => (
        <text
          key={i}
          x={pts[i].x}
          y={H - 6}
          textAnchor="middle"
          className="fill-gray-400"
          style={{ fontSize: '8px' }}
        >
          {filled[i].date.slice(5)}
        </text>
      ))}
    </svg>
  );
}
