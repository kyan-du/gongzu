import type { Env } from '../lib/env';

function getCorrectAnswer(question: any): string {
  const qAnswer = JSON.parse(question.answer as string);

  if (question.type === 'choice') {
    if (qAnswer.correctIndex !== undefined) return String.fromCharCode(65 + qAnswer.correctIndex);
    return qAnswer.answer || '';
  }

  if (question.type === 'blank') {
    if (typeof qAnswer === 'string') return qAnswer;
    if (Array.isArray(qAnswer)) return qAnswer[0] || '';
    if (qAnswer.blanks?.length) {
      return qAnswer.blanks
        .map((b: any) => String(b.accepts?.[0] ?? b.answer ?? ''))
        .join('\n');
    }
    return qAnswer.answers?.[0] || '';
  }

  if (question.type === 'reading') {
    return Array.isArray(qAnswer) ? qAnswer.join(',') : (qAnswer.answers || []).join(',');
  }

  if (question.type === 'rewrite') {
    return typeof qAnswer === 'string' ? qAnswer : (qAnswer.answer || qAnswer.answers?.[0] || '');
  }

  if (question.type === 'judgment') {
    return qAnswer.answer || String(qAnswer.correct ?? '');
  }

  return '';
}

// GET /api/submission-status?userId=cyan&quizId=xxx
// Checks/restores an existing submission. This is intentionally separate from POST /api/submit.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const quizId = url.searchParams.get('quizId');
    const detail = url.searchParams.get('detail') !== 'false';

    if (!userId || !quizId) {
      return Response.json({ error: 'userId and quizId required' }, { status: 400 });
    }

    const submissions = await context.env.DB.prepare(
      'SELECT question_id, answer, correct FROM submissions WHERE user_id = ? AND quiz_id = ?'
    ).bind(userId, quizId).all();

    if (submissions.results.length === 0) {
      return Response.json({ submitted: false, total: 0, correct: 0, results: [] });
    }

    const correctCount = submissions.results.filter((s: any) => s.correct).length;

    // Lightweight mode for lists/homepage: no per-question answer payload.
    if (!detail) {
      return Response.json({
        submitted: true,
        total: submissions.results.length,
        correct: correctCount,
      });
    }

    const questionIds = submissions.results.map((s: any) => s.question_id).filter(Boolean);
    const placeholders = questionIds.map(() => '?').join(',');
    const questionsResult = await context.env.DB.prepare(
      `SELECT id, type, answer FROM questions WHERE id IN (${placeholders})`
    ).bind(...questionIds).all();
    const questionMap = new Map((questionsResult.results || []).map((q: any) => [q.id, q]));

    const results = submissions.results.map((sub: any) => {
      const question = questionMap.get(sub.question_id);
      return {
        questionId: sub.question_id,
        answer: sub.answer,
        correct: sub.correct === 1,
        correctAnswer: question ? getCorrectAnswer(question) : '',
      };
    });

    return Response.json({
      submitted: true,
      total: submissions.results.length,
      correct: correctCount,
      results,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
