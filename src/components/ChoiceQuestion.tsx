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
    <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
      <div className="flex items-start gap-2 mb-4">
        <span className="text-sm font-bold text-gray-400 mt-0.5">{index + 1}.</span>
        <p className="text-base text-gray-900 leading-relaxed">{content.stem}</p>
      </div>

      <div className="space-y-2 ml-5">
        {content.options?.map((opt: any) => {
          const isSelected = selected === opt.label;
          const isCorrect = result?.correctAnswer === opt.label;
          const isWrong = submitted && isSelected && !result?.correct;

          let style = 'border-gray-200 bg-gray-50 text-gray-700';
          if (submitted) {
            if (isCorrect) style = 'border-green-400 bg-green-50 text-green-800';
            else if (isWrong) style = 'border-red-400 bg-red-50 text-red-800';
            else style = 'border-gray-100 bg-gray-50 text-gray-400';
          } else if (isSelected) {
            style = 'border-blue-500 bg-blue-50 text-blue-800';
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
        <div className="mt-3 ml-5 text-sm text-gray-500">
          💡 {question.explanation}
        </div>
      )}
    </div>
  );
}
