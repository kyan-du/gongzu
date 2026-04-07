interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

// GET /api/status?userId=cyan&date=2026-04-01
// Returns completion status for a user on a given date (or all dates)
// Auth: API key (for bot/cron) OR session cookie (for parent dashboard)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const date = url.searchParams.get('date');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch quizzes
    let quizQuery = 'SELECT * FROM daily_quizzes WHERE user_id = ?';
    const quizParams: any[] = [userId];
    if (date) {
      quizQuery += ' AND date = ?';
      quizParams.push(date);
    }
    quizQuery += ' ORDER BY date DESC LIMIT 30';

    const quizzes = await context.env.DB.prepare(quizQuery).bind(...quizParams).all();

    const results = [];
    for (const quiz of quizzes.results) {
      const questionIds = JSON.parse(quiz.question_ids as string);

      // Count submissions for this quiz
      const submissions = await context.env.DB.prepare(
        'SELECT question_id, correct, score FROM submissions WHERE user_id = ? AND quiz_id = ?'
      ).bind(userId, quiz.id).all();

      const submittedSet = new Set(submissions.results.map((s: any) => s.question_id));
      const correctCount = submissions.results.filter((s: any) => s.correct === 1).length;

      // Memory game quizzes store actual accuracy in score field (not just 0/1 correct)
      const isMemoryGame = (quiz.tag as string).startsWith('记忆·');
      let quizAccuracy: number | null = null;
      if (submittedSet.size > 0) {
        if (isMemoryGame && submissions.results.length > 0) {
          // Use the stored score directly (it's the real accuracy percentage)
          quizAccuracy = (submissions.results[0] as any).score ?? 0;
        } else {
          quizAccuracy = Math.round((correctCount / submittedSet.size) * 100);
        }
      }

      results.push({
        quizId: quiz.id,
        date: quiz.date,
        tag: quiz.tag,
        title: quiz.title,
        totalQuestions: questionIds.length,
        answered: submittedSet.size,
        correct: correctCount,
        completed: submittedSet.size >= questionIds.length,
        accuracy: quizAccuracy,
      });
    }

    const allCompleted = results.length > 0 && results.every(r => r.completed);
    const totalAnswered = results.reduce((s, r) => s + r.answered, 0);
    const totalQuestions = results.reduce((s, r) => s + r.totalQuestions, 0);
    const totalCorrect = results.reduce((s, r) => s + r.correct, 0);

    return new Response(JSON.stringify({
      userId,
      date: date || 'all',
      summary: {
        quizCount: results.length,
        totalQuestions,
        totalAnswered,
        totalCorrect,
        allCompleted,
        accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null,
      },
      quizzes: results,
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
