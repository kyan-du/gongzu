import { useState, lazy, Suspense } from 'react';

const GeometryFigure = lazy(() => import('./GeometryFigure'));

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

export default function BlankQuestion({ question, onAnswer, submitted, result, initialAnswer }: BlankQuestionProps) {
  const content = question.content;
  const isCompactCalc = question.tags?.[0] === '口算题' || question.tags?.[0] === '口算50题' || question.tags?.[0] === '答牛TS口算50题';
  const stem: string = content.stem || '';
  const blanksData: Array<{ hint?: string; answer?: string }> = content.blanks || [];

  // Split stem into segments
  // Detect format: stem with ___, □ placeholder, or blanks with before/after.
  // Ryan's mental math questions use "23 + 15 = □"; render □ as an input.
  const hasBlanksInStem = /_{3,}|□/.test(stem);
  const hasBlanksBeforeAfter = blanksData.length > 0 && (blanksData[0] as any).before !== undefined;

  const rawParts = hasBlanksInStem ? stem.split(/_{3,}|□/g) : [stem];
  const blankCount = hasBlanksBeforeAfter ? blanksData.length : rawParts.length - 1;

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

    // Strip Chinese instruction prefix from stem (e.g. "改写句子（改为感叹句）：")
  const firstPart = cleanParts[0];
  const instrMatch = firstPart.match(/^([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef（）]+)[：:]\s*/);
  if (instrMatch) {
    cleanParts[0] = firstPart.slice(instrMatch[0].length);
  }

  // Build token stream
  const tokens: Token[] = [];
  if (hasBlanksBeforeAfter && !hasBlanksInStem) {
    // before/after format: each blank has surrounding text
    blanksData.forEach((b: any, i: number) => {
      if (b.before) tokens.push({ kind: 'text', text: b.before + ' ' });
      tokens.push({ kind: 'blank', idx: i });
      if (b.after) tokens.push({ kind: 'text', text: ' ' + b.after });
      if (i < blanksData.length - 1) tokens.push({ kind: 'break' });
    });
  } else {
    cleanParts.forEach((part, i) => {
      const lines = part.split('\n');
      lines.forEach((line, li) => {
        if (li > 0) tokens.push({ kind: 'break' });
        if (line) tokens.push({ kind: 'text', text: line });
      });
      if (i < cleanParts.length - 1) {
        tokens.push({ kind: 'blank', idx: i });
      }
    });
  }

  // Group into lines
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
      return <span key={key} className={isCompactCalc ? 'whitespace-nowrap' : undefined}>{tok.text}</span>;
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
          inputMode={isCompactCalc ? 'numeric' : 'text'}
          pattern={isCompactCalc ? '[0-9]*' : undefined}
          value={values[bi]}
          onChange={(e) => handleChange(bi, isCompactCalc ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}
          className={`inline-block mx-1 border-b-2 border-blue-400 dark:border-blue-500 bg-transparent text-center text-blue-700 dark:text-blue-300 font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 ${isCompactCalc ? 'w-12 sm:w-14' : 'w-24'}`}
          placeholder={hints[bi] || ''}
          autoComplete="off"
          autoCapitalize="off"
        />
      );
    }
    return null;
  };

  return (
    <div>
      {/* Geometry figure */}
      {content.geometry && (
        <Suspense fallback={<div className="h-[280px] bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />}>
          <GeometryFigure geometry={content.geometry} />
        </Suspense>
      )}

      {/* Stem */}
      <div className={isCompactCalc ? 'text-base leading-tight text-gray-900 dark:text-gray-100' : 'text-base leading-relaxed text-gray-900 dark:text-gray-100'}>
        {lines.map((lineTokens, li) => (
          <div key={li} className={isCompactCalc ? 'flex flex-nowrap items-center whitespace-nowrap' : 'flex flex-wrap items-center gap-y-1'}>
            {lineTokens.map((tok, ti) => renderToken(tok, `${li}-${ti}`))}
          </div>
        ))}
      </div>

      {submitted && (
        <div className="mt-2 text-sm">
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
