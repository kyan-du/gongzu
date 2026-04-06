interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const MEMORY_TAGS = ['记忆·套娃', '记忆·宫格'] as const;
type MemoryTag = typeof MEMORY_TAGS[number];

const SENTINEL: Record<MemoryTag, string> = {
  '记忆·套娃': '__memory_matryoshka__',
  '记忆·宫格': '__memory_grid__',
};

// POST /api/admin/memory-quiz
// Create daily memory game quizzes for a user
// Body: { userId, date, games: ['套娃', '宫格'] } or { userId, date } (defaults to both)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== context.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: JSON_HEADERS,
    });
  }

  try {
    const body = await context.request.json() as any;
    const { userId, date } = body;
    const games: string[] = body.games || ['套娃', '宫格'];

    if (!userId || !date) {
      return new Response(JSON.stringify({ error: 'userId and date required' }), {
        status: 400, headers: JSON_HEADERS,
      });
    }

    const created: string[] = [];
    const skipped: string[] = [];

    for (const game of games) {
      const tag = `记忆·${game}` as MemoryTag;
      if (!SENTINEL[tag]) {
        skipped.push(game);
        continue;
      }

      // Check if already exists for this date
      const existing = await context.env.DB.prepare(
        'SELECT id FROM daily_quizzes WHERE user_id = ? AND date = ? AND tag = ?'
      ).bind(userId, date, tag).first();

      if (existing) {
        skipped.push(game);
        continue;
      }

      // Create a virtual question for the memory game
      const questionId = SENTINEL[tag];
      const qExists = await context.env.DB.prepare(
        'SELECT id FROM questions WHERE id = ?'
      ).bind(questionId).first();

      if (!qExists) {
        await context.env.DB.prepare(
          'INSERT INTO questions (id, type, content, answer, explanation, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          questionId,
          'memory',
          JSON.stringify({ game: game === '套娃' ? 'matryoshka' : 'grid' }),
          JSON.stringify({ type: 'memory' }),
          null,
          JSON.stringify([tag]),
          3,
          Date.now()
        ).run();
      }

      const quizId = crypto.randomUUID();
      await context.env.DB.prepare(
        'INSERT INTO daily_quizzes (id, user_id, date, tag, title, question_ids, passage, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        quizId, userId, date, tag,
        game === '套娃' ? '套娃记忆' : '宫格记忆',
        JSON.stringify([questionId]),
        null,
        Date.now()
      ).run();

      created.push(game);
    }

    return new Response(JSON.stringify({ ok: true, created, skipped }), {
      status: 201, headers: JSON_HEADERS,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: JSON_HEADERS,
    });
  }
};
