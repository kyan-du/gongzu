interface Env {
  DB: D1Database;
  WEBHOOK_URL: string;
  WEBHOOK_TOKEN: string;
}

function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().split('T')[0];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const today = todayCST();

    // Check if quizzes already exist for today
    const existing = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM daily_quizzes WHERE user_id = ? AND date = ?'
    ).bind(userId, today).first<{ cnt: number }>();

    if ((existing?.cnt || 0) > 0) {
      return new Response(JSON.stringify({
        ok: true,
        alreadyExists: true,
        quizCount: existing?.cnt || 0,
        message: `今天已有 ${existing?.cnt} 套题，请刷新页面查看`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicate requests within last 10 minutes
    const tenMinAgo = Math.floor(Date.now() / 1000) - 600;
    const recentReq = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM quiz_requests WHERE user_id = ? AND date = ? AND created_at > ?'
    ).bind(userId, today, tenMinAgo).first<{ cnt: number }>();

    if ((recentReq?.cnt || 0) > 0) {
      return new Response(JSON.stringify({
        ok: true,
        duplicate: true,
        message: '已通知出题，请耐心等待',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert request record
    const id = crypto.randomUUID();
    await context.env.DB.prepare(
      'INSERT INTO quiz_requests (id, user_id, date, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, userId, today, 'pending', Math.floor(Date.now() / 1000)).run();

    return new Response(JSON.stringify({
      ok: true,
      message: '已通知出题，请稍候刷新页面',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
