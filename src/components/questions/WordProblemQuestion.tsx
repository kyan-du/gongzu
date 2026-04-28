import { useState } from 'react';

interface WordProblemQuestionProps {
  question: any;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
  initialAnswer?: string;
}

export default function WordProblemQuestion({ question, onAnswer, submitted, result, initialAnswer }: WordProblemQuestionProps) {
  const stem = String(question.content?.stem || '')
    .replace(/\n算式：_{3,}\n答案：_{3,}/, '')
    .trim();
  const initials = (initialAnswer || '').split('\n');
  const [formula, setFormula] = useState(initials[0] || '');
  const [answer, setAnswer] = useState(initials[1] || '');

  const update = (nextFormula: string, nextAnswer: string) => {
    setFormula(nextFormula);
    setAnswer(nextAnswer);
    onAnswer(`${nextFormula}\n${nextAnswer}`.trim());
  };

  const inputClass = 'w-full rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-2 text-base text-blue-800 dark:text-blue-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className="space-y-3">
      <div className="text-base leading-relaxed text-gray-900 dark:text-gray-100 font-medium">{stem}</div>

      <div className="grid grid-cols-[3.25rem_1fr] gap-x-2 gap-y-2 items-center">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">算式</label>
        {submitted ? (
          <div className="min-h-10 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{formula || '—'}</div>
        ) : (
          <input
            type="text"
            value={formula}
            onChange={(e) => update(e.target.value, answer)}
            className={inputClass}
            placeholder="如：36 + 28 - 19 = 45"
            autoComplete="off"
          />
        )}

        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">答案</label>
        {submitted ? (
          <div className={`min-h-10 rounded-lg px-3 py-2 font-semibold ${result?.correct ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{answer || '—'}</div>
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={answer}
            onChange={(e) => update(formula, e.target.value.replace(/[^0-9]/g, ''))}
            className={`${inputClass} max-w-40`}
            placeholder="只写数字"
            autoComplete="off"
          />
        )}
      </div>

      {submitted && !result?.correct && (
        <div className="text-sm text-green-700 dark:text-green-300 font-medium whitespace-pre-line">✅ {result?.correctAnswer}</div>
      )}
      {submitted && question.explanation && (
        <p className="text-sm text-gray-500 dark:text-gray-400">💡 {question.explanation}</p>
      )}
    </div>
  );
}
