// POST /api/vocab/review — submit remembered/not-remembered for a card

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { userId, questionId, remembered } = body;

  if (!userId || !questionId || remembered === undefined) {
    return Response.json({ error: 'userId, questionId, remembered required' }, { status: 400 });
  }

  const db = context.env.DB;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });

  // Check existing review record for this user+vocabulary
  const existing = await db.prepare(
    'SELECT id, interval_days FROM vocabulary_reviews WHERE user_id = ? AND vocabulary_id = ? ORDER BY reviewed_at DESC LIMIT 1'
  ).bind(userId, questionId).first() as any;

  let intervalDays: number;
  if (remembered) {
    // Increase interval: 1 → 3 → 7 → 14 → 30 → 60
    const currentInterval = existing?.interval_days || 0;
    const intervals = [1, 3, 7, 14, 30, 60];
    const nextIdx = intervals.findIndex(i => i > currentInterval);
    intervalDays = nextIdx >= 0 ? intervals[nextIdx] : 60;
  } else {
    // Reset to 1 day
    intervalDays = 1;
  }

  // Calculate next review date (based on Asia/Shanghai today)
  const todayDate = new Date(today + 'T12:00:00+08:00');
  todayDate.setDate(todayDate.getDate() + intervalDays);
  const nextReviewAt = todayDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });

  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO vocabulary_reviews (id, user_id, vocabulary_id, remembered, next_review_at, interval_days, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, questionId, remembered ? 1 : 0, nextReviewAt, intervalDays, Date.now()).run();

  return Response.json({
    success: true,
    remembered,
    intervalDays,
    nextReviewAt,
  });
};
