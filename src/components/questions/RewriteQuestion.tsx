import { useState } from 'react';

interface RewriteQuestionProps {
  index: number;
  question: {
    id: string;
    type: string;
    content: {
      stem: string;
      original?: string;
      instruction?: string;
    };
    answer?: string;
    explanation?: string;
  };
  value: string;
  onChange: (value: string) => void;
  submitted: boolean;
  result?: {
    correct: boolean;
    feedback?: string;
    correctAnswer?: string;
    score?: number;
  };
}

export default function RewriteQuestion({ question, value, onChange, submitted, result }: RewriteQuestionProps) {
  const { original } = question.content;
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-3">
      {/* Original sentence */}
      {original && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{original}</p>
        </div>
      )}

      {/* Input area */}
      {!submitted ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="输入你的答案..."
          rows={3}
          className={`w-full px-3 py-2 rounded-lg border text-sm resize-none transition-colors
            ${focused
              ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30'
              : 'border-gray-200 dark:border-gray-600'}
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500`}
        />
      ) : (
        <div className="space-y-2">
          {/* Student answer */}
          <div className={`px-3 py-2 rounded-lg border text-sm ${
            result?.correct
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{result?.correct ? '✅' : '❌'}</span>
              <span className={`${result?.correct ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {value || '(未作答)'}
              </span>
            </div>
          </div>

          {/* AI Feedback */}
          {result && !result.correct && (
            <>
              {result.feedback && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  💡 {result.feedback}
                </div>
              )}
              {result.correctAnswer && (
                <div className="text-sm text-green-700 dark:text-green-300">
                  ✏️ 参考答案：{result.correctAnswer}
                </div>
              )}
            </>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 mt-1">
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
