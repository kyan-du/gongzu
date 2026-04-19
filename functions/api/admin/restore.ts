import type { Env } from '../../lib/env';

export async function handleRestore(context: { env: Env }, body: Record<string, any>): Promise<Response> {
  const { backup } = body;
  if (!backup || typeof backup !== 'object') {
    return new Response(JSON.stringify({ error: 'backup object required (from GET backup action)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const results: Record<string, number> = {};

  // Restore questions
  if (backup.questions?.length) {
    let count = 0;
    for (const q of backup.questions) {
      await context.env.DB.prepare(
        'INSERT OR IGNORE INTO questions (id, type, content, answer, explanation, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(q.id, q.type, q.content, q.answer, q.explanation, q.tags, q.difficulty, q.created_at).run();
      count++;
    }
    results.questions = count;
  }

  // Restore daily_quizzes
  if (backup.daily_quizzes?.length) {
    let count = 0;
    for (const dq of backup.daily_quizzes) {
      await context.env.DB.prepare(
        'INSERT OR IGNORE INTO daily_quizzes (id, user_id, date, tag, title, question_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(dq.id, dq.user_id, dq.date, dq.tag, dq.title, dq.question_ids, dq.created_at).run();
      count++;
    }
    results.daily_quizzes = count;
  }

  // Restore submissions
  if (backup.submissions?.length) {
    let count = 0;
    for (const s of backup.submissions) {
      await context.env.DB.prepare(
        'INSERT OR IGNORE INTO submissions (id, user_id, question_id, quiz_id, answer, correct, score, ai_feedback, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(s.id, s.user_id, s.question_id, s.quiz_id, s.answer, s.correct, s.score, s.ai_feedback, s.submitted_at).run();
      count++;
    }
    results.submissions = count;
  }

  // Restore knowledge_mastery
  if (backup.knowledge_mastery?.length) {
    let count = 0;
    for (const km of backup.knowledge_mastery) {
      await context.env.DB.prepare(
        'INSERT OR IGNORE INTO knowledge_mastery (id, user_id, tag, correct_count, wrong_count, last_wrong_at, last_correct_at, mastery_level, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(km.id, km.user_id, km.tag, km.correct_count, km.wrong_count, km.last_wrong_at, km.last_correct_at, km.mastery_level, km.updated_at).run();
      count++;
    }
    results.knowledge_mastery = count;
  }

  return new Response(JSON.stringify({ action: 'restore', restored: results }), { headers: { 'Content-Type': 'application/json' } });
}
