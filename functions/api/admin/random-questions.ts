import type { Env } from '../../lib/env';

export async function handleRandomQuestions(context: { env: Env }, body: Record<string, any>): Promise<Response> {
  // Get random questions matching criteria (for GESP bank etc.)
  const { tag, count, excludeIds } = body;
  if (!tag || !count) {
    return new Response(JSON.stringify({ error: 'tag and count required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let query = `SELECT id, type, content, answer, tags FROM questions WHERE tags LIKE ?`;
  const params: any[] = [`%${tag}%`];

  if (excludeIds?.length) {
    const ph = excludeIds.map(() => '?').join(',');
    query += ` AND id NOT IN (${ph})`;
    params.push(...excludeIds);
  }

  query += ` ORDER BY RANDOM() LIMIT ?`;
  params.push(count);

  const rows = await context.env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify({ questions: rows.results }), { headers: { 'Content-Type': 'application/json' } });
}
