// GET /api/vocab?userId=cyan — get today's card deck (new + review) + stats
// GET /api/vocab?userId=cyan&mode=stats — only stats (for home page)
// POST /api/vocab — admin: bulk add words
// PATCH /api/vocab — mark word as "mastered" (斩)

interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
}

// Helper: get today's date string in Asia/Shanghai timezone
function todayCN(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const mode = url.searchParams.get('mode');
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  const db = context.env.DB;
  const today = todayCN();

  // Total words in deck
  const totalRow = await db.prepare('SELECT COUNT(*) as cnt FROM vocabulary WHERE user_id = ?').bind(userId).first() as any;
  const totalWords = totalRow?.cnt || 0;

  // Mastered (interval >= 60 or explicitly marked)
  const masteredRow = await db.prepare(`
    SELECT COUNT(DISTINCT vocabulary_id) as cnt FROM vocabulary_reviews
    WHERE user_id = ? AND interval_days >= 60
  `).bind(userId).first() as any;
  const masteredCount = masteredRow?.cnt || 0;

  // Words with at least one review (learning)
  const learnedRow = await db.prepare(`
    SELECT COUNT(DISTINCT vocabulary_id) as cnt FROM vocabulary_reviews WHERE user_id = ?
  `).bind(userId).first() as any;
  const learnedCount = learnedRow?.cnt || 0;

  // Review due today
  const reviewDueRow = await db.prepare(`
    SELECT COUNT(DISTINCT vr.vocabulary_id) as cnt
    FROM vocabulary_reviews vr
    WHERE vr.user_id = ? AND vr.next_review_at <= ? AND vr.interval_days < 60
    AND vr.id = (
      SELECT id FROM vocabulary_reviews vr2
      WHERE vr2.user_id = vr.user_id AND vr2.vocabulary_id = vr.vocabulary_id
      ORDER BY vr2.reviewed_at DESC LIMIT 1
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
    SELECT v.id, v.word, v.meaning, v.phonetic, v.example, v.example_cn, vr.interval_days,
    (SELECT COUNT(*) FROM vocabulary_reviews vr3 WHERE vr3.vocabulary_id = v.id AND vr3.user_id = vr.user_id) as review_count
    FROM vocabulary_reviews vr
    JOIN vocabulary v ON v.id = vr.vocabulary_id
    WHERE vr.user_id = ? AND vr.next_review_at <= ? AND vr.interval_days < 60
    AND vr.id = (
      SELECT id FROM vocabulary_reviews vr2
      WHERE vr2.user_id = vr.user_id AND vr2.vocabulary_id = vr.vocabulary_id
      ORDER BY vr2.reviewed_at DESC LIMIT 1
    )
    ORDER BY vr.next_review_at ASC
    LIMIT 30
  `).bind(userId, today).all();

  // 2. New words — use user settings
  const settingsRow = await db.prepare(
    `SELECT daily_new_words, daily_total_limit FROM card_settings WHERE user_id = ?`
  ).bind(userId).first() as any;
  const dailyNewWords = settingsRow?.daily_new_words ?? 15;
  const dailyTotalLimit = settingsRow?.daily_total_limit ?? 20;

  // Count how many words the user already reviewed/learned today (any review)
  // Use Asia/Shanghai midnight as "today start"
  const todayStart = new Date(today + 'T00:00:00+08:00').getTime();

  // Total distinct words reviewed today (both new and review)
  const totalReviewedTodayRow = await db.prepare(`
    SELECT COUNT(DISTINCT vocabulary_id) as cnt
    FROM vocabulary_reviews
    WHERE user_id = ? AND reviewed_at >= ?
  `).bind(userId, todayStart).first() as any;
  const totalReviewedToday = totalReviewedTodayRow?.cnt || 0;

  // Count NEW words learned today (first-ever review today)
  const newLearnedTodayRow = await db.prepare(`
    SELECT COUNT(DISTINCT vr.vocabulary_id) as cnt
    FROM vocabulary_reviews vr
    WHERE vr.user_id = ?
    AND vr.reviewed_at >= ?
    AND (SELECT COUNT(*) FROM vocabulary_reviews vr2
         WHERE vr2.user_id = vr.user_id AND vr2.vocabulary_id = vr.vocabulary_id
         AND vr2.reviewed_at < ?) = 0
  `).bind(userId, todayStart, todayStart).first() as any;
  const newLearnedToday = newLearnedTodayRow?.cnt || 0;

  const reviewCount = reviewWords.results?.length || 0;
  const remainingNewQuota = Math.max(0, dailyNewWords - newLearnedToday);
  // If user already completed a full session (reviewed >= dailyTotalLimit words today),
  // don't serve more new cards — the session is done
  const sessionDone = totalReviewedToday >= dailyTotalLimit;
  const newLimit = sessionDone ? 0 : Math.max(0, Math.min(remainingNewQuota, dailyTotalLimit - reviewCount));

  const newWords = await db.prepare(`
    SELECT v.id, v.word, v.meaning, v.phonetic, v.example, v.example_cn
    FROM vocabulary v
    WHERE v.user_id = ?
    AND v.id NOT IN (
      SELECT DISTINCT vocabulary_id FROM vocabulary_reviews WHERE user_id = ?
    )
    ORDER BY v.created_at ASC
    LIMIT ?
  `).bind(userId, userId, newLimit).all();

  // 3. Gather ALL card meanings for distractor generation
  const allMeanings = await db.prepare(
    "SELECT id, meaning FROM vocabulary WHERE user_id = ?"
  ).bind(userId).all();
  const meaningPool: { id: string; back: string }[] = (allMeanings.results || []).map((r: any) => {
    return { id: r.id, back: r.meaning };
  });

  const buildWord = (r: any, isReview: boolean) => {
    const others = meaningPool.filter(m => m.id !== r.id);
    const shuffled = others.sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3).map(m => m.back);

    return {
      id: r.id,
      front: r.word,
      back: r.meaning,
      phonetic: r.phonetic || null,
      example: r.example || null,
      exampleCn: r.example_cn || null,
      distractors,
      isReview,
      reviewCount: r.review_count || 0,
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

// POST /api/vocab — bulk add vocabulary words
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get('Authorization');
  if (auth !== `Bearer ${context.env.ADMIN_API_KEY}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await context.request.json() as any;
  const { words, tags, userId = 'cyan' } = body;

  if (!words?.length) {
    return Response.json({ error: 'words array required' }, { status: 400 });
  }

  const db = context.env.DB;
  const tagJson = JSON.stringify(tags || ['英语单词']);
  let count = 0;

  for (const w of words) {
    const id = crypto.randomUUID();
    const word = w.front || w.word || w.english;
    const wordLower = word.toLowerCase();
    const meaning = w.back || w.meaning || w.chinese;

    await db.prepare(
      'INSERT INTO vocabulary (id, user_id, word, word_lower, meaning, phonetic, example, example_cn, tags, source, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, userId, word, wordLower, meaning,
      w.phonetic || w.pronunciation || null,
      w.example || null,
      w.exampleCn || null,
      tagJson,
      'manual',
      w.difficulty || 3,
      Date.now()
    ).run();
    count++;
  }

  return Response.json({ success: true, count });
};

// PATCH /api/vocab — mark word as mastered ("斩")
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { userId, questionId } = body;
  if (!userId || !questionId) {
    return Response.json({ error: 'userId, questionId required' }, { status: 400 });
  }

  const db = context.env.DB;
  const id = crypto.randomUUID();
  const today = todayCN();
  const farFuture = '2099-12-31';

  await db.prepare(
    'INSERT INTO vocabulary_reviews (id, user_id, vocabulary_id, remembered, next_review_at, interval_days, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, questionId, 1, farFuture, 999, Date.now()).run();

  return Response.json({ success: true, mastered: true });
};
