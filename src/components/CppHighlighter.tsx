import type { ReactNode } from 'react';

/**
 * Lightweight C++ syntax highlighter for question stems.
 * No external deps — just regex-based tokenization with Tailwind classes.
 */

interface Token {
  type: 'keyword' | 'type' | 'string' | 'number' | 'comment' | 'preprocessor' | 'operator' | 'punctuation' | 'blank' | 'plain';
  text: string;
}

const KEYWORDS = new Set([
  'auto', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default',
  'delete', 'do', 'else', 'enum', 'explicit', 'extern', 'false', 'for',
  'friend', 'goto', 'if', 'inline', 'namespace', 'new', 'nullptr', 'NULL',
  'operator', 'private', 'protected', 'public', 'return', 'sizeof', 'static',
  'struct', 'switch', 'template', 'this', 'throw', 'true', 'try', 'typedef',
  'typename', 'union', 'using', 'virtual', 'void', 'volatile', 'while',
]);

const TYPES = new Set([
  'int', 'long', 'short', 'float', 'double', 'char', 'bool', 'unsigned',
  'signed', 'string', 'vector', 'map', 'set', 'queue', 'stack', 'pair',
  'list', 'deque', 'array', 'unordered_map', 'unordered_set', 'size_t',
  'TreeNode', 'ListNode',
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Fill-in-the-blank underscores
    const blankMatch = line.slice(i).match(/^_{3,}/);
    if (blankMatch) {
      tokens.push({ type: 'blank', text: blankMatch[0] });
      i += blankMatch[0].length;
      continue;
    }

    // Preprocessor
    if (i === 0 || line.slice(0, i).trim() === '') {
      const ppMatch = line.slice(i).match(/^#\w+.*/);
      if (ppMatch) {
        tokens.push({ type: 'preprocessor', text: ppMatch[0] });
        i += ppMatch[0].length;
        continue;
      }
    }

    // Line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    // String literal
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', text: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Char literal
    if (line[i] === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', text: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Number
    const numMatch = line.slice(i).match(/^(?:0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)/);
    if (numMatch && (i === 0 || /[^a-zA-Z_]/.test(line[i - 1]))) {
      tokens.push({ type: 'number', text: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    // Identifier / keyword / type
    const idMatch = line.slice(i).match(/^[a-zA-Z_]\w*/);
    if (idMatch) {
      const word = idMatch[0];
      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (TYPES.has(word)) {
        tokens.push({ type: 'type', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      i += word.length;
      continue;
    }

    // Operators
    const opMatch = line.slice(i).match(/^(?:<<|>>|->|::|<=|>=|==|!=|&&|\|\||[+\-*/%=<>&|^!~?])/);
    if (opMatch) {
      tokens.push({ type: 'operator', text: opMatch[0] });
      i += opMatch[0].length;
      continue;
    }

    // Punctuation
    if ('{}()[];:,.'.includes(line[i])) {
      tokens.push({ type: 'punctuation', text: line[i] });
      i++;
      continue;
    }

    // Whitespace and anything else
    tokens.push({ type: 'plain', text: line[i] });
    i++;
  }

  return tokens;
}

const COLOR_MAP: Record<Token['type'], string> = {
  keyword: 'text-purple-600 dark:text-purple-400',
  type: 'text-blue-600 dark:text-blue-400',
  string: 'text-green-700 dark:text-green-400',
  number: 'text-orange-600 dark:text-orange-400',
  comment: 'text-gray-400 dark:text-gray-500 italic',
  preprocessor: 'text-teal-600 dark:text-teal-400',
  operator: 'text-gray-600 dark:text-gray-300',
  punctuation: 'text-gray-500 dark:text-gray-400',
  blank: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 px-1 rounded',
  plain: '',
};

export function highlightCpp(code: string): ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    const tokens = tokenizeLine(line);
    return (
      <span key={lineIdx}>
        {lineIdx > 0 && '\n'}
        {tokens.map((tok, tokIdx) => {
          const cls = COLOR_MAP[tok.type];
          return cls ? (
            <span key={tokIdx} className={cls}>{tok.text}</span>
          ) : (
            <span key={tokIdx}>{tok.text}</span>
          );
        })}
      </span>
    );
  });
}
