import type { EventContext } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const date = url.searchParams.get('date');
  const gameType = url.searchParams.get('type') || 'matryoshka';

  if (!userId || !date) {
    return Response.json({ error: 'userId and date required' }, { status: 400 });
  }

  // 查询今日完成次数和成绩
  const games = await context.env.DB.prepare(
    `SELECT id, correct, total, accuracy, duration_sec, created_at
     FROM memory_games
     WHERE user_id = ? AND date = ? AND game_type = ?
     ORDER BY created_at ASC`
  ).bind(userId, date, gameType).all();

  const dailyTarget = 5;
  const completed = games.results?.length || 0;
  const avgAccuracy = completed > 0
    ? Math.round((games.results || []).reduce((sum: number, g: any) => sum + g.accuracy, 0) / completed)
    : 0;

  return Response.json({
    userId,
    date,
    gameType,
    completed,
    dailyTarget,
    avgAccuracy,
    games: games.results || [],
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body: any = await context.request.json();
  const { userId, date, gameType = 'matryoshka', total, correct, accuracy, durationSec, detail } = body;

  if (!userId || !date || total == null || correct == null || accuracy == null) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const id = crypto.randomUUID();

  await context.env.DB.prepare(
    `INSERT INTO memory_games (id, user_id, game_type, date, total, correct, accuracy, duration_sec, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, userId, gameType, date, total, correct, accuracy, durationSec || null, detail ? JSON.stringify(detail) : null).run();

  // 查询更新后的今日进度
  const count = await context.env.DB.prepare(
    `SELECT COUNT(*) as c FROM memory_games WHERE user_id = ? AND date = ? AND game_type = ?`
  ).bind(userId, date, gameType).first<{ c: number }>();

  return Response.json({
    id,
    completed: count?.c || 1,
    dailyTarget: 5,
  });
};
