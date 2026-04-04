// GET /api/cards/settings?userId=cyan — get card learning settings
// PUT /api/cards/settings — update settings

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const db = context.env.DB;
  const row = await db.prepare(
    `SELECT daily_new_words, daily_total_limit FROM card_settings WHERE user_id = ?`
  ).bind(userId).first() as any;

  return Response.json({
    dailyNewWords: row?.daily_new_words ?? 15,
    dailyTotalLimit: row?.daily_total_limit ?? 20,
  });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { userId, dailyNewWords, dailyTotalLimit } = body;
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const newW = Math.max(1, Math.min(50, dailyNewWords ?? 15));
  const totalL = Math.max(1, Math.min(100, dailyTotalLimit ?? 20));

  const db = context.env.DB;
  await db.prepare(
    `INSERT INTO card_settings (user_id, daily_new_words, daily_total_limit)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET daily_new_words = ?, daily_total_limit = ?`
  ).bind(userId, newW, totalL, newW, totalL).run();

  return Response.json({ ok: true, dailyNewWords: newW, dailyTotalLimit: totalL });
};
