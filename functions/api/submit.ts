interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { userId, quizId, answers } = body;

    if (!userId || !quizId || !answers?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    let correctCount = 0;

    for (const ans of answers) {
      const question = await context.env.DB.prepare(
        'SELECT * FROM questions WHERE id = ?'
      ).bind(ans.questionId).first();

      if (!question) continue;

      const qAnswer = JSON.parse(question.answer as string);
      const qContent = JSON.parse(question.content as string);
      let correct = false;

      let correctAnswer = '';

      if (question.type === 'choice') {
        correct = ans.answer?.toUpperCase() === qAnswer.answer?.toUpperCase();
        correctAnswer = qAnswer.answer || '';
      } else if (question.type === 'blank') {
        const userAns = (ans.answer || '').trim().toLowerCase();
        const accepts = qContent.blanks?.[0]?.accepts || [qAnswer.answers?.[0]];
        correct = accepts.some((a: string) => a.toLowerCase() === userAns);
        correctAnswer = qAnswer.answers?.[0] || '';
      } else if (question.type === 'reading') {
        // answer is array like ["B", "A", "C"], user submits comma-separated "B,A,C"
        const userAnswers = (ans.answer || '').split(',').map((a: string) => a.trim().toUpperCase());
        const expectedAnswers = Array.isArray(qAnswer) ? qAnswer : (qAnswer.answers || []);
        correct = expectedAnswers.length > 0 && expectedAnswers.every((exp: string, i: number) => 
          userAnswers[i]?.toUpperCase() === exp.toUpperCase()
        );
        correctAnswer = expectedAnswers.join(',');
      }

      if (correct) correctCount++;

      const submissionId = crypto.randomUUID();
      await context.env.DB.prepare(
        'INSERT INTO submissions (id, user_id, question_id, quiz_id, answer, correct, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(submissionId, userId, ans.questionId, quizId, ans.answer || '', correct ? 1 : 0, Date.now()).run();

      results.push({
        questionId: ans.questionId,
        correct,
        userAnswer: ans.answer,
        correctAnswer,
        explanation: question.explanation,
      });
    }

    return new Response(JSON.stringify({
      score: correctCount,
      total: answers.length,
      results,
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
