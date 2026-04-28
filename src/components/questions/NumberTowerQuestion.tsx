import { useState } from 'react';

interface NumberTowerQuestionProps {
  question: any;
  onAnswer: (answer: string) => void;
  submitted?: boolean;
  result?: any;
  initialAnswer?: string;
}

function parseAccepts(question: any): string[] {
  const blanks = question.content?.blanks || [];
  if (blanks.length > 1) return blanks.map((b: any) => String(b.accepts?.[0] ?? b.answer ?? ''));
  const answer = question.answer;
  if (typeof answer === 'string') return answer.trim().split(/\s+/);
  if (answer?.blanks?.length) return answer.blanks.flatMap((b: any) => String(b.accepts?.[0] ?? '').trim().split(/\s+/)).filter(Boolean);
  return String(blanks[0]?.accepts?.[0] ?? '').trim().split(/\s+/).filter(Boolean);
}

function inferTower(question: any) {
  const stem = question.content?.stem || '';
  const bottomMatch = Array.from(stem.matchAll(/底层[：是\s]*([0-9、，,\s]+)/g)).at(-1) as RegExpMatchArray | undefined;
  const nums = bottomMatch?.[1]?.split(/[、，,\s]+/).filter(Boolean).map(Number) || [];
  const answers = parseAccepts(question);

  if (nums.length === 4 && answers.length >= 4) {
    return {
      instruction: '上面的数 = 下面相邻两个数相加',
      rows: [[null], [null, null], [String(nums[0] + nums[1]), null, String(nums[2] + nums[3])], nums.map(String)],
      blankRows: [[0], [1, 2], [3]],
      answers,
    };
  }

  if (nums.length === 3 && answers.length >= 3) {
    return {
      instruction: '上面的数 = 下面相邻两个数相加',
      rows: [[null], [null, null], nums.map(String)],
      blankRows: [[0], [1, 2]],
      answers,
    };
  }

  return null;
}

export default function NumberTowerQuestion({ question, onAnswer, submitted, result, initialAnswer }: NumberTowerQuestionProps) {
  const tower = question.content?.tower || inferTower(question);
  const flatAnswers = tower?.answers || parseAccepts(question);
  const initials = (initialAnswer || '').split(/\s+/);
  const [values, setValues] = useState<string[]>(flatAnswers.map((_: string, i: number) => initials[i] || ''));

  if (!tower) return null;

  const blankIndexByCell = new Map<string, number>();
  let n = 0;
  tower.blankRows.forEach((cols: number[], rowIndex: number) => cols.forEach((col) => blankIndexByCell.set(`${rowIndex}-${col}`, n++)));

  const handleChange = (idx: number, value: string) => {
    const next = [...values];
    next[idx] = value.replace(/[^0-9]/g, '');
    setValues(next);
    onAnswer(next.join(' ').trim());
  };

  const renderSubmittedBlank = (idx: number) => {
    const userValue = values[idx] || '—';
    const correctValue = flatAnswers[idx] || '';
    const isWholeQuestionCorrect = !!result?.correct;
    const isCellCorrect = userValue !== '—' && String(userValue) === String(correctValue);

    if (isWholeQuestionCorrect || isCellCorrect) {
      return (
        <div className="w-14 h-10 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center justify-center font-semibold">
          {userValue}
        </div>
      );
    }

    return (
      <div className="w-14 h-12 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-900/25 dark:text-amber-200 flex flex-col items-center justify-center leading-tight">
        <span className="text-xs line-through decoration-red-500 decoration-2">{userValue}</span>
        <span className="text-sm font-semibold">{correctValue}</span>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700 dark:text-gray-300">{tower.instruction}</p>
      <div className="flex flex-col items-center gap-2 py-2">
        {tower.rows.map((row: Array<string | null>, ri: number) => (
          <div key={ri} className="flex justify-center gap-2">
            {row.map((cell, ci) => {
              const bi = blankIndexByCell.get(`${ri}-${ci}`);
              if (bi !== undefined) {
                if (submitted) {
                  return <div key={ci}>{renderSubmittedBlank(bi)}</div>;
                }
                return <input key={ci} inputMode="numeric" pattern="[0-9]*" value={values[bi]} onChange={(e) => handleChange(bi, e.target.value)} className="w-14 h-10 rounded-lg border-2 border-blue-300 dark:border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-center font-semibold text-blue-700 dark:text-blue-300 focus:outline-none focus:border-blue-500" />;
              }
              return <div key={ci} className="w-14 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-semibold text-gray-800 dark:text-gray-100">{cell}</div>;
            })}
          </div>
        ))}
      </div>
      {submitted && !result?.correct && (
        <div className="text-sm text-green-700 dark:text-green-300 font-medium">
          ✅ 正确答案：{flatAnswers.map((answer: string, i: number) => `第${i + 1}空 ${answer}`).join('，')}
        </div>
      )}
      {submitted && question.explanation && <p className="text-sm text-gray-500 dark:text-gray-400">💡 {question.explanation}</p>}
    </div>
  );
}
