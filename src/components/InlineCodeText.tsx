import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

/**
 * Renders text that may contain inline code snippets mixed with natural language.
 * Auto-detects code fragments and applies Prism syntax highlighting.
 */

interface InlineCodeTextProps {
  text: string;
  className?: string;
}

/** Check if a string segment looks like code */
function isCodeFragment(s: string): boolean {
  return /->|::|<<|>>|\(\)|\[\]|\{\}|[a-zA-Z_]\w*\s*\(|NULL|nullptr|==|!=|&&|\|\||[+\-]=|dp\[|\bcost\[|\broot\b->/.test(s);
}

/** Check if entire text is pure code (no CJK) */
function isPureCode(s: string): boolean {
  return !/[\u4e00-\u9fff\u3000-\u303f\uff01-\uff60]/.test(s) && isCodeFragment(s);
}

function InlineHighlight({ code }: { code: string }) {
  return (
    <Highlight theme={themes.oneLight} code={code} language="cpp">
      {({ tokens, getTokenProps }) => (
        <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[13px] font-mono">
          {tokens[0]?.map((token, i) => (
            <span key={i} {...getTokenProps({ token, key: i })} />
          ))}
        </code>
      )}
    </Highlight>
  );
}

export default function InlineCodeText({ text, className }: InlineCodeTextProps) {
  const rendered = useMemo((): ReactNode => {
    if (!text) return null;

    // Case 1: Has backtick-wrapped code
    if (text.includes('`')) {
      const parts: ReactNode[] = [];
      const regex = /`([^`]+)`/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let key = 0;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }
        parts.push(<InlineHighlight key={key++} code={match[1]} />);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
      }
      return <>{parts}</>;
    }

    // Case 2: Pure code text
    if (isPureCode(text)) {
      return <InlineHighlight code={text} />;
    }

    // Case 3: Mixed — split on code-like fragments
    const parts: ReactNode[] = [];
    const regex = /([a-zA-Z_][\w<>:*&]*(?:\s*(?:->|::|<<|>>|\(\)|[()[\]{},;=+\-*/%<>!&|^~?]|\s)*[a-zA-Z_][\w<>:*&]*)*(?:\s*\([^)]*\))?(?:\s*(?:->|::|<<|>>)\s*[a-zA-Z_]\w*)*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    let hasCode = false;

    while ((match = regex.exec(text)) !== null) {
      const fragment = match[0];
      if (isCodeFragment(fragment) && fragment.length > 2) {
        hasCode = true;
        if (match.index > lastIndex) {
          parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }
        parts.push(<InlineHighlight key={key++} code={fragment} />);
        lastIndex = match.index + fragment.length;
      }
    }

    if (hasCode) {
      if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
      }
      return <>{parts}</>;
    }

    // No code detected, render plain
    return text;
  }, [text]);

  return <span className={className}>{rendered}</span>;
}
