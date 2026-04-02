interface Env {
  DB: D1Database;
}

interface KnowledgePoint {
  id: string;
  knowledgePoint: string;
  category: string | null;
  errorCount: number;
  correctStreak: number;
  intervalDays: number;
  nextReviewAt: string | null;
  mastered: boolean;
  masteredReason: string | null;
  lastErrorAt: string | null;
}

interface MistakeDetail {
  date: string;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

// GET /api/mistakes?userId=cyan - 知识点卡片列表
// GET /api/mistakes?userId=cyan&point=序数词 - 某知识点的具体错题
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const point = url.searchParams.get('point');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (point) {
      // 查询某知识点下的具体错题列表
      const query = `
        SELECT 
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
      const mistakes: MistakeDetail[] = [];

      // Also get the category for this knowledge point (for fallback matching)
      const masteryRow = await context.env.DB.prepare(
        'SELECT category FROM knowledge_mastery WHERE user_id = ? AND knowledge_point = ? LIMIT 1'
      ).bind(userId, point).first();
      const category = masteryRow?.category as string | null;

      for (const row of result.results) {
        const tags = row.tags ? JSON.parse(row.tags as string) : [];
        // Match: exact knowledge_point in tags, OR fallback to category match
        const matches = tags.includes(point) || (category && (tags.includes(category) || tags.some((t: string) => category.includes(t))));
        if (!matches) continue;

        const content = JSON.parse(row.content as string);
        const correctAnswerRaw = JSON.parse(row.correct_answer_raw as string);

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

        // 截断过长的 stem
        if (stem.length > 100) {
          stem = stem.substring(0, 100) + '...';
        }

        const submittedAt = row.submitted_at as number;
        const date = new Date(submittedAt).toISOString().split('T')[0];

        mistakes.push({
          date,
          stem,
          userAnswer: row.user_answer as string,
          correctAnswer,
          explanation: row.explanation as string || '',
        });
      }

      return new Response(JSON.stringify({
        knowledgePoint: point,
        mistakes,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // 查询知识点卡片列表
      const masteryQuery = `
        SELECT * FROM knowledge_mastery WHERE user_id = ? ORDER BY mastered ASC, next_review_at ASC
      `;

      const result = await context.env.DB.prepare(masteryQuery).bind(userId).all();

      const points: KnowledgePoint[] = [];
      const masteredPoints: KnowledgePoint[] = [];

      for (const row of result.results) {
        const point: KnowledgePoint = {
          id: String(row.id),
          knowledgePoint: String(row.knowledge_point),
          category: row.category ? String(row.category) : null,
          errorCount: row.error_count as number,
          correctStreak: row.correct_streak as number,
          intervalDays: row.interval_days as number,
          nextReviewAt: row.next_review_at ? String(row.next_review_at) : null,
          mastered: row.mastered === 1,
          masteredReason: row.mastered_reason ? String(row.mastered_reason) : null,
          lastErrorAt: row.last_error_at ? String(row.last_error_at) : null,
        };

        if (point.mastered) {
          masteredPoints.push(point);
        } else {
          points.push(point);
        }
      }

      return new Response(JSON.stringify({
        points,
        masteredPoints,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
