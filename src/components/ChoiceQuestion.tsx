import type { Question } from '../lib/api';

interface Props {
  question: Question;
  index: number;
  value: string | null;
  onChange: (answer: string) => void;
}

export default function ChoiceQuestion({ question, index, value, onChange }: Props) {
  const content = question.content;
  const options = content.options || [];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <span className="text-sm text-gray-500">第 {index + 1} 题</span>
        <p className="text-gray-900 mt-2 whitespace-pre-wrap">{content.stem}</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onChange(option.label)}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${
              value === option.label
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  value === option.label
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {value === option.label && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div>
                <span className="font-medium text-gray-700">{option.label}.</span>{' '}
                <span className="text-gray-700">{option.text}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
