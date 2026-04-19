import type { Env } from '../../lib/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// POST /api/memory-game/exam
// Submit memory game exam results — marks a memory game quiz as completed
// Body: { userId, quizId, total, correct, accuracy, durationSec?, detail? }
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { userId, quizId, total, correct, accuracy, durationSec, detail } = body;

    if (!userId || !quizId || total == null || correct == null) {
      return new Response(JSON.stringify({ error: 'userId, quizId, total, correct required' }), {
        status: 400, headers: JSON_HEADERS,
      });
    }

    // Verify the quiz exists and belongs to this user
    const quiz = await context.env.DB.prepare(
      'SELECT id, user_id, date, tag, question_ids FROM daily_quizzes WHERE id = ? AND user_id = ?'
    ).bind(quizId, userId).first<any>();

    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404, headers: JSON_HEADERS,
      });
    }

    // Check if already submitted
    const existing = await context.env.DB.prepare(
      'SELECT id FROM submissions WHERE user_id = ? AND quiz_id = ?'
    ).bind(userId, quizId).first();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, alreadySubmitted: true }), {
        headers: JSON_HEADERS,
      });
    }

    // Get the virtual question id from question_ids
    const questionIds: string[] = JSON.parse(quiz.question_ids);
    const questionId = questionIds[0]; // e.g. "__memory_matryoshka__" or actual question id

    // Create submission
    const subId = crypto.randomUUID();
    const isCorrect = (accuracy ?? (correct / total * 100)) >= 50 ? 1 : 0;
    const answerData = JSON.stringify({ total, correct, accuracy, durationSec, detail });

    await context.env.DB.prepare(
      'INSERT INTO submissions (id, user_id, question_id, quiz_id, answer, correct, score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(subId, userId, questionId, quizId, answerData, isCorrect, accuracy ?? Math.round(correct / total * 100), Date.now()).run();

    // Also record in memory_games table for monthly stats
    const gameType = quiz.tag === '记忆·套娃' ? 'matryoshka' : 'grid';
    const mgId = crypto.randomUUID();
    await context.env.DB.prepare(
      'INSERT INTO memory_games (id, user_id, game_type, date, total, correct, accuracy, duration_sec, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())'
    ).bind(mgId, userId, gameType, quiz.date, total, correct, accuracy ?? Math.round(correct / total * 100), durationSec ?? null, detail ? JSON.stringify(detail) : null).run();

    return new Response(JSON.stringify({ ok: true, submissionId: subId }), {
      status: 201, headers: JSON_HEADERS,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: JSON_HEADERS,
    });
  }
};

// GET /api/memory-game/exam?userId=xxx&quizId=xxx
// Check if a memory game exam has been submitted
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const quizId = url.searchParams.get('quizId');

    if (!userId || !quizId) {
      return new Response(JSON.stringify({ error: 'userId and quizId required' }), {
        status: 400, headers: JSON_HEADERS,
      });
    }

    const sub = await context.env.DB.prepare(
      'SELECT id, answer, correct, score, submitted_at FROM submissions WHERE user_id = ? AND quiz_id = ?'
    ).bind(userId, quizId).first<any>();

    if (!sub) {
      return new Response(JSON.stringify({ submitted: false }), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({
      submitted: true,
      submissionId: sub.id,
      answer: JSON.parse(sub.answer),
      correct: sub.correct === 1,
      score: sub.score,
      submittedAt: sub.submitted_at,
    }), { headers: JSON_HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: JSON_HEADERS,
    });
  }
};
