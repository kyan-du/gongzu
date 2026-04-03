import { useMemo } from 'react';

interface RingDef {
  value: number; // 0-1
  color: string;
}

interface ActivityRingsProps {
  /** Ring definitions — only rings with meaningful data */
  rings: RingDef[];
  /** Diameter in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Dim rings (non-current month) */
  dimmed?: boolean;
}

const DIMMED_COLOR = '#C7C7CC';

export default function ActivityRings({
  rings,
  size = 32,
  strokeWidth = 2,
  dimmed = false,
}: ActivityRingsProps) {
  const arcs = useMemo(() => {
    if (rings.length === 0) return [];

    const gap = strokeWidth + 1.5;
    
    return rings.map((ring, i) => {
      const radius = (size / 2) - (gap * i) - strokeWidth / 2 - 0.5;
      if (radius <= 2) return null;
      const circumference = 2 * Math.PI * radius;
      const v = Math.min(Math.max(ring.value, 0), 1);
      const offset = circumference * (1 - v);
      
      return { radius, circumference, offset, color: dimmed ? DIMMED_COLOR : ring.color, value: v };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
  }, [rings, dimmed, size, strokeWidth]);

  if (arcs.length === 0) return null;

  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 m-auto pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {arcs.map((arc, i) => (
        <g key={i}>
          {/* Subtle track */}
          <circle
            cx={center}
            cy={center}
            r={arc.radius}
            fill="none"
            stroke={dimmed ? DIMMED_COLOR : arc.color}
            strokeWidth={strokeWidth}
            opacity={0.12}
          />
          {/* Active arc */}
          {arc.value > 0 && (
            <circle
              cx={center}
              cy={center}
              r={arc.radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.circumference}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              opacity={dimmed ? 0.35 : 0.85}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
