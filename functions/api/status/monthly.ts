interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

// GET /api/status/monthly?userId=cyan&month=2026-04
// Returns monthly summary with daily completion status
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const month = url.searchParams.get('month');

    if (!userId || !month) {
      return new Response(JSON.stringify({ error: 'userId and month required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return new Response(JSON.stringify({ error: 'Invalid month format. Use YYYY-MM' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all quizzes for this month
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const quizzes = await context.env.DB.prepare(
      'SELECT * FROM daily_quizzes WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date'
    ).bind(userId, startDate, endDate).all();

    // Group quizzes by date
    const dailyData: Record<string, { quizCount: number; allCompleted: boolean; accuracy: number | null }> = {};

    for (const quiz of quizzes.results) {
      const date = quiz.date as string;
      const questionIds = JSON.parse(quiz.question_ids as string);

      // Get submissions for this quiz
      const submissions = await context.env.DB.prepare(
        'SELECT question_id, correct FROM submissions WHERE user_id = ? AND quiz_id = ?'
      ).bind(userId, quiz.id).all();

      const submittedSet = new Set(submissions.results.map((s: any) => s.question_id));
      const correctCount = submissions.results.filter((s: any) => s.correct === 1).length;
      const completed = submittedSet.size >= questionIds.length;
      const accuracy = submittedSet.size > 0 ? Math.round((correctCount / submittedSet.size) * 100) : null;

      if (!dailyData[date]) {
        dailyData[date] = {
          quizCount: 0,
          allCompleted: true,
          accuracy: null,
        };
      }

      dailyData[date].quizCount += 1;
      if (!completed) {
        dailyData[date].allCompleted = false;
      }

      // Average accuracy for the day
      if (accuracy !== null) {
        if (dailyData[date].accuracy === null) {
          dailyData[date].accuracy = accuracy;
        } else {
          // Calculate running average
          dailyData[date].accuracy = Math.round(
            (dailyData[date].accuracy! * (dailyData[date].quizCount - 1) + accuracy) / dailyData[date].quizCount
          );
        }
      }
    }

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let checkDate = new Date(today);

    // Check from today backwards
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayData = dailyData[dateStr];

      if (dayData && dayData.allCompleted && (dayData.accuracy === null || dayData.accuracy >= 80)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return new Response(JSON.stringify({
      userId,
      month,
      days: dailyData,
      streak,
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
