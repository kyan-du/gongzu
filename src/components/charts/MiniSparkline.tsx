import type { DayData } from '../../lib/types';

interface MiniSparklineProps {
  data: DayData[];
}

export default function MiniSparkline({ data }: MiniSparklineProps) {
  if (data.length === 0) return null;

  const W = 120;
  const H = 36;
  const pad = 2;

  const pts = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2),
    y: pad + (1 - d.rate) * (H - pad * 2),
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '36px' }}>
      <path
        d={line}
        fill="none"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r="2.5"
          fill="#10B981"
        />
      )}
    </svg>
  );
}
