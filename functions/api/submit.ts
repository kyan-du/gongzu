interface Env {
  DB: D1Database;
  WEBHOOK_URL: string;    // https://hooks.visionclaw.online/hooks/agent
  WEBHOOK_TOKEN: string;  // OpenClaw hooks token
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

    // Fire webhook notification (best-effort, don't block response)
    const webhookUrl = context.env.WEBHOOK_URL;
    const webhookToken = context.env.WEBHOOK_TOKEN;
    if (webhookUrl && webhookToken) {
      // Fetch quiz tag for notification
      const quizRow = await context.env.DB.prepare(
        'SELECT tag FROM daily_quizzes WHERE id = ?'
      ).bind(quizId).first();
      const tag = (quizRow?.tag as string) || quizId;
      const accuracy = Math.round((correctCount / answers.length) * 100);

      const nameMap: Record<string, string> = { cyan: '彤彤', ryan: '可可' };
      const displayName = nameMap[userId] || userId;

      context.waitUntil(
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${webhookToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `拱卒提交通知：${displayName}完成了「${tag}」练习，正确率 ${accuracy}%（${correctCount}/${answers.length}）。请把这条消息转发到微信群「日拱一卒功不唐捐」(34438530917@chatroom)，用自然语言鼓励一下孩子，不要照搬原文。`,
            name: 'GongZu',
            deliver: true,
            channel: 'telegram',
            to: '7958430491',
          }),
        }).catch(() => {})  // silently ignore webhook errors
      );
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


// GET /api/submit?userId=cyan&quizId=xxx - check existing submissions
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const quizId = url.searchParams.get('quizId');

    if (!userId || !quizId) {
      return new Response(JSON.stringify({ error: 'userId and quizId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const submissions = await context.env.DB.prepare(
      'SELECT question_id, answer, correct FROM submissions WHERE user_id = ? AND quiz_id = ?'
    ).bind(userId, quizId).all();

    if (submissions.results.length === 0) {
      return new Response(JSON.stringify({ submitted: false, results: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Also fetch questions to build full results
    const quiz = await context.env.DB.prepare(
      'SELECT * FROM daily_quizzes WHERE id = ?'
    ).bind(quizId).first();

    if (!quiz) {
      return new Response(JSON.stringify({ submitted: false, results: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const questionIds = JSON.parse(quiz.question_ids as string);
    const results = [];

    for (const sub of submissions.results) {
      const question = await context.env.DB.prepare(
        'SELECT * FROM questions WHERE id = ?'
      ).bind(sub.question_id).first();

      if (question) {
        const qAnswer = JSON.parse(question.answer as string);
        let correctAnswer = '';
        if (question.type === 'choice') {
          correctAnswer = qAnswer.answer || '';
        } else if (question.type === 'blank') {
          correctAnswer = qAnswer.answers?.[0] || '';
        } else if (question.type === 'reading') {
          correctAnswer = Array.isArray(qAnswer) ? qAnswer.join(',') : (qAnswer.answers || []).join(',');
        }

        results.push({
          questionId: sub.question_id,
          answer: sub.answer,
          correct: sub.correct === 1,
          correctAnswer,
        });
      }
    }

    const correctCount = results.filter(r => r.correct).length;

    return new Response(JSON.stringify({
      submitted: true,
      total: questionIds.length,
      correct: correctCount,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
