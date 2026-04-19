import type { Env } from '../../lib/env';

export async function handleDeleteQuiz(context: { env: Env; request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const quizId = url.searchParams.get('quizId');
  if (!quizId) {
    return new Response(JSON.stringify({ error: 'quizId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Get question IDs
  const quiz = await context.env.DB.prepare('SELECT * FROM daily_quizzes WHERE id = ?').bind(quizId).first();
  if (!quiz) {
    return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const questionIds = JSON.parse(quiz.question_ids as string);

  // Delete submissions
  await context.env.DB.prepare('DELETE FROM submissions WHERE quiz_id = ?').bind(quizId).run();

  // Delete questions
  for (const qId of questionIds) {
    await context.env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(qId).run();
  }

  // Delete quiz
  await context.env.DB.prepare('DELETE FROM daily_quizzes WHERE id = ?').bind(quizId).run();

  return new Response(JSON.stringify({ deleted: { quizId, questions: questionIds.length } }), { headers: { 'Content-Type': 'application/json' } });
}
