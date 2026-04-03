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

    return new Response(JSON.stringify({ error: 'Unknown action. Use: quizzes, submissions, reset' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /api/admin - actions: reset (clear all data), reset-date (clear a specific date)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await context.request.json() as Record<string, any>;
    const action = body.action;

    if (action === 'reset') {
      // Clear ALL data from all tables (for testing)
      const userId = body.userId; // optional: only clear for a specific user
      const tables = ['submissions', 'daily_quizzes', 'questions', 'quiz_requests', 'knowledge_mastery'];
      const results: Record<string, number> = {};

      for (const table of tables) {
        let query = `DELETE FROM ${table}`;
        const params: any[] = [];
        if (userId && table !== 'questions') {
          query += ' WHERE user_id = ?';
          params.push(userId);
        }
        const r = await context.env.DB.prepare(query).bind(...params).run();
        results[table] = r.meta.changes;
      }

      return new Response(JSON.stringify({ action: 'reset', userId: userId || 'all', deleted: results }), { headers: { 'Content-Type': 'application/json' } });
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

      return new Response(JSON.stringify({
        action: 'reset-date', userId, date,
        deleted: { quizzes: quizR.meta.changes, questions: questionsDeleted, submissions: submissionsDeleted }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action. Use: reset, reset-date' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
