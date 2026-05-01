import type { Env } from '../lib/env';
import { gradeChoice } from '../lib/graders/choice';
import { gradeBlank } from '../lib/graders/blank';
import { gradeReading } from '../lib/graders/reading';
import { gradeRewrite } from '../lib/graders/rewrite';
import { gradeProof } from '../lib/graders/proof';
import { gradeJudgment } from '../lib/graders/judgment';

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

    // Batch-load questions instead of doing one D1 SELECT per answer.
    const questionIds = answers.map((a: any) => a.questionId).filter(Boolean);
    const placeholders = questionIds.map(() => '?').join(',');
    const questionsResult = await context.env.DB.prepare(
      `SELECT * FROM questions WHERE id IN (${placeholders})`
    ).bind(...questionIds).all();
    const questionMap = new Map((questionsResult.results || []).map((q: any) => [q.id, q]));

    type MasteryAction = {
      userId: string;
      knowledgePoint: string;
      category: string;
      correct: boolean;
    };
    const masteryActions: MasteryAction[] = [];
    const submissionStmts: D1PreparedStatement[] = [];

    for (const ans of answers) {
      const question = questionMap.get(ans.questionId) as any;
      if (!question) continue;

      const qAnswer = JSON.parse(question.answer as string);
      const qContent = JSON.parse(question.content as string);
      let correct = false;
      let correctAnswer = '';
      let aiFeedback = '';
      let aiScore: number | undefined;

      if (question.type === 'choice') {
        const result = gradeChoice(qAnswer, ans.answer);
        correct = result.correct;
        correctAnswer = result.correctAnswer;
      } else if (question.type === 'blank') {
        const result = gradeBlank(qAnswer, qContent, ans.answer);
        correct = result.correct;
        correctAnswer = result.correctAnswer;
      } else if (question.type === 'reading') {
        const result = gradeReading(qAnswer, ans.answer);
        correct = result.correct;
        correctAnswer = result.correctAnswer;
      } else if (question.type === 'rewrite') {
        const result = await gradeRewrite(qAnswer, qContent, ans.answer, context.env);
        correct = result.correct;
        correctAnswer = result.correctAnswer;
        aiFeedback = result.aiFeedback;
        aiScore = result.aiScore;
      } else if (question.type === 'proof') {
        const result = await gradeProof(qAnswer, qContent, ans.answer, context.env);
        correct = result.correct;
        correctAnswer = result.correctAnswer;
        aiFeedback = result.aiFeedback;
        aiScore = result.aiScore;
      } else if (question.type === 'judgment') {
        const result = gradeJudgment(qAnswer, ans.answer);
        correct = result.correct;
        correctAnswer = result.correctAnswer;
      }

      if (correct) correctCount++;

      const submissionId = crypto.randomUUID();
      submissionStmts.push(context.env.DB.prepare(
        'INSERT INTO submissions (id, user_id, question_id, quiz_id, answer, correct, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(submissionId, userId, ans.questionId, quizId, ans.answer || '', correct ? 1 : 0, Date.now()));

      results.push({
        questionId: ans.questionId,
        correct,
        userAnswer: ans.answer,
        correctAnswer,
        explanation: question.explanation,
        ...(aiFeedback ? { feedback: aiFeedback } : {}),
        ...(aiScore !== undefined ? { score: aiScore } : {}),
      });

      const tags = question.tags ? JSON.parse(question.tags as string) : [];
      if (tags.length > 0) {
        masteryActions.push({
          userId,
          knowledgePoint: tags[tags.length - 1],
          category: tags[0],
          correct,
        });
      }
    }

    if (submissionStmts.length > 0) {
      await context.env.DB.batch(submissionStmts);
    }

    // Batch knowledge mastery lookups/updates. This used to do 1-2 D1 round trips per question.
    const uniquePoints = Array.from(new Set(masteryActions.map(a => a.knowledgePoint)));
    const existingMastery = new Map<string, any>();
    if (uniquePoints.length > 0) {
      const masteryPlaceholders = uniquePoints.map(() => '?').join(',');
      const rows = await context.env.DB.prepare(
        `SELECT * FROM knowledge_mastery WHERE user_id = ? AND knowledge_point IN (${masteryPlaceholders})`
      ).bind(userId, ...uniquePoints).all();
      for (const row of rows.results || []) existingMastery.set(row.knowledge_point as string, row);
    }

    const masteryStmts: D1PreparedStatement[] = [];
    for (const action of masteryActions) {
      const { knowledgePoint, category, correct } = action;
      const existing = existingMastery.get(knowledgePoint);

      if (!correct) {
        const tomorrow = addDays(today, 1);
        if (!existing) {
          const masteryId = crypto.randomUUID();
          masteryStmts.push(context.env.DB.prepare(
            'INSERT INTO knowledge_mastery (id, user_id, knowledge_point, category, error_count, correct_streak, interval_days, next_review_at, last_error_at, last_review_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(masteryId, userId, knowledgePoint, category, 1, 0, 1, tomorrow, today, today, Math.floor(Date.now() / 1000)));
          existingMastery.set(knowledgePoint, { knowledge_point: knowledgePoint, error_count: 1, correct_streak: 0, interval_days: 1, mastered: 0 });
        } else if (existing.mastered === 1) {
          masteryStmts.push(context.env.DB.prepare(
            'UPDATE knowledge_mastery SET mastered = 0, mastered_reason = NULL, error_count = error_count + 1, correct_streak = 0, interval_days = 1, next_review_at = ?, last_error_at = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
          ).bind(tomorrow, today, today, userId, knowledgePoint));
        } else {
          masteryStmts.push(context.env.DB.prepare(
            'UPDATE knowledge_mastery SET error_count = error_count + 1, correct_streak = 0, interval_days = 1, next_review_at = ?, last_error_at = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
          ).bind(tomorrow, today, today, userId, knowledgePoint));
        }
      } else if (existing) {
        const newStreak = (existing.correct_streak as number) + 1;
        const currentInterval = existing.interval_days as number;

        if (newStreak >= 3 && currentInterval >= 14) {
          masteryStmts.push(context.env.DB.prepare(
            'UPDATE knowledge_mastery SET correct_streak = ?, mastered = 1, mastered_reason = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
          ).bind(newStreak, 'auto', today, userId, knowledgePoint));
        } else {
          const newInterval = Math.min(currentInterval * 2, 30);
          const nextReview = addDays(today, newInterval);
          masteryStmts.push(context.env.DB.prepare(
            'UPDATE knowledge_mastery SET correct_streak = ?, interval_days = ?, next_review_at = ?, last_review_at = ? WHERE user_id = ? AND knowledge_point = ?'
          ).bind(newStreak, newInterval, nextReview, today, userId, knowledgePoint));
        }
      }
    }

    if (masteryStmts.length > 0) {
      await context.env.DB.batch(masteryStmts);
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
            message: `拱卒提交通知：${displayName}完成了「${tag}」练习，正确率 ${accuracy}%（${correctCount}/${answers.length}）。请用自然语言鼓励一下孩子，不要照搬原文。`,
            name: 'GongZu',
            deliver: true,
            channel: 'wechat',
            to: '34438530917@chatroom',
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
          } else if (Array.isArray(qAnswer.blanks) && qAnswer.blanks.length > 0) {
            correctAnswer = qAnswer.blanks.map((b: any) => typeof b === 'string' ? b : ((b.accepts || [])[0] || b.answer || '')).join('\n');
          } else {
            correctAnswer = Array.isArray(qAnswer.answers) ? qAnswer.answers.join('\n') : (qAnswer.answers || '');
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
