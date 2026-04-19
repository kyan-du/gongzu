import type { Env } from '../../lib/env';

// 获取今天的日期（CST）
function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().split('T')[0];
}

// 增加天数
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

// POST /api/mistakes/mastery
// Body: { "userId": "cyan", "masteryId": "uuid", "action": "master" | "unmaster" }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { userId, masteryId, action } = body;

    if (!userId || !masteryId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action !== 'master' && action !== 'unmaster') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const today = todayCST();

    if (action === 'master') {
      // 手动标记为已掌握
      await context.env.DB.prepare(
        'UPDATE knowledge_mastery SET mastered = 1, mastered_reason = ? WHERE id = ? AND user_id = ?'
      ).bind('manual', masteryId, userId).run();
    } else if (action === 'unmaster') {
      // 取消掌握，重置为需要复习
      const tomorrow = addDays(today, 1);
      await context.env.DB.prepare(
        'UPDATE knowledge_mastery SET mastered = 0, mastered_reason = NULL, interval_days = 1, correct_streak = 0, next_review_at = ? WHERE id = ? AND user_id = ?'
      ).bind(tomorrow, masteryId, userId).run();
    }

    return new Response(JSON.stringify({ success: true }), {
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
