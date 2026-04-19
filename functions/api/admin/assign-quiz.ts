import type { Env } from '../../lib/env';

export async function handleAssignQuiz(context: { env: Env }, body: Record<string, any>): Promise<Response> {
  // Create a daily_quiz from existing question IDs (no new questions created)
  const { userId, date, tag, title, questionIds } = body;
  if (!userId || !date || !tag || !questionIds?.length) {
    return new Response(JSON.stringify({ error: 'userId, date, tag, questionIds required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Verify all question IDs exist
  const placeholders = questionIds.map(() => '?').join(',');
  const existing = await context.env.DB.prepare(
    `SELECT id FROM questions WHERE id IN (${placeholders})`
  ).bind(...questionIds).all();
  const existingIds = new Set(existing.results.map((r: any) => r.id));
  const missing = questionIds.filter((id: string) => !existingIds.has(id));
  if (missing.length) {
    return new Response(JSON.stringify({ error: `Question IDs not found: ${missing.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const quizId = crypto.randomUUID();
  await context.env.DB.prepare(
    'INSERT INTO daily_quizzes (id, user_id, date, tag, title, question_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(quizId, userId, date, tag, title || `${tag}每日练习`, JSON.stringify(questionIds), Date.now()).run();

  return new Response(JSON.stringify({ quizId, questionCount: questionIds.length }), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
