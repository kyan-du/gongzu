// 出题和查询 API
import {
  requireApiKey,
  jsonResponse,
  errorResponse,
  requireAuth,
} from '../middleware/auth';
import {
  createDailyQuiz,
  createQuestion,
  getDailyQuizzes,
  getQuestions,
  type Env,
  type Question,
} from '../lib/db';

// POST /api/quiz - 创建每日作业（需要 API Key）
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // 验证 API Key
  const authError = await requireApiKey(request, env);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { userId, date, tag, title, questions } = body;

    if (!userId || !date || !tag || !questions || !Array.isArray(questions)) {
      return errorResponse('Missing required fields: userId, date, tag, questions');
    }

    // 创建题目
    const questionIds: string[] = [];
    for (const q of questions) {
      if (!q.type || !q.content || !q.answer) {
        return errorResponse('Each question must have type, content, and answer');
      }

      const questionId = await createQuestion(env.DB, {
        type: q.type,
        content: JSON.stringify(q.content),
        answer: JSON.stringify(q.answer),
        explanation: q.explanation || null,
        tags: q.tags ? JSON.stringify(q.tags) : null,
        difficulty: q.difficulty || 3,
      });

      questionIds.push(questionId);
    }

    // 创建每日作业
    const quizId = await createDailyQuiz(env.DB, {
      user_id: userId,
      date,
      tag,
      title: title || null,
      question_ids: JSON.stringify(questionIds),
    });

    return jsonResponse(
      {
        success: true,
        quizId,
        questionCount: questionIds.length,
        url: `https://gongzu.pages.dev/${userId}/quiz/${date}/${encodeURIComponent(tag)}`,
      },
      201
    );
  } catch (error) {
    console.error('Error creating quiz:', error);
    return errorResponse('Failed to create quiz', 500);
  }
}

// GET /api/quiz - 查询作业
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // 验证用户认证
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || auth.userId;
    const date = url.searchParams.get('date') || undefined;

    // 获取作业列表
    const quizzes = await getDailyQuizzes(env.DB, userId, date);

    // 获取每个作业的题目详情
    const result = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionIds = JSON.parse(quiz.question_ids);
        const questions = await getQuestions(env.DB, questionIds);

        return {
          id: quiz.id,
          userId: quiz.user_id,
          date: quiz.date,
          tag: quiz.tag,
          title: quiz.title,
          questions: questions.map((q) => ({
            id: q.id,
            type: q.type,
            content: JSON.parse(q.content),
            answer: JSON.parse(q.answer),
            explanation: q.explanation,
            tags: q.tags ? JSON.parse(q.tags) : null,
            difficulty: q.difficulty,
          })),
        };
      })
    );

    return jsonResponse({ success: true, quizzes: result });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return errorResponse('Failed to fetch quizzes', 500);
  }
}

// OPTIONS 处理
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
