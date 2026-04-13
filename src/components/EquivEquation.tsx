/**
 * EquivEquation — Equation-style display for equivalence puzzles.
 * Shows emojis on left and right side with a big "=" sign in between.
 * Pure CSS/HTML, no SVG needed.
 */

interface EquivEquationProps {
  leftItems: string[];
  rightItems: string[];
}

export default function EquivEquation({ leftItems, rightItems }: EquivEquationProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 w-full h-full px-2">
      {/* Left side */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {leftItems.map((emoji, i) => (
          <span key={`l-${i}`} className="text-2xl select-none">
            {emoji}
          </span>
        ))}
      </div>

      {/* Equals sign */}
      <span className="text-xl font-black text-rose-500 dark:text-rose-400 mx-1 flex-shrink-0">
        =
      </span>

      {/* Right side */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {rightItems.map((emoji, i) => (
          <span key={`r-${i}`} className="text-2xl select-none">
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
