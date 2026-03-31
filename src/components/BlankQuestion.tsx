import { useState } from 'react';

interface BlankQuestionProps {
  question: any;
  index: number;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
}

export default function BlankQuestion({ question, index, onAnswer, submitted, result }: BlankQuestionProps) {
  const [value, setValue] = useState('');
  const content = question.content;
  const stem = content.stem || '';
  const hint = content.blanks?.[0]?.hint || '';

  const handleChange = (v: string) => {
    setValue(v);
    onAnswer(v);
  };

  // Split stem by _____ to insert inline input
  const parts = stem.split(/_____+/);

  return (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-sm font-bold text-gray-400 mt-1">{index + 1}.</span>
        <div className="flex-1 text-base leading-relaxed flex flex-wrap items-center gap-y-1">
          {parts.map((part: string, i: number) => (
            <span key={i} className="inline-flex items-center flex-wrap">
              <span>{part}</span>
              {i < parts.length - 1 && (
                submitted ? (
                  <span className={`inline-block mx-1 px-2 py-0.5 rounded font-medium ${
                    result?.correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700 line-through'
                  }`}>
                    {value || '—'}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    className="inline-block mx-1 w-28 border-b-2 border-blue-400 bg-transparent text-center text-blue-700 font-medium focus:outline-none focus:border-blue-600"
                    placeholder={hint ? `(${hint})` : '___'}
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                )
              )}
            </span>
          ))}
        </div>
      </div>

      {submitted && !result?.correct && (
        <div className="mt-2 ml-6 text-sm">
          <span className="text-green-700 font-medium">✅ {result?.correctAnswer}</span>
          {question.explanation && (
            <p className="text-gray-500 mt-1">💡 {question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
