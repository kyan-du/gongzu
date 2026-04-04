import { useState, useEffect, useMemo, useCallback } from 'react';

interface WordCardProps {
  word: string;
  phonetic?: string;
  correctMeaning: string;
  options: string[];
  example?: string | null;
  exampleCn?: string | null;
  onResult: (correct: boolean) => void;
  onMaster?: () => void;
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

export default function WordCard({ word, phonetic, correctMeaning, options, example, exampleCn, onResult, onMaster }: WordCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const correctIndex = useMemo(() => options.indexOf(correctMeaning), [options, correctMeaning]);

  useEffect(() => {
    setSelected(null);
  }, [word]);

  // Auto-pronounce on new word
  useEffect(() => {
    speak(word);
  }, [word]);

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx === correctIndex;
    if (!isCorrect) speak(word); // re-pronounce on wrong
    setTimeout(() => onResult(isCorrect), 1200);
  }, [selected, correctIndex, word, onResult]);

  const answered = selected !== null;
  const isWrong = answered && selected !== correctIndex;

  // Use 2-col grid if all options are short (≤8 chars)
  const useGrid = useMemo(() => options.every(o => o.length <= 8), [options]);

  // Render example with bold target word
  const renderExample = (ex: string) => {
    const parts = ex.split(/\*\*(.*?)\*\*/);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="text-violet-600 dark:text-violet-400">{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Word display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">
            {word}
          </h1>
          <button
            onClick={() => speak(word)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-violet-500"
            title="发音"
          >
            🔊
          </button>
        </div>
        {phonetic && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{phonetic}</p>
        )}

        {/* Example sentence — show before answering too for context */}
        {example && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p className="italic">{renderExample(example)}</p>
            {answered && exampleCn && (
              <p className="text-gray-400 dark:text-gray-500 mt-1">{exampleCn}</p>
            )}
          </div>
        )}
      </div>

      {/* Options */}
      <div className={useGrid ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 gap-2.5'}>
        {options.map((opt, idx) => {
          const isCorrectOpt = idx === correctIndex;
          const isSelected = idx === selected;

          let optClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100';
          if (answered) {
            if (isCorrectOpt) {
              optClass = 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300';
            } else if (isSelected && !isCorrectOpt) {
              optClass = 'bg-red-50 dark:bg-red-900/40 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300';
            } else {
              optClass = 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className={`w-full py-3 px-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${optClass} ${
                !answered ? 'hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm active:scale-[0.98]' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  answered && isCorrectOpt
                    ? 'bg-emerald-500 text-white'
                    : answered && isSelected && !isCorrectOpt
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {answered && isCorrectOpt ? '✓' : answered && isSelected && !isCorrectOpt ? '✗' : String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* "斩" button — only show after correct answer */}
      {answered && !isWrong && onMaster && (
        <div className="text-center mt-4">
          <button
            onClick={onMaster}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 transition underline underline-offset-2"
          >
            太简单了，斩掉不再复习
          </button>
        </div>
      )}
    </div>
  );
}
