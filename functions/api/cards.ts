// GET /api/cards?userId=cyan — get today's card deck (new + review) + stats
// GET /api/cards?userId=cyan&mode=stats — only stats (for home page)
// POST /api/cards — admin: bulk add words
// PATCH /api/cards — mark word as "mastered" (斩)

interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const mode = url.searchParams.get('mode');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const db = context.env.DB;
  const today = new Date().toISOString().slice(0, 10);

  // Total words in deck
  const totalRow = await db.prepare('SELECT COUNT(*) as cnt FROM questions WHERE type = ?').bind('card').first() as any;
  const totalWords = totalRow?.cnt || 0;

  // Mastered (interval >= 60 or explicitly marked)
  const masteredRow = await db.prepare(`
    SELECT COUNT(DISTINCT question_id) as cnt FROM card_reviews 
    WHERE user_id = ? AND interval_days >= 60
  `).bind(userId).first() as any;
  const masteredCount = masteredRow?.cnt || 0;

  // Words with at least one review (learning)
  const learnedRow = await db.prepare(`
    SELECT COUNT(DISTINCT question_id) as cnt FROM card_reviews WHERE user_id = ?
  `).bind(userId).first() as any;
  const learnedCount = learnedRow?.cnt || 0;

  // Review due today
  const reviewDueRow = await db.prepare(`
    SELECT COUNT(DISTINCT cr.question_id) as cnt
    FROM card_reviews cr
    WHERE cr.user_id = ? AND cr.next_review_at <= ? AND cr.interval_days < 60
    AND cr.id = (
      SELECT id FROM card_reviews cr2 
      WHERE cr2.user_id = cr.user_id AND cr2.question_id = cr.question_id 
      ORDER BY cr2.reviewed_at DESC LIMIT 1
    )
  `).bind(userId, today).first() as any;
  const reviewDueCount = reviewDueRow?.cnt || 0;

  const newRemaining = totalWords - learnedCount;

  const stats = {
    totalWords,
    learnedCount,
    masteredCount,
    reviewDueCount,
    newRemaining,
  };

  // Stats-only mode for home page
  if (mode === 'stats') {
    return Response.json({ stats, date: today });
  }

  // Full mode: fetch actual words
  // 1. Review words due
  const reviewWords = await db.prepare(`
    SELECT q.id, q.content, cr.interval_days
    FROM card_reviews cr
    JOIN questions q ON q.id = cr.question_id
    WHERE cr.user_id = ? AND cr.next_review_at <= ? AND cr.interval_days < 60
    AND cr.id = (
      SELECT id FROM card_reviews cr2
      WHERE cr2.user_id = cr.user_id AND cr2.question_id = cr.question_id
      ORDER BY cr2.reviewed_at DESC LIMIT 1
    )
    ORDER BY cr.next_review_at ASC
    LIMIT 30
  `).bind(userId, today).all();

  // 2. New words
  const reviewCount = reviewWords.results?.length || 0;
  const newLimit = Math.max(5, 15 - reviewCount);

  const newWords = await db.prepare(`
    SELECT q.id, q.content
    FROM questions q
    WHERE q.type = 'card'
    AND q.id NOT IN (
      SELECT DISTINCT question_id FROM card_reviews WHERE user_id = ?
    )
    ORDER BY q.created_at ASC
    LIMIT ?
  `).bind(userId, newLimit).all();

  // 3. Gather ALL card meanings for distractor generation
  const allMeanings = await db.prepare(
    "SELECT id, content FROM questions WHERE type = 'card'"
  ).all();
  const meaningPool: { id: string; back: string }[] = (allMeanings.results || []).map((r: any) => {
    const c = JSON.parse(r.content);
    return { id: r.id, back: c.back };
  });

  const buildWord = (r: any, isReview: boolean) => {
    const content = JSON.parse(r.content);
    // Pick 3 random distractors from other words
    const others = meaningPool.filter(m => m.id !== r.id);
    const shuffled = others.sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3).map(m => m.back);

    return {
      id: r.id,
      front: content.front,
      back: content.back,
      phonetic: content.phonetic || null,
      example: content.example || null,
      exampleCn: content.exampleCn || null,
      distractors,
      isReview,
    };
  };

  const words = [
    ...(reviewWords.results || []).map((r: any) => buildWord(r, true)),
    ...(newWords.results || []).map((r: any) => buildWord(r, false)),
  ];

  // Shuffle
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  return Response.json({ words, stats, date: today });
};

// POST /api/cards — bulk add card-type questions
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get('Authorization');
  if (auth !== `Bearer ${context.env.ADMIN_API_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await context.request.json() as any;
  const { words, tags } = body;

  if (!words?.length) {
    return Response.json({ error: 'words array required' }, { status: 400 });
  }

  const db = context.env.DB;
  const tagJson = JSON.stringify(tags || ['英语单词']);
  let count = 0;

  for (const w of words) {
    const id = crypto.randomUUID();
    const content = JSON.stringify({
      front: w.front || w.word || w.english,
      back: w.back || w.meaning || w.chinese,
      phonetic: w.phonetic || w.pronunciation || null,
      example: w.example || null,
      exampleCn: w.exampleCn || null,
      unit: w.unit || null,
    });
    const answer = JSON.stringify({ front: w.front, back: w.back });

    await db.prepare(
      'INSERT INTO questions (id, type, content, answer, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, 'card', content, answer, tagJson, w.difficulty || 3, Date.now()).run();
    count++;
  }

  return Response.json({ success: true, count });
};

// PATCH /api/cards — mark word as mastered ("斩")
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { userId, questionId } = body;
  if (!userId || !questionId) {
    return Response.json({ error: 'userId, questionId required' }, { status: 400 });
  }

  const db = context.env.DB;
  const id = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  const farFuture = '2099-12-31';

  await db.prepare(
    'INSERT INTO card_reviews (id, user_id, question_id, remembered, next_review_at, interval_days, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, questionId, 1, farFuture, 999, Date.now()).run();

  return Response.json({ success: true, mastered: true });
};
