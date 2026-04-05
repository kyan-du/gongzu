// GET /api/quiz-plan?date=2026-04-05
// 出题调度 API：返回每个用户今天需要出什么题，含完整 prompt
// prompt = 用户出题要求 + 复习点 + 自动生成的 JSON 格式模板

import { buildFormatPrompt } from '../lib/question-types';

interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

function checkAuth(request: Request, env: Env): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return token === env.ADMIN_API_KEY;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

interface TagConfig {
  tag: string;
  enabled?: boolean;
  prompt?: string;
  count?: number;
  types?: string[];    // 可选：限定使用的题型，如 ['choice','blank']
  // backward compat
  type?: string;
  focus?: string[];
  exclude?: string[];
  difficulty?: number;
  schedule?: string;
  config?: Record<string, any>;
}

// 把旧格式 type/focus/exclude 拼成 prompt 文本（向后兼容）
function legacyToPrompt(t: TagConfig): string {
  const parts: string[] = [];
  if (t.type) parts.push(`题型：${t.type}`);
  if (t.count) parts.push(`题数：${t.count}题`);
  if (t.focus?.length) parts.push(`重点：${t.focus.join('、')}`);
  if (t.exclude?.length) parts.push(`排除：${t.exclude.join('、')}`);
  if (t.difficulty) parts.push(`难度：${t.difficulty}/5`);
  return parts.join('。');
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const url = new URL(context.request.url);
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);

  // 获取所有 quiz 模块 enabled 的用户
  const { results: moduleRows } = await context.env.DB.prepare(
    `SELECT um.user_id, um.config, u.name as user_name
     FROM user_modules um
     JOIN users u ON u.id = um.user_id
     WHERE um.module = 'quiz' AND um.enabled = 1`
  ).all<{ user_id: string; config: string | null; user_name: string }>();

  const plans: any[] = [];

  for (const row of (moduleRows || [])) {
    const cfg = row.config ? JSON.parse(row.config) : {};
    let tags: TagConfig[] = [];

    if (Array.isArray(cfg.tags)) {
      tags = cfg.tags.map((t: any) => {
        if (typeof t === 'string') {
          return { tag: t, count: 5, schedule: 'daily', enabled: true };
        }
        return { ...t, enabled: t.enabled !== false };
      });
    }

    // 过滤：未启用的 tag 跳过
    tags = tags.filter(t => t.enabled !== false);

    // 过滤 schedule
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    tags = tags.filter(t => {
      if (t.schedule === 'weekday') return isWeekday;
      if (t.schedule === 'weekend') return !isWeekday;
      return true;
    });

    // 查已推送的题目
    const { results: existingQuizzes } = await context.env.DB.prepare(
      `SELECT tag FROM daily_quizzes WHERE user_id = ? AND date = ?`
    ).bind(row.user_id, date).all<{ tag: string }>();
    const pushedTags = new Set((existingQuizzes || []).map(q => q.tag));

    // 查待复习知识点
    const { results: reviewPoints } = await context.env.DB.prepare(
      `SELECT knowledge_point, category FROM knowledge_mastery
       WHERE user_id = ? AND mastered = 0 AND next_review_at <= ?
       ORDER BY next_review_at ASC
       LIMIT 20`
    ).bind(row.user_id, date).all<{ knowledge_point: string; category: string | null }>();

    const reviewByTag: Record<string, string[]> = {};
    for (const rp of (reviewPoints || [])) {
      const cat = rp.category || 'general';
      if (!reviewByTag[cat]) reviewByTag[cat] = [];
      reviewByTag[cat].push(rp.knowledge_point);
    }

    // 组装每个科目的完整 prompt
    const tasks = tags.map(t => {
      const alreadyPushed = pushedTags.has(t.tag);
      const reviews = reviewByTag[t.tag] || [];
      const count = t.count || 5;

      const userPrompt = t.prompt || legacyToPrompt(t);

      const reviewSection = reviews.length > 0
        ? `\n## 复习知识点（请为以下知识点各出1道变式题，计入总题数）\n${reviews.map(r => `- ${r}`).join('\n')}`
        : '';

      // 动态生成格式模板：如果 config 指定了 types，只展示对应题型
      const formatPrompt = buildFormatPrompt(t.types);

      const fullPrompt = [
        `# 出题任务：${t.tag}`,
        `- 用户：${row.user_id}（${row.user_name}）`,
        `- 日期：${date}`,
        `- 科目标签：${t.tag}`,
        `- 题数：${count}题`,
        '',
        '## 出题要求',
        userPrompt,
        reviewSection,
        '',
        formatPrompt,
      ].filter(Boolean).join('\n');

      return {
        tag: t.tag,
        count,
        alreadyPushed,
        reviewPoints: reviews,
        prompt: fullPrompt,
      };
    });

    const pendingTasks = tasks.filter(t => !t.alreadyPushed);

    if (pendingTasks.length > 0) {
      plans.push({
        userId: row.user_id,
        userName: row.user_name,
        tasks: pendingTasks,
      });
    }
  }

  return new Response(JSON.stringify({ date, plans }), { headers: JSON_HEADERS });
};
