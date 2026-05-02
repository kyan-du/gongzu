import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'dist', '.wrangler']);
const TARGET_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.md']);
const PERCENT_ENCODED_CJK = /%(?:E[4-9A-F]|F[0-9A-F]|D[4-9A-F])(?:%[0-9A-F]{2}){2,}/i;
const RAW_CJK_LINK = /https?:\/\/[^\s)`>]*[\u3400-\u9fff][^\s)`>]*/;
const ENCODE_TAG_LINK = /gongzu\.pages\.dev[^`'"\n]*\$\{\s*encodeURIComponent\([^}]+tag[^}]*\)\s*\}/i;
const ENCODE_TAG_DIRECT = /encodeURIComponent\([^)]*tag[^)]*\)/i;

const allowEncodeTagFiles = new Set([
  'AGENTS.md',
  path.join('src', 'lib', 'tags.ts'),
  path.join('src', 'lib', '__tests__', 'tags.test.ts'),
  path.join('scripts', 'check-ascii-slugs.mjs'),
]);

const allowPercentEncodedExamples = new Set([
  'AGENTS.md',
  path.join('src', 'lib', '__tests__', 'tags.test.ts'),
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) files.push(...walk(path.join(dir, entry.name)));
    } else if (TARGET_EXTS.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

const violations = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!allowPercentEncodedExamples.has(rel) && (PERCENT_ENCODED_CJK.test(line) || RAW_CJK_LINK.test(line) || ENCODE_TAG_LINK.test(line))) {
      violations.push(`${rel}:${index + 1}: user-facing GongZu links must use ASCII slugs, not Chinese/percent-encoded slugs`);
    }
    if (!allowEncodeTagFiles.has(rel) && ENCODE_TAG_DIRECT.test(line)) {
      violations.push(`${rel}:${index + 1}: do not build quiz tag URLs with encodeURIComponent(tag); use getSlug() / src/lib/tags.ts`);
    }
  });
}

if (violations.length) {
  console.error('ASCII slug rule violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('ASCII slug rules OK');
