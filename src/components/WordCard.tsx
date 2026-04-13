import { useState, useMemo, useCallback } from 'react';

type CardMode = 'en2cn' | 'cn2en' | 'spell';

interface WordCardProps {
  word: string;
  phonetic?: string;
  correctMeaning: string;
  options: string[];           // cn meanings for en2cn; en words for cn2en
  example?: string;
  mode?: CardMode;
  confuserWords?: string[];    // similar english words for cn2en mode
  onResult: (correct: boolean) => void;
  onMaster?: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function speak(word: string) {
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  speechSynthesis.speak(u);
}

// Generate spelling blanks — remove 2-3 "tricky" letters from middle
// Returns segments: array of { type: 'text', value } or { type: 'blank', index, answer }
function makeSpellBlanks(word: string) {
  const chars = word.split('');
  if (chars.length <= 3) {
    // For very short words, blank the middle letter(s) if possible, else no blanks
    if (chars.length === 3 && /[a-z]/i.test(chars[1])) {
      return {
        blankedIndices: [1],
        segments: [
          { type: 'text' as const, value: chars[0] },
          { type: 'blank' as const, index: 0, answer: chars[1] },
          { type: 'text' as const, value: chars[2] },
        ],
      };
    }
    return { blankedIndices: [] as number[], segments: [{ type: 'text' as const, value: word }] };
  }
  
  const candidates = [];
  for (let i = 1; i < chars.length - 1; i++) {
    if (/[a-z]/i.test(chars[i])) candidates.push(i);
  }
  
  const numBlanks = Math.min(candidates.length, chars.length <= 5 ? 1 : chars.length <= 8 ? 2 : 3);
  const shuffled = shuffle(candidates);
  const blanked = shuffled.slice(0, numBlanks).sort((a, b) => a - b);
  
  // Build segments
  const segments: Array<{ type: 'text'; value: string } | { type: 'blank'; index: number; answer: string }> = [];
  let textBuf = '';
  for (let i = 0; i < chars.length; i++) {
    if (blanked.includes(i)) {
      if (textBuf) { segments.push({ type: 'text', value: textBuf }); textBuf = ''; }
      segments.push({ type: 'blank', index: blanked.indexOf(i), answer: chars[i] });
    } else {
      textBuf += chars[i];
    }
  }
  if (textBuf) segments.push({ type: 'text', value: textBuf });
  
  return { blankedIndices: blanked, segments };
}

export default function WordCard({
  word, phonetic, correctMeaning, options, example, mode = 'en2cn',
  confuserWords, onResult, onMaster
}: WordCardProps) {
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [blankInputs, setBlankInputs] = useState<string[]>([]);

  // Spell blanks — must be before isWrong
  const spellData = useMemo(() => {
    const data = makeSpellBlanks(word);
    setBlankInputs(new Array(data.blankedIndices.length).fill(''));
    return data;
  }, [word]);

  const isWrong = useMemo(() => {
    if (!answered) return false;
    if (mode === 'spell') {
      return spellData.segments.some(s => 
        s.type === 'blank' && (blankInputs[s.index] || '').toLowerCase() !== s.answer.toLowerCase()
      );
    }
    if (mode === 'cn2en') return selected !== word;
    return selected !== correctMeaning;
  }, [answered, selected, correctMeaning, word, mode, blankInputs, spellData]);

  const useGrid = useMemo(() => {
    const items = mode === 'cn2en' ? (confuserWords || []) : options;
    return items.every(o => o.length <= 15);
  }, [options, confuserWords, mode]);

  // Shuffled confuser options for cn2en
  const cn2enOptions = useMemo(() => {
    if (mode !== 'cn2en') return [];
    const all = [word, ...(confuserWords || []).slice(0, 3)];
    return shuffle([...new Set(all)]);
  }, [word, confuserWords, mode]);

  const handleSelect = useCallback((opt: string) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const correct = mode === 'cn2en' ? opt === word : opt === correctMeaning;
    onResult(correct);
  }, [answered, correctMeaning, word, mode, onResult]);

  const handleSpellSubmit = useCallback(() => {
    if (answered) return;
    setAnswered(true);
    const correct = spellData.segments.every(s => 
      s.type === 'text' || (blankInputs[s.index] || '').toLowerCase() === s.answer.toLowerCase()
    );
    onResult(correct);
  }, [answered, blankInputs, spellData, onResult]);

