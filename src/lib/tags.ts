// Tag ↔ URL slug mapping
const tagToSlug: Record<string, string> = {
  '英语语法': 'english-grammar',
  '英语语法·改写测试': 'english-rewrite-test',
  '英语单词': 'english-vocab',
  '西游记': 'journey-to-the-west',
  '数学': 'math',
  '语文': 'chinese',
  '语文拼音': 'chinese-pinyin',
  '阅读理解·名人故事': 'reading-stories',
  '阅读理解': 'reading',
  '错题重做': 'mistakes-redo',
  '名人故事': 'celebrity-stories',
  '记忆·套娃': 'memory-matryoshka',
  '记忆·宫格': 'memory-grid',
  '记忆·天平': 'memory-balance',
  '记忆·代换': 'memory-equivalence',
  'GESP-6': 'gesp-6',
  '骆驼祥子': 'camel-xiangzi',
  '单词记忆': 'vocab-memory',
  '几何题': 'geometry',
  '数学思维训练': 'math-thinking',
  '应用题': 'word-problems',
  '口算题': 'mental-math',
  '规律训练': 'patterns',
};

/** Check if a tag represents a memory game quiz */
export function isMemoryGameTag(tag: string): boolean {
  return tag === '记忆·套娃' || tag === '记忆·宫格' || tag === '记忆·天平' || tag === '记忆·代换';
}

/** Get the game type from a memory game tag */
export function memoryGameType(tag: string): 'matryoshka' | 'grid' | 'balance' | 'equivalence' | null {
  if (tag === '记忆·套娃') return 'matryoshka';
  if (tag === '记忆·宫格') return 'grid';
  if (tag === '记忆·天平') return 'balance';
  if (tag === '记忆·代换') return 'equivalence';
  return null;
}

const slugToTag: Record<string, string> = Object.fromEntries(
  Object.entries(tagToSlug).map(([k, v]) => [v, k])
);

function fallbackSlug(tag: string): string {
  let hash = 5381;
  for (const char of tag) {
    hash = ((hash << 5) + hash) ^ char.codePointAt(0)!;
  }
  return `quiz-${(hash >>> 0).toString(36)}`;
}

export function getSlug(tag: string): string {
  const normalized = tag.trim();
  return tagToSlug[normalized] || fallbackSlug(normalized);
}

export function getTag(slug: string): string {
  // Keep decodeURIComponent fallback so old Chinese/percent-encoded links still open.
  return slugToTag[slug] || decodeURIComponent(slug);
}
