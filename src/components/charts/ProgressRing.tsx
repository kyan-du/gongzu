interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  color?: string;
}

export default function ProgressRing({
  value,
  max,
  size = 44,
  color = '#3B82F6',
}: ProgressRingProps) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-gray-200 dark:text-gray-700"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${pct * circ} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-gray-900 dark:fill-gray-100"
        style={{ fontSize: '11px', fontWeight: 700 }}
      >
        {max > 0 ? `${value}/${max}` : '—'}
      </text>
    </svg>
  );
}
