import { useState, useRef, useEffect } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

// Parse markup: {r:字|pīnyīn} {t:词|注释} {w:词|注释}
function normalizeRubyHtml(text: string) {
  // Some generated passages were stored as literal HTML-like ruby markup:
  // <ruby>中<rt>zhōng</rt></ruby>. Convert it to our safe internal syntax.
  return text.replace(/<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/g, (_m, body, pinyin) => `{r:${body}|${pinyin}}`);
}

function parsePassage(text: string) {
  const normalizedText = normalizeRubyHtml(text);
  const regex = /\{(r|t|w):([^|]+)\|([^}]+)\}/g;
  const parts: Array<{ type: 'text' | 'ruby' | 'tooltip' | 'word'; text: string; annotation?: string }> = [];
  let lastIndex = 0;

  let match;
  while ((match = regex.exec(normalizedText)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: normalizedText.slice(lastIndex, match.index) });
    }

    const tag = match[1];
    const content = match[2];
    const annotation = match[3];

    if (tag === 'r') {
      parts.push({ type: 'ruby', text: content, annotation });
    } else if (tag === 't') {
      parts.push({ type: 'tooltip', text: content, annotation });
    } else if (tag === 'w') {
      parts.push({ type: 'word', text: content, annotation });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < normalizedText.length) {
    parts.push({ type: 'text', text: normalizedText.slice(lastIndex) });
  }

  return parts;
}

function renderPlainText(text: string, keyPrefix: string) {
  // Render passage body text in the normal foreground color.
  // Annotations (ruby/tooltip/word) keep their own styling below.
  return Array.from(text).map((ch, idx) => <span key={`${keyPrefix}-${idx}`}>{ch}</span>);
}

export default function RichPassage({ passage }: { passage: string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    if (tooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tooltip]);

  const handleAnnotationClick = (e: React.MouseEvent, annotation: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setTooltip({
      text: annotation,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.bottom - containerRect.top + 4,
    });
  };

  const paragraphs = passage.split('\n').filter(p => p.trim());

  return (
    <div ref={containerRef} className="relative leading-[2.5] text-[19px] sm:text-[20px] tracking-wide">
      {paragraphs.map((para, pIdx) => {
        const parts = parsePassage(para);
        return (
          <p key={pIdx} className={pIdx > 0 ? 'mt-3' : ''}>
            {parts.map((part, i) => {
              if (part.type === 'text') {
                return <span key={i}>{renderPlainText(part.text, `${pIdx}-${i}`)}</span>;
              }

              if (part.type === 'ruby') {
                return (
                  <ruby key={i} className="ruby-annotation">
                    {part.text}
                    <rp>(</rp>
                    <rt className="text-[12px] sm:text-[13px] font-normal text-blue-500 dark:text-blue-400 tracking-normal">{part.annotation}</rt>
                    <rp>)</rp>
                  </ruby>
                );
              }

              if (part.type === 'tooltip') {
                return (
                  <span
                    key={i}
                    onClick={(e) => handleAnnotationClick(e, part.annotation!)}
                    className="decoration-dotted underline underline-offset-4 decoration-gray-400 dark:decoration-gray-500 cursor-pointer hover:decoration-blue-400 dark:hover:decoration-blue-500 transition-colors"
                  >
                    {part.text}
                  </span>
                );
              }

              if (part.type === 'word') {
                return (
                  <span
                    key={i}
                    onClick={(e) => handleAnnotationClick(e, part.annotation!)}
                    className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-0.5 rounded cursor-pointer border-b border-dashed border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    {part.text}
                  </span>
                );
              }

              return null;
            })}
          </p>
        );
      })}

      {/* Tooltip popup */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 max-w-64 px-3 py-2 text-sm leading-relaxed bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-lg"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 dark:bg-gray-700 rotate-45" />
          <span className="relative z-10">{tooltip.text}</span>
        </div>
      )}
    </div>
  );
}
