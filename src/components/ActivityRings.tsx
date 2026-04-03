import { useMemo } from 'react';

interface ActivityRingsProps {
  /** 0-1: quiz sets completed / total sets */
  completion: number;
  /** 0-1: correct answers / total answered */
  accuracy: number;
  /** 0-1: review questions done / review questions due */
  review: number;
  /** Whether this day has any data at all */
  hasData: boolean;
  /** Whether this is a non-current-month day or selected (grayed out) */
  dimmed?: boolean;
  /** Diameter in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
}

const ACTIVE_COLORS = ['#FF375F', '#30D158', '#0A84FF']; // red, green, blue
const DIMMED_COLOR = '#86868B';

interface RingData {
  radius: number;
  circumference: number;
  offset: number;
  activeColor: string;
  value: number;
}

export default function ActivityRings({
  completion, accuracy, review, hasData, dimmed = false, size = 36, strokeWidth = 2.5,
}: ActivityRingsProps) {
  const rings = useMemo((): RingData[] => {
    if (!hasData) return [];

    const values = [completion, accuracy, review];
    const gap = strokeWidth + 1;
    
    return values.map((value, i) => {
      const radius = (size / 2) - (gap * i) - strokeWidth / 2;
      if (radius <= 0) return null;
      const circumference = 2 * Math.PI * radius;
      const clampedValue = Math.min(Math.max(value, 0), 1);
      const offset = circumference * (1 - clampedValue);
      
      return {
        radius,
        circumference,
        offset,
        activeColor: dimmed ? DIMMED_COLOR : ACTIVE_COLORS[i],
        value: clampedValue,
      };
    }).filter((r): r is RingData => r !== null);
  }, [completion, accuracy, review, hasData, dimmed, size, strokeWidth]);

  if (!hasData || rings.length === 0) return null;

  const center = size / 2;

  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto pointer-events-none">
      {rings.map((ring, i) => (
        <g key={i}>
          {/* Track (background ring) */}
          <circle
            cx={center}
            cy={center}
            r={ring.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
            opacity={0.5}
          />
          {/* Active arc */}
          {ring.value > 0 && (
            <circle
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke={ring.activeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={ring.circumference}
              strokeDashoffset={ring.offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              opacity={dimmed ? 0.4 : 1}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
