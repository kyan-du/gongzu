interface Env {
  DB: D1Database;
}

interface MistakeItem {
  questionId: string;
  submittedAt: number;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  tags: string[];
}

interface MistakeGroup {
  tag: string;
  count: number;
  mistakes: MistakeItem[];
}

// GET /api/mistakes?userId=cyan
// GET /api/mistakes?userId=cyan&tag=英语语法
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const tagFilter = url.searchParams.get('tag');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 查询所有错题：correct = 0
    // JOIN questions 表获取题目内容、答案、解析、标签
    const query = `
      SELECT 
        s.question_id,
        s.submitted_at,
        s.answer as user_answer,
        q.type,
        q.content,
        q.answer as correct_answer_raw,
        q.explanation,
        q.tags
      FROM submissions s
      INNER JOIN questions q ON s.question_id = q.id
      WHERE s.user_id = ? AND s.correct = 0
      ORDER BY s.submitted_at DESC
    `;

    const result = await context.env.DB.prepare(query).bind(userId).all();

    if (!result.results || result.results.length === 0) {
      return new Response(JSON.stringify({ mistakes: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 处理每条错题
    const mistakes: MistakeItem[] = [];
    for (const row of result.results) {
      const content = JSON.parse(row.content as string);
      const correctAnswerRaw = JSON.parse(row.correct_answer_raw as string);
      const tags = row.tags ? JSON.parse(row.tags as string) : [];

      // 如果有标签筛选，跳过不匹配的
      if (tagFilter && !tags.includes(tagFilter)) {
        continue;
      }

      let stem = '';
      let correctAnswer = '';

      if (row.type === 'choice') {
        stem = content.stem || '';
        correctAnswer = correctAnswerRaw.answer || '';
      } else if (row.type === 'blank') {
        stem = content.stem || '';
        correctAnswer = correctAnswerRaw.answers?.[0] || '';
      } else if (row.type === 'reading') {
        stem = content.passage || '';
        correctAnswer = Array.isArray(correctAnswerRaw) 
          ? correctAnswerRaw.join(',') 
          : (correctAnswerRaw.answers || []).join(',');
      }

      mistakes.push({
        questionId: String(row.question_id),
        submittedAt: row.submitted_at as number,
        stem,
        userAnswer: row.user_answer as string,
        correctAnswer,
        explanation: row.explanation as string || '',
        tags,
      });
    }

    // 按标签分组
    const groupMap = new Map<string, MistakeItem[]>();
    for (const mistake of mistakes) {
      for (const tag of mistake.tags) {
        if (!groupMap.has(tag)) {
          groupMap.set(tag, []);
        }
        groupMap.get(tag)!.push(mistake);
      }
    }

    const groups: MistakeGroup[] = [];
    for (const [tag, items] of groupMap) {
      groups.push({
        tag,
        count: items.length,
        mistakes: items,
      });
    }

    // 按错误次数降序
    groups.sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({ groups }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
