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
    const { userId, replace } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const today = todayCST();

    // Check existing quizzes
    const existing = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM daily_quizzes WHERE user_id = ? AND date = ?'
    ).bind(userId, today).first<{ cnt: number }>();

    const quizCount = existing?.cnt || 0;

    if (quizCount > 0) {
      if (replace) {
        // Check if any quiz has been answered
        const answered = await context.env.DB.prepare(
          `SELECT COUNT(*) as cnt FROM submissions s
           JOIN daily_quizzes dq ON s.quiz_id = dq.id
           WHERE dq.user_id = ? AND dq.date = ?`
        ).bind(userId, today).first<{ cnt: number }>();

        if ((answered?.cnt || 0) > 0) {
          return new Response(JSON.stringify({
            ok: false,
            error: '已有答题记录，无法重新出题',
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Delete old quizzes and their questions
        const oldQuizzes = await context.env.DB.prepare(
          'SELECT id, question_ids FROM daily_quizzes WHERE user_id = ? AND date = ?'
        ).bind(userId, today).all();

        for (const row of (oldQuizzes.results || [])) {
          const qIds = JSON.parse(row.question_ids as string) as string[];
          for (const qId of qIds) {
            await context.env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(qId).run();
          }
          await context.env.DB.prepare('DELETE FROM daily_quizzes WHERE id = ?').bind(row.id).run();
        }
      } else {
        return new Response(JSON.stringify({
          ok: true,
          alreadyExists: true,
          quizCount,
          message: `今天已有 ${quizCount} 套题，请刷新页面查看`,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

    // Record request
    const id = crypto.randomUUID();
    await context.env.DB.prepare(
      'INSERT INTO quiz_requests (id, user_id, date, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, userId, today, 'pending', Math.floor(Date.now() / 1000)).run();

    // Send webhook
    const webhookUrl = context.env.WEBHOOK_URL;
    const webhookToken = context.env.WEBHOOK_TOKEN;

    if (webhookUrl && webhookToken) {
      const displayName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;
      const hookUrl = webhookUrl.replace(/\/$/, '') + '/hooks/agent';

      context.waitUntil(
        fetch(hookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${webhookToken}`,
          },
          body: JSON.stringify({
            message: replace
              ? `拱卒重新出题请求：${displayName}点了"重新出题"，今天（${today}）的旧题已清除，请重新为 ${displayName}(${userId}) 出题。`
              : `拱卒出题请求：${displayName}在拱卒上点了"出题"按钮，今天（${today}）还没有题目，请尽快为 ${displayName}(${userId}) 出题。`,
            name: '拱卒',
            deliver: true,
            channel: 'telegram',
          }),
        }).catch(() => {})
      );
    }

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
