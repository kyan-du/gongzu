interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

// GET /api/quiz?userId=cyan&date=2026-04-01
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const date = url.searchParams.get('date');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let query = 'SELECT * FROM daily_quizzes WHERE user_id = ?';
    const params: any[] = [userId];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }

    query += ' ORDER BY date DESC LIMIT 30';

    const quizzes = await context.env.DB.prepare(query).bind(...params).all();

    // For each quiz, fetch its questions
    const result = [];
    for (const quiz of quizzes.results) {
      const questionIds = JSON.parse(quiz.question_ids as string);
      const placeholders = questionIds.map(() => '?').join(',');
      const questions = await context.env.DB.prepare(
        `SELECT * FROM questions WHERE id IN (${placeholders})`
      ).bind(...questionIds).all();

      result.push({
        ...quiz,
        questions: questions.results.map((q: any) => ({
          ...q,
          content: JSON.parse(q.content),
          answer: JSON.parse(q.answer),
          tags: JSON.parse(q.tags || '[]'),
        })),
      });
    }

    return new Response(JSON.stringify({ quizzes: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/quiz - Create quiz (requires API key)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token !== context.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json() as any;
    const { userId, date, tag, title, questions } = body;

    if (!userId || !date || !tag || !questions?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const questionIds: string[] = [];

    for (const q of questions) {
      const id = crypto.randomUUID();
      questionIds.push(id);
      await context.env.DB.prepare(
        'INSERT INTO questions (id, type, content, answer, explanation, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id,
        q.type,
        JSON.stringify(q.content),
        JSON.stringify(q.answer),
        q.explanation || null,
        JSON.stringify(q.tags || [tag]),
        q.difficulty || 3,
        Date.now()
      ).run();
    }

    const quizId = crypto.randomUUID();
    await context.env.DB.prepare(
      'INSERT INTO daily_quizzes (id, user_id, date, tag, title, question_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(quizId, userId, date, tag, title || `${tag}每日练习`, JSON.stringify(questionIds), Date.now()).run();

    return new Response(JSON.stringify({ quizId, questionCount: questions.length }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
