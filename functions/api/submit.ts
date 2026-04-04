interface Env {
  DB: D1Database;
  WEBHOOK_URL: string;
  WEBHOOK_TOKEN: string;
  AI_PROXY_KEY: string;
}

// 获取今天的日期（CST）
function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().split('T')[0];
}

// 增加天数
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
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

    // Prevent duplicate submission — if already submitted, return existing results
    const existingSubs = await context.env.DB.prepare(
      'SELECT question_id, answer, correct FROM submissions WHERE user_id = ? AND quiz_id = ?'
    ).bind(userId, quizId).all();

    if (existingSubs.results.length > 0) {
      // Already submitted — return existing results without re-notifying
      const existingResults = existingSubs.results.map((s: any) => ({
        questionId: s.question_id,
        correct: !!s.correct,
        userAnswer: s.answer,
      }));
      const correctCount = existingSubs.results.filter((s: any) => s.correct).length;
      return Response.json({
        success: true,
        duplicate: true,
        results: existingResults,
        score: correctCount,
        total: existingSubs.results.length,
      });
    }

    const results = [];
    let correctCount = 0;
    const today = todayCST();

    for (const ans of answers) {
      const question = await context.env.DB.prepare(
        'SELECT * FROM questions WHERE id = ?'
      ).bind(ans.questionId).first();

      if (!question) continue;

      const qAnswer = JSON.parse(question.answer as string);
      const qContent = JSON.parse(question.content as string);
      let correct = false;
      let correctAnswer = '';
      let aiFeedback = '';
      let aiScore: number | undefined;

      if (question.type === 'choice') {
        if (qAnswer.correctIndex !== undefined) {
          // correctIndex is 0-based → convert to letter (0=A, 1=B, 2=C, 3=D)
          const correctLetter = String.fromCharCode(65 + qAnswer.correctIndex);
          correct = ans.answer?.toUpperCase() === correctLetter;
          correctAnswer = correctLetter;
        } else {
          correct = ans.answer?.toUpperCase() === qAnswer.answer?.toUpperCase();
          correctAnswer = qAnswer.answer || '';
        }
      } else if (question.type === 'blank') {
        const userAns = (ans.answer || '').trim().toLowerCase();
        // qAnswer can be: string "peaceful", object {answers:["peaceful"]}, or "tall as" for multi-blank
        let expectedAnswers: string[] = [];
        if (typeof qAnswer === 'string') {
          expectedAnswers = [qAnswer];
        } else if (Array.isArray(qAnswer)) {
          expectedAnswers = qAnswer;
        } else if (qAnswer.answers) {
          expectedAnswers = Array.isArray(qAnswer.answers) ? qAnswer.answers : [qAnswer.answers];
        }
        // blanks[].accepts for alternative answers
        const accepts = qContent.blanks?.[0]?.accepts;
        const allAccepted = accepts
          ? accepts.map((a: string) => a.toLowerCase())
          : expectedAnswers.map((a: string) => a.toLowerCase());
        correct = allAccepted.some((a: string) => a === userAns);
        correctAnswer = expectedAnswers[0] || '';
      } else if (question.type === 'reading') {
        // answer is array like ["B", "A", "C"], user submits comma-separated "B,A,C"
        const userAnswers = (ans.answer || '').split(',').map((a: string) => a.trim().toUpperCase());
        const expectedAnswers = Array.isArray(qAnswer) ? qAnswer : (qAnswer.answers || []);
        correct = expectedAnswers.length > 0 && expectedAnswers.every((exp: string, i: number) => 
          userAnswers[i]?.toUpperCase() === exp.toUpperCase()
        );
        correctAnswer = expectedAnswers.join(',');
      } else if (question.type === 'rewrite') {
        // AI-powered judging for rewrite questions
        const { judgeRewrite } = await import('../lib/ai-judge');
        const expectedAnswer = typeof qAnswer === 'string' ? qAnswer : (qAnswer.answer || qAnswer.answers?.[0] || '');
        const judgeResult = await judgeRewrite({
          instruction: qContent.stem || qContent.instruction || '请改写下列句子',
          original: qContent.original || '',
          correctAnswer: expectedAnswer,
          studentAnswer: ans.answer || '',
        }, { AI_PROXY_KEY: context.env.AI_PROXY_KEY });

        correct = judgeResult.correct;
        correctAnswer = judgeResult.correctedAnswer || expectedAnswer;
        aiFeedback = judgeResult.feedback;
        aiScore = judgeResult.score;
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
        ...(aiFeedback ? { feedback: aiFeedback } : {}),
        ...(aiScore !== undefined ? { score: aiScore } : {}),
      });

      // 更新知识点掌握记录
      const tags = question.tags ? JSON.parse(question.tags as string) : [];
      if (tags.length > 0) {
        const knowledgePoint = tags[tags.length - 1]; // 最细粒度 tag
        const category = tags[0]; // 顶级分类

        if (!correct) {
          // 错题：更新或插入 mastery 记录
          const existing = await context.env.DB.prepare(
            'SELECT * FROM knowledge_mastery WHERE user_id = ? AND knowledge_point = ?'
          ).bind(userId, knowledgePoint).first();

          if (!existing) {
            // 新知识点，第一次错
            const masteryId = crypto.randomUUID();
            const tomorrow = addDays(today, 1);
            await context.env.DB.prepare(
              'INSERT INTO knowledge_mastery (id, user_id, knowledge_point, category, error_count, correct_streak, interval_days, next_review_at, last_error_at, last_review_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(masteryId, userId, knowledgePoint, category, 1, 0, 1, tomorrow, today, today, Math.floor(Date.now() / 1000)).run();
          } else {
            // 已存在，增加错误计数
            const tomorrow = addDays(today, 1);
            if (existing.mastered === 1) {
              // 之前标记了"我会了"但又错了，重置为未掌握
              await context.env.DB.prepare(
                'UPDATE knowledge_mastery SET mastered = 0, mastered_reason = NULL, error_count = error_count + 1, correct_streak = 0, interval_days = 1, next_review_at = ?, last_error_at = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
              ).bind(tomorrow, today, today, userId, knowledgePoint).run();
            } else {
              // 未掌握状态，继续累计错误
              await context.env.DB.prepare(
                'UPDATE knowledge_mastery SET error_count = error_count + 1, correct_streak = 0, interval_days = 1, next_review_at = ?, last_error_at = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
              ).bind(tomorrow, today, today, userId, knowledgePoint).run();
            }
          }
        } else {
          // 答对了，检查是否有 mastery 记录
          const existing = await context.env.DB.prepare(
            'SELECT * FROM knowledge_mastery WHERE user_id = ? AND knowledge_point = ?'
          ).bind(userId, knowledgePoint).first();

          if (existing) {
            const newStreak = (existing.correct_streak as number) + 1;
            const currentInterval = existing.interval_days as number;

            if (newStreak >= 3 && currentInterval >= 14) {
              // 连对 3 次且间隔 >= 14 天，自动标记为已掌握
              await context.env.DB.prepare(
                'UPDATE knowledge_mastery SET correct_streak = ?, mastered = 1, mastered_reason = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
              ).bind(newStreak, 'auto', today, userId, knowledgePoint).run();
            } else {
              // 增加间隔（最多 30 天）
              const newInterval = Math.min(currentInterval * 2, 30);
              const nextReview = addDays(today, newInterval);
              await context.env.DB.prepare(
                'UPDATE knowledge_mastery SET correct_streak = ?, interval_days = ?, next_review_at = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
              ).bind(newStreak, newInterval, nextReview, today, userId, knowledgePoint).run();
            }
          }
        }
      }
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
          if (qAnswer.correctIndex !== undefined) {
            correctAnswer = String.fromCharCode(65 + qAnswer.correctIndex);
          } else {
            correctAnswer = qAnswer.answer || '';
          }
        } else if (question.type === 'blank') {
          if (typeof qAnswer === 'string') {
            correctAnswer = qAnswer;
          } else if (Array.isArray(qAnswer)) {
            correctAnswer = qAnswer[0] || '';
          } else {
            correctAnswer = qAnswer.answers?.[0] || '';
          }
        } else if (question.type === 'reading') {
          correctAnswer = Array.isArray(qAnswer) ? qAnswer.join(',') : (qAnswer.answers || []).join(',');
        } else if (question.type === 'rewrite') {
          correctAnswer = typeof qAnswer === 'string' ? qAnswer : (qAnswer.answer || qAnswer.answers?.[0] || '');
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
