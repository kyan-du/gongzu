interface Env {
  DB: D1Database;
}

interface DayStats {
  date: string;
  total: number;
  completed: number;
  correct: number;
  rate: number;
}

interface TagStats {
  tag: string;
  total: number;
  correct: number;
  rate: number;
}

// GET /api/parent?child=cyan
// GET /api/parent?child=cyan&range=week
// GET /api/parent?child=cyan&range=month
// GET /api/parent?child=all
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const child = url.searchParams.get('child');
    const range = url.searchParams.get('range');

    if (!child) {
      return new Response(JSON.stringify({ error: 'child parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (child === 'all') {
      // 所有孩子的今日概览
      const results = await Promise.all([
        getTodayStats(context.env.DB, 'cyan'),
        getTodayStats(context.env.DB, 'ryan'),
      ]);
      return new Response(JSON.stringify({
        children: [
          { userId: 'cyan', name: '彤彤', ...results[0] },
          { userId: 'ryan', name: '可可', ...results[1] },
        ],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 单个孩子的数据
    const today = await getTodayStats(context.env.DB, child);
    const byTag = await getTagStats(context.env.DB, child);

    let history: DayStats[] = [];
    if (range === 'week' || range === 'month') {
      const days = range === 'week' ? 7 : 30;
      history = await getHistoryStats(context.env.DB, child, days);
    }

    return new Response(JSON.stringify({
      today,
      history,
      byTag,
    }), {
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

async function getTodayStats(db: D1Database, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // 今天的作业总数
  const quizzesResult = await db.prepare(
    'SELECT question_ids FROM daily_quizzes WHERE user_id = ? AND date = ?'
  ).bind(userId, today).all();
  
  const total = quizzesResult.results.reduce((sum: number, quiz: any) => {
    return sum + JSON.parse(quiz.question_ids).length;
  }, 0);

  if (total === 0) {
    return { total: 0, completed: 0, correct: 0, rate: 0 };
  }

  // 今天的提交记录（submitted_at 是秒级 unix 时间戳）
  const startOfDay = Math.floor(new Date(today + 'T00:00:00').getTime() / 1000);
  const endOfDay = startOfDay + 24 * 60 * 60;

  const submissionsResult = await db.prepare(
    'SELECT correct FROM submissions WHERE user_id = ? AND submitted_at >= ? AND submitted_at < ?'
  ).bind(userId, startOfDay, endOfDay).all();

  const completed = submissionsResult.results.length;
  const correct = submissionsResult.results.filter((s: any) => s.correct === 1).length;
  const rate = completed > 0 ? correct / completed : 0;

  return { total, completed, correct, rate };
}

async function getHistoryStats(db: D1Database, userId: string, days: number): Promise<DayStats[]> {
  const history: DayStats[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // 当天作业总数
    const quizzesResult = await db.prepare(
      'SELECT question_ids FROM daily_quizzes WHERE user_id = ? AND date = ?'
    ).bind(userId, dateStr).all();

    const total = quizzesResult.results.reduce((sum: number, quiz: any) => {
      return sum + JSON.parse(quiz.question_ids).length;
    }, 0);

    if (total === 0) {
      history.push({ date: dateStr, total: 0, completed: 0, correct: 0, rate: 0 });
      continue;
    }

    // 当天提交记录
    const startOfDay = Math.floor(new Date(dateStr + 'T00:00:00').getTime() / 1000);
    const endOfDay = startOfDay + 24 * 60 * 60;

    const submissionsResult = await db.prepare(
      'SELECT correct FROM submissions WHERE user_id = ? AND submitted_at >= ? AND submitted_at < ?'
    ).bind(userId, startOfDay, endOfDay).all();

    const completed = submissionsResult.results.length;
    const correct = submissionsResult.results.filter((s: any) => s.correct === 1).length;
    const rate = completed > 0 ? correct / completed : 0;

    history.push({ date: dateStr, total, completed, correct, rate });
  }

  return history;
}

async function getTagStats(db: D1Database, userId: string): Promise<TagStats[]> {
  const today = new Date().toISOString().split('T')[0];
  
  // 今天的作业按 tag 分组
  const quizzesResult = await db.prepare(
    'SELECT id, tag, question_ids FROM daily_quizzes WHERE user_id = ? AND date = ?'
  ).bind(userId, today).all();

  const tagMap = new Map<string, { total: number; quizIds: string[] }>();
  
  for (const quiz of quizzesResult.results) {
    const tag = quiz.tag as string;
    const questionIds = JSON.parse(quiz.question_ids as string);
    
    if (!tagMap.has(tag)) {
      tagMap.set(tag, { total: 0, quizIds: [] });
    }
    const entry = tagMap.get(tag)!;
    entry.total += questionIds.length;
    entry.quizIds.push(quiz.id as string);
  }

  const startOfDay = Math.floor(new Date(today + 'T00:00:00').getTime() / 1000);
  const endOfDay = startOfDay + 24 * 60 * 60;

  const byTag: TagStats[] = [];
  for (const [tag, { total, quizIds }] of tagMap) {
    const placeholders = quizIds.map(() => '?').join(',');
    const submissionsResult = await db.prepare(
      `SELECT correct FROM submissions WHERE user_id = ? AND quiz_id IN (${placeholders}) AND submitted_at >= ? AND submitted_at < ?`
    ).bind(userId, ...quizIds, startOfDay, endOfDay).all();

    const correct = submissionsResult.results.filter((s: any) => s.correct === 1).length;
    const completed = submissionsResult.results.length;
    const rate = completed > 0 ? correct / completed : 0;

    byTag.push({ tag, total, correct, rate });
  }

  return byTag.sort((a, b) => b.total - a.total);
}
