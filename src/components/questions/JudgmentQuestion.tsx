import { useState } from 'react';
import { Check, X } from 'lucide-react';
import CodeAwareStem from '../CodeAwareStem';

interface JudgmentQuestionProps {
  question: any;
  index: number;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
  initialAnswer?: string;
}

export default function JudgmentQuestion({ question, onAnswer, submitted, result, initialAnswer }: JudgmentQuestionProps) {
  const [selected, setSelected] = useState(initialAnswer || '');
  const content = question.content;

  const handleSelect = (value: string) => {
    if (submitted) return;
    setSelected(value);
    onAnswer(value);
  };

  const correctAnswer = result?.correctAnswer;

  return (
    <div>
      <CodeAwareStem text={content.stem} className="mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: 'true', label: '正确', icon: '✓', color: 'green' },
          { value: 'false', label: '错误', icon: '✗', color: 'red' },
        ].map((opt) => {
          const isSelected = selected === opt.value;
          const isCorrect = submitted && correctAnswer === opt.value;
          const isWrong = submitted && isSelected && correctAnswer !== opt.value;

          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={submitted}
              className={`p-3 rounded-xl border-2 text-left transition font-medium ${
                submitted
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600'
                    : isWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-600'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className={`text-lg font-bold ${
                    opt.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  }`}>{opt.icon}</span>
                  <span className="text-gray-800 dark:text-gray-200">{opt.label}</span>
                </span>
                {submitted && isCorrect && <Check className="w-5 h-5 text-green-500" />}
                {submitted && isWrong && <X className="w-5 h-5 text-red-500" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
