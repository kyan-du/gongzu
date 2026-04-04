import { useState } from 'react';
import { Check, X } from 'lucide-react';
import RichPassage from '../RichPassage';

interface ReadingQuestionProps {
  question: any;
  index: number;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
  initialAnswer?: string;
}

export default function ReadingQuestion({ question, onAnswer, submitted, result, initialAnswer }: ReadingQuestionProps) {
  const content = question.content;
  const passage = content.passage || '';
  const title = content.title || '';
  const subQuestions = content.questions || [];
  const answers: string[] = Array.isArray(question.answer) ? question.answer : [];
  const [selected, setSelected] = useState<Record<number, string>>(() => {
    if (!initialAnswer) return {};
    const parts = initialAnswer.split(',');
    const init: Record<number, string> = {};
    parts.forEach((p, i) => { if (p) init[i] = p; });
    return init;
  });
  const [collapsed, setCollapsed] = useState(false);

  const handleSelect = (qIdx: number, label: string) => {
    if (submitted) return;
    const next = { ...selected, [qIdx]: label };
    setSelected(next);
    // Encode all sub-answers as comma-separated string
    const answerStr = subQuestions.map((_: any, i: number) => next[i] || '').join(',');
    onAnswer(answerStr);
  };

  // Parse results - result.correct is overall, we need per-sub-question
  const subResults = result?.correctAnswer
    ? (typeof result.correctAnswer === 'string' ? result.correctAnswer.split(',') : result.correctAnswer)
    : answers;

  return (
    <div className="mb-6">
      {/* Passage card */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">📖 {title || '阅读理解'}</h3>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
          >
            {collapsed ? '展开原文 ▼' : '收起原文 ▲'}
          </button>
        </div>
        {!collapsed && (
          <div className="ml-5 text-gray-700 dark:text-gray-300 border-l-2 border-blue-200 dark:border-blue-700 pl-4">
            <RichPassage passage={passage} />
          </div>
        )}
      </div>

      {/* Sub-questions */}
      {subQuestions.map((sq: any, qIdx: number) => {
        const correctAnswer = subResults[qIdx];
        const isSubCorrect = submitted && selected[qIdx] === correctAnswer;

        return (
          <div key={qIdx} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-2 ml-2">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                {qIdx + 1}.
              </span>
              <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{sq.stem}</p>
            </div>
            <div className={`ml-5 ${sq.options?.length >= 2 && sq.options.every((o: any) => o.text.length <= 12) ? 'grid grid-cols-2 gap-2' : 'space-y-2'}`}>
              {sq.options?.map((opt: any) => {
                const isSelected = selected[qIdx] === opt.label;
                const isCorrectOpt = submitted && correctAnswer === opt.label;
                const isWrong = submitted && isSelected && !isSubCorrect;

                let style = 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                if (submitted) {
                  if (isCorrectOpt) style = 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300';
                  else if (isWrong) style = 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300';
                  else style = 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
                } else if (isSelected) {
                  style = 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
                }

                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(qIdx, opt.label)}
                    disabled={submitted}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition text-sm ${style}`}
                  >
                    <span className="font-medium mr-1.5">{opt.label}.</span>
                    <span>{opt.text}</span>
                    {submitted && isCorrectOpt && <Check className="inline w-4 h-4 text-green-500 float-right mt-0.5" />}
                    {submitted && isWrong && <X className="inline w-4 h-4 text-red-500 float-right mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {submitted && sq.explanation && (
              <div className="mt-2 ml-5 text-sm text-gray-500 dark:text-gray-400">
                💡 {sq.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
