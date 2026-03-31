// 提交答案 API
import { requireAuth, jsonResponse, errorResponse } from '../middleware/auth';
import {
  createSubmission,
  getQuestions,
  getSubmissions,
  type Env,
  type Question,
} from '../lib/db';

// 判分函数
function gradeAnswer(question: Question, userAnswer: any): { correct: boolean; score: number; feedback?: string } {
  const content = JSON.parse(question.content);
  const answer = JSON.parse(question.answer);

  if (question.type === 'choice') {
    // 选择题：精确匹配
    const correct = userAnswer === answer;
    return { correct, score: correct ? 1 : 0 };
  }

  if (question.type === 'blank') {
    // 填空题：支持多个答案
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const correctAnswers = content.blanks || [];

    let correctCount = 0;
    for (let i = 0; i < correctAnswers.length; i++) {
      const blank = correctAnswers[i];
      const accepts = blank.accepts || [answer];
      const userAns = (userAnswers[i] || '').trim().toLowerCase();

      if (accepts.some((a: string) => a.toLowerCase() === userAns)) {
        correctCount++;
      }
    }

    const score = correctCount / correctAnswers.length;
    return { correct: score === 1, score };
  }

  if (question.type === 'rewrite') {
    // 改写题：暂时使用简单的文本匹配，后续接入 AI 判分
    const userText = (userAnswer || '').trim().toLowerCase();
    const correctText = (answer || '').trim().toLowerCase();
    const correct = userText === correctText;
    return { correct, score: correct ? 1 : 0, feedback: 'AI 判分功能即将上线' };
  }

  if (question.type === 'card') {
    // 卡片题：只记录"记住了/没记住"
    const correct = userAnswer === true || userAnswer === 'remembered';
    return { correct, score: correct ? 1 : 0 };
  }

  return { correct: false, score: 0 };
}

// POST /api/submit - 提交答案
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // 验证用户认证
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { quizId, answers } = body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return errorResponse('Missing required fields: quizId, answers');
    }

    // 检查是否已提交
    const existingSubmissions = await getSubmissions(env.DB, quizId);
    if (existingSubmissions.length > 0) {
      return errorResponse('Quiz already submitted', 400);
    }

    // 获取所有题目
    const questionIds = answers.map((a) => a.questionId);
    const questions = await getQuestions(env.DB, questionIds);

    // 建立题目 ID 到题目的映射
    const questionMap = new Map<string, Question>();
    questions.forEach((q) => questionMap.set(q.id, q));

    // 判分
    const results = [];
    let totalScore = 0;
    let totalQuestions = answers.length;

    for (const answerItem of answers) {
      const { questionId, answer: userAnswer } = answerItem;
      const question = questionMap.get(questionId);

      if (!question) {
        return errorResponse(`Question not found: ${questionId}`, 404);
      }

      const gradeResult = gradeAnswer(question, userAnswer);
      totalScore += gradeResult.score;

      // 保存提交记录
      await createSubmission(env.DB, {
        user_id: auth.userId,
        question_id: questionId,
        quiz_id: quizId,
        answer: JSON.stringify(userAnswer),
        correct: gradeResult.correct ? 1 : 0,
        score: gradeResult.score,
        ai_feedback: gradeResult.feedback || null,
      });

      results.push({
        questionId,
        correct: gradeResult.correct,
        score: gradeResult.score,
        correctAnswer: JSON.parse(question.answer),
        explanation: question.explanation,
        feedback: gradeResult.feedback,
      });
    }

    return jsonResponse({
      success: true,
      score: Math.round(totalScore),
      total: totalQuestions,
      percentage: Math.round((totalScore / totalQuestions) * 100),
      results,
    });
  } catch (error) {
    console.error('Error submitting answers:', error);
    return errorResponse('Failed to submit answers', 500);
  }
}

// OPTIONS 处理
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
