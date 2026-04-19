// GET /api/parent/activity?limit=20
// 返回最近的活动事件（提交答题、完成记忆游戏等）

import type { Env } from '../../lib/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  // Recent quiz submissions (grouped by quiz_id to avoid per-question noise)
  const { results: quizEvents } = await context.env.DB.prepare(`
    SELECT
      s.user_id,
      s.quiz_id,
      dq.tag,
      dq.title,
      COUNT(*) as total,
      SUM(s.correct) as correct,
      MAX(s.submitted_at) as ts
    FROM submissions s
    JOIN daily_quizzes dq ON dq.id = s.quiz_id
    GROUP BY s.user_id, s.quiz_id
    ORDER BY ts DESC
    LIMIT ?
  `).bind(limit).all<any>();

  // Recent memory games
  const { results: mgEvents } = await context.env.DB.prepare(`
    SELECT
      user_id,
      game_type,
      total,
      correct,
      accuracy,
      duration_sec,
      created_at as ts
    FROM memory_games
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all<any>();

  // Quiz creation events (春庭出题)
  const { results: quizCreated } = await context.env.DB.prepare(`
    SELECT
      user_id,
      tag,
      title,
      question_ids,
      created_at as ts
    FROM daily_quizzes
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all<any>();

  // Merge and sort by timestamp
  const events: any[] = [];

  for (const q of (quizEvents || [])) {
    events.push({
      type: 'quiz_complete',
      userId: q.user_id,
      ts: q.ts,
      data: {
        quizId: q.quiz_id,
        tag: q.tag,
        title: q.title,
        total: q.total,
        correct: q.correct,
        rate: q.total > 0 ? q.correct / q.total : 0,
      },
    });
  }

  for (const m of (mgEvents || [])) {
    events.push({
      type: 'memory_game',
      userId: m.user_id,
      ts: m.ts,
      data: {
        gameType: m.game_type,
        total: m.total,
        correct: m.correct,
        accuracy: m.accuracy,
        durationSec: m.duration_sec,
      },
    });
  }

  for (const qc of (quizCreated || [])) {
    const questionIds = JSON.parse(qc.question_ids || '[]');
    events.push({
      type: 'quiz_created',
      userId: qc.user_id,
      ts: qc.ts,
      data: {
        tag: qc.tag,
        title: qc.title,
        count: questionIds.length,
      },
    });
  }

  // Sort desc by ts
  events.sort((a, b) => b.ts - a.ts);

  return new Response(JSON.stringify({ events: events.slice(0, limit) }), { headers: JSON_HEADERS });
};
