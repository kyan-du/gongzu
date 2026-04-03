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

export default function BlankQuestion({ question, index, onAnswer, submitted, result, initialAnswer }: BlankQuestionProps) {
  const [value, setValue] = useState(initialAnswer || '');
  const content = question.content;
  const stem = content.stem || '';
  const hint = content.blanks?.[0]?.hint || '';

  const handleChange = (v: string) => {
    setValue(v);
    onAnswer(v);
  };

  const parts = stem.split(/_____+/);

  // Strip hint text like "(nine)" from the part after each blank, since it's shown as placeholder
  const cleanParts = parts.map((part: string, i: number) => {
    if (i > 0 && hint) {
      const pattern = new RegExp(`^\\s*\\(${escapeRegex(hint)}\\)`);
      return part.replace(pattern, '');
    }
    return part;
  });

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
                    {value || '—'}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    className="inline-block mx-1 w-28 border-b-2 border-blue-400 dark:border-blue-500 bg-transparent text-center text-blue-700 dark:text-blue-300 font-medium focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
                    placeholder={hint || '___'}
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
