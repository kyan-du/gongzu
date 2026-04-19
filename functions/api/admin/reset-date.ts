import type { Env } from '../../lib/env';

export async function handleResetDate(context: { env: Env }, body: Record<string, any>): Promise<Response> {
  const { userId, date } = body;
  if (!userId || !date) {
    return new Response(JSON.stringify({ error: 'userId and date required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Get quizzes for this date
  const quizzes = await context.env.DB.prepare(
    'SELECT id, question_ids FROM daily_quizzes WHERE user_id = ? AND date = ?'
  ).bind(userId, date).all();

  // Auto-backup before delete
  const backupData: Record<string, any[]> = { daily_quizzes: quizzes.results, questions: [], submissions: [] };
  for (const quiz of quizzes.results) {
    const qIds = JSON.parse(quiz.question_ids as string);
    if (qIds.length) {
      const placeholders = qIds.map(() => '?').join(',');
      const qs = await context.env.DB.prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`).bind(...qIds).all();
      backupData.questions.push(...qs.results);
    }
    const subs = await context.env.DB.prepare('SELECT * FROM submissions WHERE quiz_id = ?').bind(quiz.id).all();
    backupData.submissions.push(...subs.results);
  }

  let questionsDeleted = 0;
  let submissionsDeleted = 0;

  for (const quiz of quizzes.results) {
    // Delete submissions
    const subR = await context.env.DB.prepare('DELETE FROM submissions WHERE quiz_id = ?').bind(quiz.id).run();
    submissionsDeleted += subR.meta.changes;

    // Delete questions
    const qIds = JSON.parse(quiz.question_ids as string);
    for (const qId of qIds) {
      await context.env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(qId).run();
      questionsDeleted++;
    }
  }

  // Delete quizzes
  const quizR = await context.env.DB.prepare(
    'DELETE FROM daily_quizzes WHERE user_id = ? AND date = ?'
  ).bind(userId, date).run();

  // Delete quiz_requests for this date
  await context.env.DB.prepare(
    'DELETE FROM quiz_requests WHERE user_id = ? AND date = ?'
  ).bind(userId, date).run();

  return new Response(JSON.stringify({
    action: 'reset-date', userId, date,
    deleted: { quizzes: quizR.meta.changes, questions: questionsDeleted, submissions: submissionsDeleted },
    backup: backupData,
  }), { headers: { 'Content-Type': 'application/json' } });
}
