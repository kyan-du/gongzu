interface EquivScaleProps {
  leftItems: string[];
  rightItems: string[];
}

export default function EquivScale({ leftItems, rightItems }: EquivScaleProps) {
  // ── Geometry ──
  const PIVOT_X = 120;
  const PIVOT_Y = 42;
  const BEAM_HALF = 75;
  const STRING_LEN = 38;
  const TRAY_HALF_W = 38;   // wider tray for multiple emojis
  const EMOJI_SIZE = 26;

  // Beam is perfectly LEVEL (horizontal) — balanced!
  const leftBeamX = PIVOT_X - BEAM_HALF;
  const leftBeamY = PIVOT_Y;
  const rightBeamX = PIVOT_X + BEAM_HALF;
  const rightBeamY = PIVOT_Y;

  // Tray positions
  const leftTrayY = leftBeamY + STRING_LEN;
  const rightTrayY = rightBeamY + STRING_LEN;

  // Compute emoji layout for a side
  function emojiPositions(items: string[], centerX: number, trayY: number) {
    const count = items.length;
    if (count === 0) return [];
    const spacing = Math.min(EMOJI_SIZE * 0.9, (TRAY_HALF_W * 2 - 8) / count);
    const totalWidth = spacing * (count - 1);
    const startX = centerX - totalWidth / 2;
    return items.map((emoji, i) => ({
      emoji,
      x: startX + i * spacing,
      y: trayY - EMOJI_SIZE * 0.5,
    }));
  }

  const leftEmojis = emojiPositions(leftItems, leftBeamX, leftTrayY);
  const rightEmojis = emojiPositions(rightItems, rightBeamX, rightTrayY);

  return (
    <svg
      viewBox="0 0 240 125"
      className="w-full h-full"
      role="img"
      aria-label={`${leftItems.join('')} = ${rightItems.join('')}`}
    >
      {/* ── Base ── */}
      <rect x="82" y="112" width="76" height="7" rx="3.5" fill="#E53935" />
      <ellipse cx="120" cy="112" rx="22" ry="4" fill="#EF5350" />

      {/* ── Pillar ── */}
      <rect x="116" y="44" width="8" height="70" rx="2.5" fill="#FDD835" stroke="#F9A825" strokeWidth="0.6" />

      {/* ── Beam (perfectly horizontal) ── */}
      <line
        x1={leftBeamX}
        y1={leftBeamY}
        x2={rightBeamX}
        y2={rightBeamY}
        stroke="#FDD835"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Beam highlight */}
      <line
        x1={leftBeamX + 5}
        y1={leftBeamY - 1}
        x2={rightBeamX - 5}
        y2={rightBeamY - 1}
        stroke="#FFEE58"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* ── Pivot ball ── */}
      <circle cx={PIVOT_X} cy={PIVOT_Y} r="7" fill="#E53935" stroke="#C62828" strokeWidth="1" />
      <circle cx={PIVOT_X - 1.5} cy={PIVOT_Y - 1.5} r="2" fill="#EF9A9A" opacity="0.5" />

      {/* ── "=" sign on pivot ── */}
      <text
        x={PIVOT_X}
        y={PIVOT_Y + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8"
        fontWeight="bold"
        fill="white"
      >
        =
      </text>

      {/* ── Left end ball ── */}
      <circle cx={leftBeamX} cy={leftBeamY} r="4.5" fill="#E53935" stroke="#C62828" strokeWidth="0.8" />

      {/* ── Right end ball ── */}
      <circle cx={rightBeamX} cy={rightBeamY} r="4.5" fill="#E53935" stroke="#C62828" strokeWidth="0.8" />

      {/* ── Left strings ── */}
      <line x1={leftBeamX} y1={leftBeamY + 4} x2={leftBeamX - TRAY_HALF_W + 4} y2={leftTrayY} stroke="#9E9E9E" strokeWidth="1.2" />
      <line x1={leftBeamX} y1={leftBeamY + 4} x2={leftBeamX + TRAY_HALF_W - 4} y2={leftTrayY} stroke="#9E9E9E" strokeWidth="1.2" />

      {/* ── Left tray ── */}
      <rect
        x={leftBeamX - TRAY_HALF_W}
        y={leftTrayY}
        width={TRAY_HALF_W * 2}
        height="5"
        rx="2.5"
        fill="#BDBDBD"
        stroke="#9E9E9E"
        strokeWidth="0.8"
      />

      {/* ── Left emojis ── */}
      {leftEmojis.map((e, i) => (
        <text
          key={`l-${i}`}
          x={e.x}
          y={e.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={EMOJI_SIZE}
          className="select-none"
          style={{ userSelect: 'none' }}
        >
          {e.emoji}
        </text>
      ))}

      {/* ── Right strings ── */}
      <line x1={rightBeamX} y1={rightBeamY + 4} x2={rightBeamX - TRAY_HALF_W + 4} y2={rightTrayY} stroke="#9E9E9E" strokeWidth="1.2" />
      <line x1={rightBeamX} y1={rightBeamY + 4} x2={rightBeamX + TRAY_HALF_W - 4} y2={rightTrayY} stroke="#9E9E9E" strokeWidth="1.2" />

      {/* ── Right tray ── */}
      <rect
        x={rightBeamX - TRAY_HALF_W}
        y={rightTrayY}
        width={TRAY_HALF_W * 2}
        height="5"
        rx="2.5"
        fill="#BDBDBD"
        stroke="#9E9E9E"
        strokeWidth="0.8"
      />

      {/* ── Right emojis ── */}
      {rightEmojis.map((e, i) => (
        <text
          key={`r-${i}`}
          x={e.x}
          y={e.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={EMOJI_SIZE}
          className="select-none"
          style={{ userSelect: 'none' }}
        >
          {e.emoji}
        </text>
      ))}
    </svg>
  );
}
