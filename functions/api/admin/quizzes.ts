import type { Env } from '../../lib/env';

export async function handleQuizzes(context: { env: Env; request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const date = url.searchParams.get('date');
  let query = 'SELECT * FROM daily_quizzes WHERE 1=1';
  const params: any[] = [];
  if (userId) { query += ' AND user_id = ?'; params.push(userId); }
  if (date) { query += ' AND date = ?'; params.push(date); }
  query += ' ORDER BY date DESC, created_at DESC LIMIT 50';
  const rows = await context.env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify({ quizzes: rows.results }), { headers: { 'Content-Type': 'application/json' } });
}
