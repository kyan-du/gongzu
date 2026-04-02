interface Env {
  DB: D1Database;
}

function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().split('T')[0];
}

// GET /api/review?userId=cyan&date=2026-04-02&category=英语语法
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const date = url.searchParams.get('date') || todayCST();
  const category = url.searchParams.get('category');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let query = `
    SELECT id, knowledge_point, category, error_count, correct_streak,
           interval_days, next_review_at, last_error_at
    FROM knowledge_mastery
    WHERE user_id = ? AND mastered = 0 AND next_review_at <= ?
  `;
  const bindings: any[] = [userId, date];

  if (category) {
    query += ' AND category = ?';
    bindings.push(category);
  }

  query += ' ORDER BY error_count DESC, next_review_at ASC';

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
  }));

  return new Response(JSON.stringify({ date, points }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
