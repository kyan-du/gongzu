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

type Token = { kind: 'text'; text: string } | { kind: 'blank'; idx: number } | { kind: 'break' };

/**
 * Supports multiple blanks + newlines in stems.
 * Newlines render as actual line breaks.
 * Each ______ (3+) becomes one input.
 */
export default function BlankQuestion({ question, index, onAnswer, submitted, result, initialAnswer }: BlankQuestionProps) {
  const content = question.content;
  const stem: string = content.stem || '';
  const blanksData: Array<{ hint?: string; answer?: string }> = content.blanks || [];

  // Split stem into segments: text and blank markers
  const rawParts = stem.split(/_{3,}/);
  const blankCount = rawParts.length - 1;

  // Parse initial answers
  const initials = (initialAnswer || '').split(/\s+/);
  const [values, setValues] = useState<string[]>(
    Array.from({ length: blankCount }, (_, i) => initials[i] || '')
  );

  // Extract hints
  const hints: string[] = [];
  const cleanParts = rawParts.map((part: string, i: number) => {
    if (i === 0) return part;
    const blankHint = blanksData[i - 1]?.hint || '';
    if (blankHint) {
      const pattern = new RegExp(`^\\s*\\(${escapeRegex(blankHint)}\\)`);
      hints.push(blankHint);
      return part.replace(pattern, '');
    }
    const m = part.match(/^\s*\(([^)]+)\)/);
    if (m) {
      hints.push(m[1]);
      return part.replace(/^\s*\([^)]+\)/, '');
    }
    hints.push('');
    return part;
  });

  // Extract Chinese instruction prefix (e.g. "改写句子（改为感叹句）：") as a separate label
  let instructionLabel = '';
  const firstPart = cleanParts[0];
  const instrMatch = firstPart.match(/^([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef（）]+[：:]\s*)/);
  if (instrMatch) {
    instructionLabel = instrMatch[1].trim();
    cleanParts[0] = firstPart.slice(instrMatch[1].length);
  }

  // Build token stream: text / blank / break
  const tokens: Token[] = [];
  cleanParts.forEach((part, i) => {
    // Split text by newlines, insert break tokens
    const lines = part.split('\n');
    lines.forEach((line, li) => {
      if (li > 0) tokens.push({ kind: 'break' });
      if (line) tokens.push({ kind: 'text', text: line });
    });
    // After each part except the last, insert a blank
    if (i < cleanParts.length - 1) {
      tokens.push({ kind: 'blank', idx: i });
    }
  });

  // Group tokens into lines (split by 'break')
  const lines: Token[][] = [[]];
  for (const tok of tokens) {
    if (tok.kind === 'break') {
      lines.push([]);
    } else {
      lines[lines.length - 1].push(tok);
    }
  }

  const handleChange = (blankIndex: number, v: string) => {
    const next = [...values];
    next[blankIndex] = v;
    setValues(next);
    onAnswer(next.join(' ').trim());
  };

  const renderToken = (tok: Token, key: string) => {
    if (tok.kind === 'text') {
      return <span key={key}>{tok.text}</span>;
    }
    if (tok.kind === 'blank') {
      const bi = tok.idx;
      if (submitted) {
        return (
          <span key={key} className={`inline-block mx-1 px-2 py-0.5 rounded font-medium ${
            result?.correct
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through'
          }`}>
            {values[bi] || '—'}
          </span>
        );
      }
      return (
        <input
          key={key}
          type="text"
          value={values[bi]}
          onChange={(e) => handleChange(bi, e.target.value)}
          className="inline-block mx-1 w-24 border-b-2 border-blue-400 dark:border-blue-500 bg-transparent text-center text-blue-700 dark:text-blue-300 font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400"
          placeholder={hints[bi] || ''}
          autoComplete="off"
          autoCapitalize="off"
        />
      );
    }
    return null;
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 mt-1">{index + 1}.</span>
        <div className="flex-1 text-base leading-relaxed text-gray-900 dark:text-gray-100">
          {instructionLabel && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{instructionLabel}</div>
          )}
          {lines.map((lineTokens, li) => (
            <div key={li} className="flex flex-wrap items-center gap-y-1">
              {lineTokens.map((tok, ti) => renderToken(tok, `${li}-${ti}`))}
            </div>
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
