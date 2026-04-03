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

    // Check if there are already quizzes for today
    const existing = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM daily_quizzes WHERE user_id = ? AND date = ?'
    ).bind(userId, today).first<{ cnt: number }>();

    const quizCount = existing?.cnt || 0;

    // If quizzes already exist, don't send webhook — just tell user to refresh
    if (quizCount > 0) {
      return new Response(JSON.stringify({
        ok: true,
        alreadyExists: true,
        quizCount,
        message: `今天已有 ${quizCount} 套题，请刷新页面查看`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No quizzes yet — fire webhook to notify the assistant
    const webhookUrl = context.env.WEBHOOK_URL;
    const webhookToken = context.env.WEBHOOK_TOKEN;

    if (webhookUrl && webhookToken) {
      const displayName = userId === 'cyan' ? '彤彤' : userId === 'ryan' ? '可可' : userId;

      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${webhookToken}`,
        },
        body: JSON.stringify({
          event: 'quiz_request',
          userId,
          displayName,
          date: today,
          message: `${displayName}在拱卒上点了"出题"按钮，今天还没有题目，请尽快出题。`,
        }),
      }).catch(() => {});
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
