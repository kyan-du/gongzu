import type { Env } from '../../lib/env';

export async function handleSubmissions(context: { env: Env; request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const quizId = url.searchParams.get('quizId');
  let query = 'SELECT * FROM submissions WHERE 1=1';
  const params: any[] = [];
  if (userId) { query += ' AND user_id = ?'; params.push(userId); }
  if (quizId) { query += ' AND quiz_id = ?'; params.push(quizId); }
  query += ' ORDER BY submitted_at DESC LIMIT 100';
  const rows = await context.env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify({ submissions: rows.results }), { headers: { 'Content-Type': 'application/json' } });
}
