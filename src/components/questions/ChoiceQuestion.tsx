import { useState, useMemo, lazy, Suspense } from 'react';
import { Check, X } from 'lucide-react';
import CodeAwareStem from '../CodeAwareStem';
import InlineCodeText from '../InlineCodeText';

const GeometryFigure = lazy(() => import('./GeometryFigure'));

interface ChoiceQuestionProps {
  question: any;
  index: number;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
  initialAnswer?: string;
}

export default function ChoiceQuestion({ question, onAnswer, submitted, result, initialAnswer }: ChoiceQuestionProps) {
  const [selected, setSelected] = useState(initialAnswer || '');
  const content = question.content;

  // Normalize: support content.options as either [{label, text}] or [string],
  // and content.choices as [string]. Some generated quizzes use string arrays.
  const options = useMemo(() => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const rawOptions = content.options?.length ? content.options : content.choices;
    if (!rawOptions?.length) return [];
    return rawOptions.map((opt: any, i: number) => {
      if (typeof opt === 'string') {
        return { label: labels[i] || String(i + 1), text: opt };
      }
      return {
        label: opt.label || labels[i] || String(i + 1),
        text: opt.text ?? opt.value ?? String(opt),
      };
    });
  }, [content.options, content.choices]);

  const handleSelect = (label: string) => {
    if (submitted) return;
    setSelected(label);
    onAnswer(label);
  };

  // Use 2-column layout if all options are short (≤12 chars)
  const useGrid = useMemo(() => {
    return options.length >= 2 && options.every((opt: any) => opt.text.length <= 12);
  }, [options]);

  return (
    <div>
      <CodeAwareStem text={content.stem} className="mb-4" />

      {content.geometry && (
        <Suspense fallback={<div className="h-[280px] bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />}>
          <GeometryFigure geometry={content.geometry} />
        </Suspense>
      )}

      <div className={useGrid ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
        {options.map((opt: any) => {
          const isSelected = selected === opt.label;
          const isCorrect = result?.correctAnswer === opt.label;
          const isWrong = submitted && isSelected && !result?.correct;

          let style = 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
          if (submitted) {
            if (isCorrect) style = 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            else if (isWrong) style = 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            else style = 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
          } else if (isSelected) {
            style = 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
          }

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={submitted}
              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition text-sm ${style}`}
            >
              <span className="font-medium mr-1.5">{opt.label}.</span>
              <InlineCodeText text={opt.text} />
              {submitted && isCorrect && <Check className="inline w-4 h-4 text-green-500 float-right mt-0.5" />}
              {submitted && isWrong && <X className="inline w-4 h-4 text-red-500 float-right mt-0.5" />}
            </button>
          );
        })}
      </div>

      {submitted && question.explanation && (
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          💡 {question.explanation}
        </div>
      )}
    </div>
  );
}
