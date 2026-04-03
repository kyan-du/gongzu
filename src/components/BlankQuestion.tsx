import { useState } from 'react';

interface BlankQuestionProps {
  question: any;
  index: number;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
  initialAnswer?: string;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Supports multiple blanks in a single stem.
 * Each ______ (3+ underscores) becomes one input.
 * Answers are joined with " " (space) for single-answer grading.
 *
 * Hint text "(word)" right after a blank is extracted and shown as placeholder.
 */
export default function BlankQuestion({ question, index, onAnswer, submitted, result, initialAnswer }: BlankQuestionProps) {
  const content = question.content;
  const stem: string = content.stem || '';
  const blanksData: Array<{ hint?: string; answer?: string }> = content.blanks || [];

  // Split by 3+ underscores
  const parts = stem.split(/_{3,}/);
  const blankCount = parts.length - 1;

  // Parse initial answers (space-separated)
  const initials = (initialAnswer || '').split(/\s+/);
  const [values, setValues] = useState<string[]>(
    Array.from({ length: blankCount }, (_, i) => initials[i] || '')
  );

  // Extract hints: either from blanks array, or from "(word)" pattern after each blank
  const hints: string[] = [];
  const cleanParts = parts.map((part: string, i: number) => {
    if (i === 0) return part;
    // Try blanks[i-1].hint first
    const blankHint = blanksData[i - 1]?.hint || '';
    if (blankHint) {
      // Strip "(hint)" from beginning of part
      const pattern = new RegExp(`^\\s*\\(${escapeRegex(blankHint)}\\)`);
      hints.push(blankHint);
      return part.replace(pattern, '');
    }
    // Try extracting "(word)" from the part itself
    const m = part.match(/^\s*\(([^)]+)\)/);
    if (m) {
      hints.push(m[1]);
      return part.replace(/^\s*\([^)]+\)/, '');
    }
    hints.push('');
    return part;
  });

  const handleChange = (blankIndex: number, v: string) => {
    const next = [...values];
    next[blankIndex] = v;
    setValues(next);
    onAnswer(next.join(' ').trim());
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">{index + 1}.</span>
        <div className="flex-1 text-base leading-relaxed flex flex-wrap items-center gap-y-1 text-gray-900 dark:text-gray-100">
          {cleanParts.map((part: string, i: number) => (
            <span key={i} className="inline-flex items-center flex-wrap">
              <span>{part}</span>
              {i < cleanParts.length - 1 && (
                submitted ? (
                  <span className={`inline-block mx-1 px-2 py-0.5 rounded font-medium ${
                    result?.correct
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through'
                  }`}>
                    {values[i] || '—'}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={values[i]}
                    onChange={(e) => handleChange(i, e.target.value)}
                    className="inline-block mx-1 w-24 border-b-2 border-blue-400 dark:border-blue-500 bg-transparent text-center text-blue-700 dark:text-blue-300 font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
                    placeholder={hints[i] || ''}
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                )
              )}
            </span>
          ))}
        </div>
      </div>

      {submitted && (
        <div className="mt-2 ml-6 text-sm">
          {!result?.correct && (
            <span className="text-green-700 dark:text-green-300 font-medium">✅ {result?.correctAnswer}</span>
          )}
          {question.explanation && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">💡 {question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
