import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const mode = process.argv[2] || '--dry-run';
const sqlPath = 'tmp/update-cyan-quiz-config.sql';

const geometryPrompt = `初一数学解答/几何综合题，难度4/5，适中偏上，不要太简单，不超纲。

【彤彤当前已学范围】
- 几何：平行线、相交线、三角形基础、等腰三角形、等边三角形
- 代数：一元一次不等式、一元一次不等式组

【每天题型】
- 固定3题：1道选择题 + 1道填空题 + 1道解答/证明题（proof）
- 3题尽量覆盖不同知识点，不要都考同一种图形或同一个套路

【出题要求】
- 解答题要有2-4步推理，不能一眼秒出
- 多考：平行线性质与判定、同位角/内错角/同旁内角、三角形基础、等腰三角形性质、等边三角形性质
- 每天图形必须变化：不要连续使用同一张/同一结构图；在平行线、相交线、三角形、等腰三角形、等边三角形之间轮换
- 不要出宾语从句/被动语态等英语内容；数学不要超出初一已学范围
- 几何题如使用图形，必须在content.geometry字段输出JSXGraph几何图；坐标合理，angleLabels标注已知角度`;

function wrangler(args) {
  return execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function extractJsonArray(output) {
  const start = output.indexOf('[');
  if (start === -1) throw new Error('Wrangler output did not contain JSON array');
  return JSON.parse(output.slice(start));
}

const out = wrangler([
  'd1', 'execute', 'gongzu', '--remote', '--json',
  '--command', "SELECT config FROM user_modules WHERE user_id='cyan' AND module='quiz'",
]);
const arr = extractJsonArray(out);
const rawConfig = arr?.[0]?.results?.[0]?.config;
if (!rawConfig) throw new Error('No quiz config found for user cyan');

const cfg = JSON.parse(rawConfig);
const geometry = cfg.tags.find((tag) => tag.tag === '几何题');
if (!geometry) throw new Error('No 几何题 tag found in cyan quiz config');

geometry.count = 3;
geometry.prompt = geometryPrompt;
geometry.enabled = true;
geometry.types = ['choice', 'blank', 'proof'];

const json = JSON.stringify(cfg).replace(/'/g, "''");
const sql = `UPDATE user_modules SET config='${json}' WHERE user_id='cyan' AND module='quiz';\n`;

console.log('Updated geometry config preview:');
console.log(JSON.stringify(geometry, null, 2));

if (mode === '--write-sql') {
  writeFileSync(sqlPath, sql);
  console.log(`Wrote ${sqlPath}`);
} else if (mode === '--apply') {
  wrangler(['d1', 'execute', 'gongzu', '--remote', '--command', sql]);
  console.log('Applied updated cyan quiz config to remote D1.');
} else if (mode !== '--dry-run') {
  throw new Error(`Unknown mode: ${mode}. Use --dry-run, --write-sql, or --apply.`);
}
