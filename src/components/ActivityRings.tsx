import { useMemo } from 'react';

interface RingDef {
  value: number; // 0-1
  color: string;
}

interface ActivityRingsProps {
  rings: RingDef[];
  size?: number;
  strokeWidth?: number;
  dimmed?: boolean;
}

export default function ActivityRings({
  rings,
  size = 32,
  strokeWidth = 3,
  dimmed = false,
}: ActivityRingsProps) {
  const arcs = useMemo(() => {
    if (rings.length === 0) return [];

    const gap = strokeWidth + 0.5;
    
    return rings.map((ring, i) => {
      const radius = (size / 2) - (gap * i) - strokeWidth / 2 - 0.5;
      if (radius <= 1) return null;
      const circumference = 2 * Math.PI * radius;
      const v = Math.min(Math.max(ring.value, 0), 1);
      const offset = circumference * (1 - v);
      
      return { radius, circumference, offset, color: ring.color, value: v };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
  }, [rings, size, strokeWidth]);

  if (arcs.length === 0) return null;

  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 m-auto pointer-events-none"
    >
      {arcs.map((arc, i) => (
        <g key={i}>
          {/* Track — same hue, low opacity */}
          <circle
            cx={center}
            cy={center}
            r={arc.radius}
            fill="none"
            stroke={dimmed ? '#888' : arc.color}
            strokeWidth={strokeWidth}
            opacity={dimmed ? 0.1 : 0.2}
          />
          {/* Active arc */}
          {arc.value > 0 && (
            <circle
              cx={center}
              cy={center}
              r={arc.radius}
              fill="none"
              stroke={dimmed ? '#999' : arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.circumference}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              opacity={dimmed ? 0.3 : 1}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
