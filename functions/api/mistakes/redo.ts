interface Env {
  DB: D1Database;
}

function todayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().split('T')[0];
}

// POST /api/mistakes/redo
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { userId, count = 5 } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 0. 每日上限检查：最多1个错题重做
    const date = todayCST();
    const existingRedo = await context.env.DB.prepare(
      "SELECT COUNT(*) as cnt FROM daily_quizzes WHERE user_id = ? AND date = ? AND tag LIKE '错题重做%'"
    ).bind(userId, date).first();
    if ((existingRedo?.cnt as number) > 0) {
      return new Response(JSON.stringify({ error: '今日已有错题重做，每天最多重做一次' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. 从 knowledge_mastery 查 mastered=0 的知识点，按 error_count DESC 排序
    const masteryQuery = `
      SELECT id, knowledge_point, category
      FROM knowledge_mastery
      WHERE user_id = ? AND mastered = 0
      ORDER BY error_count DESC, last_error_at DESC
      LIMIT ?
    `;

    const masteryResult = await context.env.DB.prepare(masteryQuery).bind(userId, count).all();
    const knowledgePoints = masteryResult.results || [];

    if (knowledgePoints.length === 0) {
      return new Response(JSON.stringify({ error: 'No knowledge points to review' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. 对每个知识点，从 submissions JOIN questions 查一道该知识点的错题
    const selectedQuestions: any[] = [];
    
    for (const kp of knowledgePoints) {
      const knowledgePoint = kp.knowledge_point as string;
      const category = kp.category as string | null;

      // Query wrong submissions for this knowledge point
      const submissionQuery = `
        SELECT DISTINCT q.id, q.type, q.content, q.answer, q.explanation, q.tags, q.difficulty
        FROM submissions s
        INNER JOIN questions q ON s.question_id = q.id
        WHERE s.user_id = ? AND s.correct = 0
        ORDER BY s.submitted_at DESC
      `;

      const submissionResult = await context.env.DB.prepare(submissionQuery).bind(userId).all();

      // Find a question that matches this knowledge point
      let foundQuestion = null;
      for (const row of submissionResult.results) {
        const tags = row.tags ? JSON.parse(row.tags as string) : [];
        // Match: exact knowledge_point in tags, OR fallback to category match
        const matches = tags.includes(knowledgePoint) || (category && (tags.includes(category) || tags.some((t: string) => category.includes(t))));
        if (matches) {
          foundQuestion = {
            id: row.id,
            type: row.type,
            content: JSON.parse(row.content as string),
            answer: JSON.parse(row.answer as string),
            explanation: row.explanation,
            tags: tags,
            difficulty: row.difficulty,
          };
          break;
        }
      }

      if (foundQuestion) {
        selectedQuestions.push(foundQuestion);
      }
    }

    if (selectedQuestions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions found for review' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. 创建一个临时 quiz 结构，同时写入 daily_quizzes + questions 表
    const quizId = crypto.randomUUID();
    const tag = '错题重做';
    const title = `错题重做 (${selectedQuestions.length}题)`;

    const questionIds = selectedQuestions.map(q => q.id);

    // Insert into daily_quizzes
    await context.env.DB.prepare(
      'INSERT INTO daily_quizzes (id, user_id, date, tag, title, question_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      quizId,
      userId,
      date,
      tag,
      title,
      JSON.stringify(questionIds),
      Math.floor(Date.now() / 1000)
    ).run();

    // 4. 返回 quiz 结构
    return new Response(JSON.stringify({
      quizId,
      tag,
      date,
      title,
      questions: selectedQuestions,
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
