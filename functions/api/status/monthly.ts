import type { Env } from '../../lib/env';

interface DayStats {
  quizCount: number;
  completedCount: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  reviewDue: number;
  reviewDone: number;
  memoryGames: number;
  memoryGamesTarget: number;
  memoryTotal: number;
  memoryCorrect: number;
  memoryMatryoshka: number;
  memoryGrid: number;
}

// GET /api/status/monthly?userId=cyan&month=2026-04
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const month = url.searchParams.get('month');

    if (!userId || !month) {
      return Response.json({ error: 'userId and month required' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 });
    }

    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // 1. Fetch all quizzes for this month
    const quizzes = await context.env.DB.prepare(
      'SELECT id, date, question_ids FROM daily_quizzes WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date'
    ).bind(userId, startDate, endDate).all();

    // 2. Batch fetch all submissions for this user in the date range
    const quizIds = quizzes.results.map(q => q.id as string);
    let submissionsByQuiz: Record<string, { question_id: string; correct: number }[]> = {};

    if (quizIds.length > 0) {
      // D1 doesn't support large IN lists well, batch in chunks of 50
      for (let i = 0; i < quizIds.length; i += 50) {
        const chunk = quizIds.slice(i, i + 50);
        const placeholders = chunk.map(() => '?').join(',');
        const subs = await context.env.DB.prepare(
          `SELECT quiz_id, question_id, correct FROM submissions WHERE user_id = ? AND quiz_id IN (${placeholders})`
        ).bind(userId, ...chunk).all();
        for (const s of subs.results) {
          const qid = s.quiz_id as string;
          if (!submissionsByQuiz[qid]) submissionsByQuiz[qid] = [];
          submissionsByQuiz[qid].push({ question_id: s.question_id as string, correct: s.correct as number });
        }
      }
    }

    // 3. Aggregate by date
    const days: Record<string, DayStats> = {};

    for (const quiz of quizzes.results) {
      const date = quiz.date as string;
      const questionIds: string[] = JSON.parse(quiz.question_ids as string);
      const subs = submissionsByQuiz[quiz.id as string] || [];
      const submittedSet = new Set(subs.map(s => s.question_id));
      const correctCount = subs.filter(s => s.correct === 1).length;
      const completed = submittedSet.size >= questionIds.length;

      if (!days[date]) {
        days[date] = { quizCount: 0, completedCount: 0, totalQuestions: 0, answeredQuestions: 0, correctAnswers: 0, reviewDue: 0, reviewDone: 0, memoryGames: 0, memoryGamesTarget: 5, memoryTotal: 0, memoryCorrect: 0, memoryMatryoshka: 0, memoryGrid: 0 };
      }
      days[date].quizCount += 1;
      if (completed) days[date].completedCount += 1;
      days[date].totalQuestions += questionIds.length;
      days[date].answeredQuestions += submittedSet.size;
      days[date].correctAnswers += correctCount;
    }

    // 4. Fetch review data for the month (knowledge_mastery next_review_at in range)
    const reviews = await context.env.DB.prepare(
      `SELECT next_review_at, last_review_at FROM knowledge_mastery 
       WHERE user_id = ? AND next_review_at >= ? AND next_review_at <= ? AND mastered = 0`
    ).bind(userId, startDate, endDate).all();

    for (const r of reviews.results) {
      const dueDate = (r.next_review_at as string).slice(0, 10);
      if (!days[dueDate]) {
        days[dueDate] = { quizCount: 0, completedCount: 0, totalQuestions: 0, answeredQuestions: 0, correctAnswers: 0, reviewDue: 0, reviewDone: 0, memoryGames: 0, memoryGamesTarget: 5, memoryTotal: 0, memoryCorrect: 0, memoryMatryoshka: 0, memoryGrid: 0 };
      }
      days[dueDate].reviewDue += 1;
      // If last_review_at >= next_review_at, it was reviewed
      if (r.last_review_at && r.last_review_at >= (r.next_review_at as string)) {
        days[dueDate].reviewDone += 1;
      }
    }

    // 5. Fetch memory game data for the month
    const memGames = await context.env.DB.prepare(
      `SELECT date, game_type, COUNT(*) as cnt, SUM(total) as total_cards, SUM(correct) as correct_cards FROM memory_games WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY date, game_type`
    ).bind(userId, startDate, endDate).all();

    for (const mg of memGames.results) {
      const date = mg.date as string;
      const gameType = mg.game_type as string;
      if (!days[date]) {
        days[date] = { quizCount: 0, completedCount: 0, totalQuestions: 0, answeredQuestions: 0, correctAnswers: 0, reviewDue: 0, reviewDone: 0, memoryGames: 0, memoryGamesTarget: 5, memoryTotal: 0, memoryCorrect: 0, memoryMatryoshka: 0, memoryGrid: 0 };
      }
      const cnt = mg.cnt as number;
      days[date].memoryGames += cnt;
      days[date].memoryTotal += (mg.total_cards as number) || 0;
      days[date].memoryCorrect += (mg.correct_cards as number) || 0;

      // 分别统计套娃和宫格
      if (gameType === 'matryoshka') {
        days[date].memoryMatryoshka = cnt;
      } else if (gameType === 'grid') {
        days[date].memoryGrid = cnt;
      }
    }

    // 6. Streak calculation
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    const checkDate = new Date(today + 'T00:00:00');
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const d = days[dateStr];
      if (d && ((d.quizCount > 0 && d.completedCount === d.quizCount) || (d.memoryGames >= d.memoryGamesTarget))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return Response.json({ userId, month, days, streak });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};