  const currentOptions = mode === 'cn2en' ? cn2enOptions : options;
  const correctAnswer = mode === 'cn2en' ? word : correctMeaning;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header area */}
      <div className="text-center mb-6">
        {mode === 'cn2en' ? (
          // Chinese → English: show Chinese meaning as prompt
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {correctMeaning}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">选出正确的英文单词</p>
          </>
        ) : mode === 'spell' ? (
          // Spell mode: show word with blanks
          <>
            <div className="flex items-baseline justify-center gap-0 mb-2 flex-wrap">
              {spellData.segments.map((seg, i) =>
                seg.type === 'text' ? (
                  <span key={i} className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-wide">{seg.value}</span>
                ) : (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={blankInputs[seg.index] || ''}
                    onChange={e => {
                      const val = e.target.value.slice(-1);
                      setBlankInputs(prev => {
                        const next = [...prev];
                        next[seg.index] = val;
                        return next;
                      });
                      // Auto-focus next blank
                      if (val) {
                        const inputs = document.querySelectorAll<HTMLInputElement>('.spell-blank');
                        const nextIdx = Array.from(inputs).findIndex(el => el === e.target) + 1;
                        if (nextIdx < inputs.length) inputs[nextIdx].focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSpellSubmit();
                      if (e.key === 'Backspace' && !blankInputs[seg.index]) {
                        const inputs = document.querySelectorAll<HTMLInputElement>('.spell-blank');
                        const prevIdx = Array.from(inputs).findIndex(el => el === e.target) - 1;
                        if (prevIdx >= 0) inputs[prevIdx].focus();
                      }
                    }}
                    disabled={answered}
                    autoFocus={seg.index === 0}
                    className={`spell-blank w-8 h-10 mx-0.5 text-center text-3xl font-bold border-b-3 bg-transparent focus:outline-none transition ${
                      answered
                        ? (blankInputs[seg.index] || '').toLowerCase() === seg.answer.toLowerCase()
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-red-500 text-red-600 dark:text-red-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-violet-500'
                    }`}
                  />
                )
              )}
            </div>
            {phonetic && (
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-base text-gray-400 dark:text-gray-500">{phonetic}</span>
                <button onClick={() => speak(word)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-violet-500" title="发音">
                  🔊
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{correctMeaning}</p>
            {answered && isWrong && (
              <p className="text-sm font-medium text-red-500 mt-2">
                正确答案：<span className="text-emerald-600 dark:text-emerald-400 font-bold">{word}</span>
              </p>
            )}
          </>
        ) : (
          // English → Chinese (default)
          <>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-wide mb-1">
              {word}
            </h1>
            {phonetic && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <span className="text-base text-gray-400 dark:text-gray-500">{phonetic}</span>
                <button onClick={() => speak(word)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-violet-500" title="发音">
                  🔊
                </button>
              </div>
            )}
            {!phonetic && (
              <div className="flex items-center justify-center mb-3">
                <button onClick={() => speak(word)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-violet-500" title="发音">
                  🔊
                </button>
              </div>
            )}
          </>
        )}

        {/* Example sentence */}
        {example && mode !== 'spell' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            {mode === 'en2cn' && word
              ? example.split(new RegExp(`(${word})`, 'i')).map((part, i) =>
                  part.toLowerCase() === word.toLowerCase()
                    ? <strong key={i} className="text-violet-600 dark:text-violet-400 not-italic">{part}</strong>
                    : <span key={i}>{part}</span>
                )
              : example
            }
          </p>
        )}
      </div>

      {/* Answer area */}
      {mode === 'spell' ? (
        // Spell mode: submit button for blanks
        !answered ? (
          <div className="text-center mt-4">
            <button
              onClick={handleSpellSubmit}
              disabled={blankInputs.some(v => !v)}
              className="px-8 py-3 rounded-full bg-violet-600 dark:bg-violet-500 text-white font-semibold text-base hover:bg-violet-700 dark:hover:bg-violet-600 transition shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              确认
            </button>
          </div>
        ) : null
      ) : (
        // Choice options (en2cn or cn2en)
        <div className={useGrid ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5'}>
          {currentOptions.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isCorrect = opt === correctAnswer;
            const isSelected = opt === selected;

            let bg = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600';
            let letterBg = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';

            if (answered) {
              if (isCorrect) {
                bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
                letterBg = 'bg-emerald-500 text-white';
              } else if (isSelected && !isCorrect) {
                bg = 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700';
                letterBg = 'bg-red-500 text-white';
              } else {
                bg = 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50';
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={answered}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${bg}`}
              >
                <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors ${letterBg}`}>
                  {letter}
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* "斩" button */}
      {answered && !isWrong && onMaster && (
        <div className="text-center mt-5">
          <button
            onClick={onMaster}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            ⚔️ 太简单，斩
          </button>
        </div>
      )}
    </div>
  );
}
