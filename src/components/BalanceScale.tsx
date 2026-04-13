interface BalanceScaleProps {
  leftItem: string;
  rightItem: string;
  heavier: 'left' | 'right';
}

export default function BalanceScale({ leftItem, rightItem, heavier }: BalanceScaleProps) {
  // ── Geometry ──
  const PIVOT_X = 120;
  const PIVOT_Y = 42;
  const BEAM_HALF = 75;       // shorter beam → smaller scale
  const STRING_LEN = 38;      // string length (equal both sides)
  const TRAY_HALF_W = 26;     // wider tray
  const TILT_DEG = 12;
  const TILT_RAD = (TILT_DEG * Math.PI) / 180;

  const sign = heavier === 'left' ? 1 : -1;

  // Beam endpoints
  const leftBeamX = PIVOT_X - BEAM_HALF * Math.cos(TILT_RAD);
  const leftBeamY = PIVOT_Y + sign * BEAM_HALF * Math.sin(TILT_RAD);
  const rightBeamX = PIVOT_X + BEAM_HALF * Math.cos(TILT_RAD);
  const rightBeamY = PIVOT_Y - sign * BEAM_HALF * Math.sin(TILT_RAD);

  // Tray Y = beam end + string length (equal!)
  const leftTrayY = leftBeamY + STRING_LEN;
  const rightTrayY = rightBeamY + STRING_LEN;

  const EMOJI_SIZE = 34; // bigger emoji

  return (
    <svg
      viewBox="0 0 240 145"
      className="w-full h-full"
      role="img"
      aria-label={`${leftItem} vs ${rightItem}, ${heavier === 'left' ? leftItem : rightItem} 更重`}
    >
      {/* ── Base ── */}
      <rect x="82" y="130" width="76" height="8" rx="4" fill="#E53935" />
      <ellipse cx="120" cy="130" rx="26" ry="5" fill="#EF5350" />

      {/* ── Pillar (shorter) ── */}
      <rect x="116" y="44" width="8" height="88" rx="2.5" fill="#FDD835" stroke="#F9A825" strokeWidth="0.6" />

      {/* ── Beam ── */}
      <path
        d={`M ${leftBeamX} ${leftBeamY} Q ${PIVOT_X} ${PIVOT_Y - 10} ${rightBeamX} ${rightBeamY}`}
        fill="none"
        stroke="#FDD835"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d={`M ${leftBeamX + 3} ${leftBeamY - 1} Q ${PIVOT_X} ${PIVOT_Y - 12} ${rightBeamX - 3} ${rightBeamY - 1}`}
        fill="none"
        stroke="#FFEE58"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* ── Pivot ball ── */}
      <circle cx={PIVOT_X} cy={PIVOT_Y} r="7" fill="#E53935" stroke="#C62828" strokeWidth="1" />
      <circle cx={PIVOT_X - 1.5} cy={PIVOT_Y - 1.5} r="2" fill="#EF9A9A" opacity="0.5" />

      {/* ── Left end ball ── */}
      <circle cx={leftBeamX} cy={leftBeamY} r="4.5" fill="#E53935" stroke="#C62828" strokeWidth="0.8" />

      {/* ── Right end ball ── */}
      <circle cx={rightBeamX} cy={rightBeamY} r="4.5" fill="#E53935" stroke="#C62828" strokeWidth="0.8" />

      {/* ── Left strings ── */}
      <line x1={leftBeamX} y1={leftBeamY + 4} x2={leftBeamX - TRAY_HALF_W + 2} y2={leftTrayY} stroke="#9E9E9E" strokeWidth="1.2" />
      <line x1={leftBeamX} y1={leftBeamY + 4} x2={leftBeamX + TRAY_HALF_W - 2} y2={leftTrayY} stroke="#9E9E9E" strokeWidth="1.2" />

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

      {/* ── Left emoji: bottom edge touching tray ── */}
      <text
        x={leftBeamX}
        y={leftTrayY - EMOJI_SIZE * 0.32}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={EMOJI_SIZE}
        className="select-none"
        style={{ userSelect: 'none' }}
      >
        {leftItem}
      </text>

      {/* ── Right strings ── */}
      <line x1={rightBeamX} y1={rightBeamY + 4} x2={rightBeamX - TRAY_HALF_W + 2} y2={rightTrayY} stroke="#9E9E9E" strokeWidth="1.2" />
      <line x1={rightBeamX} y1={rightBeamY + 4} x2={rightBeamX + TRAY_HALF_W - 2} y2={rightTrayY} stroke="#9E9E9E" strokeWidth="1.2" />

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

      {/* ── Right emoji: bottom edge touching tray ── */}
      <text
        x={rightBeamX}
        y={rightTrayY - EMOJI_SIZE * 0.32}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={EMOJI_SIZE}
        className="select-none"
        style={{ userSelect: 'none' }}
      >
        {rightItem}
      </text>
    </svg>
  );
}
