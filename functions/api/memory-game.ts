import type { EventContext } from '@cloudflare/workers-types';
import type { Env } from '../lib/env';

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

  // 读用户配置的 dailyTarget
  const modRow = await context.env.DB.prepare(
    `SELECT daily_target FROM user_modules WHERE user_id = ? AND module = 'memory_game'`
  ).bind(userId).first<{ daily_target: number | null }>();
  const dailyTarget = modRow?.daily_target || 5;

  const allGames = games.results || [];
  const completed = allGames.length;
  // 准确率只算前 N 轮（N = dailyTarget），完成任务后继续玩不影响成绩
  const scoredGames = allGames.slice(0, dailyTarget);
  const avgAccuracy = scoredGames.length > 0
    ? Math.round(scoredGames.reduce((sum: number, g: any) => sum + g.accuracy, 0) / scoredGames.length * 100) / 100
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
