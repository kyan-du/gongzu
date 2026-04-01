// Tag ↔ URL slug mapping
const tagToSlug: Record<string, string> = {
  '英语语法': 'english-grammar',
  '英语单词': 'english-vocab',
  '西游记': 'journey-to-the-west',
  '数学': 'math',
  '语文': 'chinese',
};

const slugToTag: Record<string, string> = Object.fromEntries(
  Object.entries(tagToSlug).map(([k, v]) => [v, k])
);

export function getSlug(tag: string): string {
  return tagToSlug[tag] || encodeURIComponent(tag);
}

export function getTag(slug: string): string {
  return slugToTag[slug] || decodeURIComponent(slug);
}
