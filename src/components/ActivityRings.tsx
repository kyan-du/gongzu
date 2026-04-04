import { useMemo, useRef, useEffect, useState } from 'react';

interface RingDef {
  filledPercentage: number; // 0-1
  color: string;
  ringWidth?: number;
}

interface ActivityRingsProps {
  rings: RingDef[];
  /** Container size in px */
  size?: number;
  /** Dim for non-current month / selected */
  dimmed?: boolean;
  /** Animation duration in ms (0 = no animation) */
  animationMs?: number;
  /** Background ring opacity */
  bgOpacity?: number;
}

interface ArcData {
  radius: number;
  circumference: number;
  targetOffset: number;
  color: string;
  width: number;
}

export default function ActivityRings({
  rings,
  size = 32,
  dimmed = false,
  animationMs = 600,
  bgOpacity = 0.2,
}: ActivityRingsProps) {
  const [animated, setAnimated] = useState(animationMs === 0);
  const ref = useRef<SVGSVGElement>(null);

  // Auto-compute ringWidth based on size and ring count
  const effectiveWidth = useMemo(() => {
    const numRings = rings.length || 1;
    // Each ring needs: width + gap(1px). Total available = radius - 2px padding
    const available = (size / 2) - 2;
    const w = Math.max(2, Math.floor(available / (numRings * 1.5)));
    return Math.min(w, 6); // cap at 6
  }, [rings.length, size]);

  const arcs = useMemo((): ArcData[] => {
    if (rings.length === 0) return [];

    const result: ArcData[] = [];
    let currentRadius = (size / 2) - 1;
    
    for (let i = 0; i < rings.length; i++) {
      const ring = rings[i];
      const w = ring.ringWidth ?? effectiveWidth;
      const r = currentRadius - w / 2;
      if (r <= 0) break;
      
      const circumference = 2 * Math.PI * r;
      const v = Math.min(Math.max(ring.filledPercentage, 0), 1);
      const offset = circumference * (1 - v);
      
      result.push({
        radius: r,
        circumference,
        targetOffset: offset,
        color: ring.color,
        width: w,
      });
      
      currentRadius = r - w / 2 - 1;
    }
    
    return result;
  }, [rings, size, effectiveWidth]);

  // Trigger animation after mount
  useEffect(() => {
    if (animationMs > 0 && !animated) {
      const timer = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(timer);
    }
  }, [animationMs, animated]);

  if (arcs.length === 0) return null;

  const center = size / 2;

  return (
    <svg
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${size} ${size}`}
    >
      {arcs.map((arc, i) => (
        <g key={i}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={arc.radius}
            fill="none"
            stroke={dimmed ? '#888' : arc.color}
            strokeWidth={arc.width}
            opacity={dimmed ? 0.08 : bgOpacity}
          />
          {/* Active arc with animation */}
          {arc.targetOffset < arc.circumference && (
            <circle
              cx={center}
              cy={center}
              r={arc.radius}
              fill="none"
              stroke={dimmed ? '#999' : arc.color}
              strokeWidth={arc.width}
              strokeDasharray={arc.circumference}
              strokeDashoffset={animated ? arc.targetOffset : arc.circumference}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              opacity={dimmed ? 0.3 : 1}
              style={{
                transition: animationMs > 0 ? `stroke-dashoffset ${animationMs}ms ease-out` : undefined,
              }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
