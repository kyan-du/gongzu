import type { Question } from '../lib/api';

interface Props {
  question: Question;
  index: number;
  value: string[] | null;
  onChange: (answers: string[]) => void;
}

export default function BlankQuestion({ question, index, value, onChange }: Props) {
  const content = question.content;
  const blanks = content.blanks || [];
  const answers = value || blanks.map(() => '');

  const handleChange = (blankIndex: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[blankIndex] = text;
    onChange(newAnswers);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <span className="text-sm text-gray-500">第 {index + 1} 题</span>
        <p className="text-gray-900 mt-2 whitespace-pre-wrap">{content.stem}</p>
      </div>

      <div className="space-y-4">
        {blanks.map((blank, idx) => (
          <div key={idx}>
            {blank.hint && (
              <div className="text-sm text-gray-500 mb-2">
                提示: ({blank.hint})
              </div>
            )}
            <input
              type="text"
              value={answers[idx] || ''}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={`填空 ${idx + 1}`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
