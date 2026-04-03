interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

function checkAuth(request: Request, env: Env): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return token === env.ADMIN_API_KEY;
}

// GET /api/admin?action=quizzes&userId=cyan&date=2026-04-01
// GET /api/admin?action=submissions&userId=cyan&quizId=xxx
// DELETE /api/admin?action=delete-quiz&quizId=xxx
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'quizzes') {
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

    if (action === 'submissions') {
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

    if (action === 'pending-requests') {
      const rows = await context.env.DB.prepare(
        "SELECT * FROM quiz_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10"
      ).all();
      return new Response(JSON.stringify({ requests: rows.results }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'backup') {
      const tables = ['questions', 'daily_quizzes', 'submissions', 'knowledge_mastery', 'quiz_requests'];
      const data: Record<string, any[]> = {};
      for (const table of tables) {
        const rows = await context.env.DB.prepare(`SELECT * FROM ${table}`).all();
        data[table] = rows.results;
      }
      return new Response(JSON.stringify({ backup: data, created_at: new Date().toISOString() }), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="gongzu-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use: quizzes, submissions, pending-requests, backup' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin - actions: reset-date (clear a specific date's data)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await context.request.json() as Record<string, any>;
    const action = body.action;

    if (action === 'update-request-status') {
      const { requestId, status } = body;
      if (!requestId || !status) {
        return new Response(JSON.stringify({ error: 'requestId and status required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      await context.env.DB.prepare('UPDATE quiz_requests SET status = ? WHERE id = ?').bind(status, requestId).run();
      return new Response(JSON.stringify({ action: 'update-request-status', requestId, status }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'reset-date') {
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

    if (action === 'restore') {
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

    return new Response(JSON.stringify({ error: 'Unknown action. Use: update-request-status, reset-date, restore' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// DELETE /api/admin - delete quiz and its questions/submissions
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
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
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
