import { useState } from 'react';

interface ChoiceQuestionProps {
  question: any;
  index: number;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
}

export default function ChoiceQuestion({ question, index, onAnswer, submitted, result }: ChoiceQuestionProps) {
  const [selected, setSelected] = useState('');
  const content = question.content;

  const handleSelect = (label: string) => {
    if (submitted) return;
    setSelected(label);
    onAnswer(label);
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex items-start gap-2 mb-4">
        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-0.5">{index + 1}.</span>
        <p className="text-base text-gray-900 dark:text-gray-100 leading-relaxed">{content.stem}</p>
      </div>

      <div className="space-y-2 ml-5">
        {content.options?.map((opt: any) => {
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
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${style}`}
            >
              <span className="font-medium mr-2">{opt.label}.</span>
              <span>{opt.text}</span>
              {submitted && isCorrect && <span className="float-right">✅</span>}
              {submitted && isWrong && <span className="float-right">❌</span>}
            </button>
          );
        })}
      </div>

      {submitted && !result?.correct && question.explanation && (
        <div className="mt-3 ml-5 text-sm text-gray-500 dark:text-gray-400">
          💡 {question.explanation}
        </div>
      )}
    </div>
  );
}
