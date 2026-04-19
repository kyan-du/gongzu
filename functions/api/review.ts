import type { Env } from '../lib/env';

function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().split('T')[0];
}

const CATEGORY_SLUGS: Record<string, string> = {
  'english-grammar': '英语语法',
  'xiyouji': '西游记',
  'reading': '阅读理解·名人故事',
};

// GET /api/review?userId=cyan&category=english-grammar
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const date = url.searchParams.get('date') || todayCST();
  const categoryParam = url.searchParams.get('category');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resolve slug to Chinese category name
  const category = categoryParam
    ? (CATEGORY_SLUGS[categoryParam] || categoryParam)
    : null;

  let query = `
    SELECT id, knowledge_point, category, error_count, correct_streak,
           interval_days, next_review_at, last_error_at, mastered
    FROM knowledge_mastery
    WHERE user_id = ?
  `;
  const bindings: any[] = [userId];

  if (category) {
    query += ' AND category = ?';
    bindings.push(category);
  }

  query += ' ORDER BY mastered ASC, next_review_at ASC, error_count DESC';

  const result = await context.env.DB.prepare(query).bind(...bindings).all();

  const points = (result.results || []).map((row: any) => ({
    id: row.id,
    knowledgePoint: row.knowledge_point,
    category: row.category,
    errorCount: row.error_count,
    correctStreak: row.correct_streak,
    intervalDays: row.interval_days,
    nextReviewAt: row.next_review_at,
    lastErrorAt: row.last_error_at,
    mastered: !!row.mastered,
  }));

  return new Response(JSON.stringify({ date, points }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
