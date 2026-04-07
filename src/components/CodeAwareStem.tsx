import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

/**
 * Renders a question stem with code blocks and inline code properly formatted.
 * Uses prism-react-renderer for syntax highlighting.
 */

interface CodeAwareStemProps {
  text: string;
  className?: string;
}

interface StemPart {
  type: 'text' | 'code';
  content: string;
  lang?: string;
}

function parseStem(raw: string): StemPart[] {
  const parts: StemPart[] = [];

  // Split on fenced code blocks
  const fencedRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fencedRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[2].replace(/\n$/, ''), lang: match[1] || 'cpp' });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    parts.push({ type: 'text', content: raw.slice(lastIndex) });
  }

  // If no fenced blocks found, return as single text part
  if (parts.length === 0) {
    parts.push({ type: 'text', content: raw });
  }

  return parts;
}

/** Normalize fill-in-the-blank brackets in TEXT parts only */
function normalizeBlanksInText(text: string): string {
  return text.replace(/\uff08[\s]{0,4}\uff09/g, '\uff08\u2003\u2003\u2003\uff09');
}

/** Render inline code within a text segment */
function renderInlineCode(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <code key={key++} className="bg-gray-100 dark:bg-gray-700 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-[13px] font-mono">
        {match[1]}
      </code>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  // Map language aliases
  const lang = language === 'cpp' || language === 'c++' ? 'cpp' : language || 'cpp';

  return (
    <Highlight theme={themes.oneLight} code={code} language={lang}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className="rounded-lg p-4 my-3 overflow-x-auto text-[13px] leading-[1.6] font-mono whitespace-pre border border-gray-200 dark:border-gray-700"
          style={{ ...style, backgroundColor: undefined }}
        >
          <div className="bg-gray-50 dark:bg-gray-800" style={{ backgroundColor: style.backgroundColor }}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token, key });
                    // Highlight fill-in-the-blank underscores
                    if (/^_{3,}$/.test(token.content)) {
                      return (
                        <span
                          key={key}
                          {...tokenProps}
                          className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-1 rounded"
                        >
                          {token.content}
                        </span>
                      );
                    }
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </div>
        </pre>
      )}
    </Highlight>
  );
}

export default function CodeAwareStem({ text, className }: CodeAwareStemProps) {
  const parts = useMemo(() => parseStem(text), [text]);

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return <CodeBlock key={i} code={part.content} language={part.lang || 'cpp'} />;
        }
        // Text: normalize blanks, handle line breaks and inline code
        const processed = normalizeBlanksInText(part.content.trim());
        if (!processed) return null;

        const paragraphs = processed.split(/\n{2,}/);
        return paragraphs.map((para, j) => {
          const lines = para.split('\n');
          return (
            <p key={`${i}-${j}`} className="text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-2">
              {lines.map((line, k) => (
                <span key={k}>
                  {k > 0 && <br />}
                  {renderInlineCode(line)}
                </span>
              ))}
            </p>
          );
        });
      })}
    </div>
  );
}
