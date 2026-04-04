// GET /api/vocab/manage?userId=xxx&page=1&pageSize=20&sort=newest&q=xxx
// DELETE /api/vocab/manage?userId=xxx&id=xxx

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const search = url.searchParams.get('q')?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')));
  const sort = url.searchParams.get('sort') || 'newest'; // newest | oldest | alpha

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  const db = context.env.DB;

  const orderBy = sort === 'oldest' ? 'created_at ASC'
    : sort === 'alpha' ? 'word ASC'
    : 'created_at DESC';

  const offset = (page - 1) * pageSize;
  const params: any[] = [userId];

  let whereClause = "user_id = ?";
  if (search) {
    whereClause += " AND (word LIKE ? OR meaning LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  // Get total count
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM vocabulary WHERE ${whereClause}`).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;

  // Get page
  const results = await db.prepare(
    `SELECT id, word, meaning, phonetic, created_at FROM vocabulary WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all();

  const words = (results.results || []).map((row: any) => {
    return {
      id: row.id,
      front: row.word,
      back: row.meaning,
      phonetic: row.phonetic || '',
      createdAt: row.created_at,
    };
  });

  return Response.json({
    words,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  const id = url.searchParams.get('id');
  const ids = url.searchParams.get('ids'); // comma-separated for batch

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  const db = context.env.DB;

  if (ids) {
    // Batch delete
    const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
    if (idList.length === 0) return Response.json({ error: 'ids required' }, { status: 400 });
    const placeholders = idList.map(() => '?').join(',');
    await db.prepare(`DELETE FROM vocabulary WHERE user_id = ? AND id IN (${placeholders})`).bind(userId, ...idList).run();
    return Response.json({ success: true, deleted: idList.length });
  }

  if (!id) {
    return Response.json({ error: 'id or ids required' }, { status: 400 });
  }

  await db.prepare('DELETE FROM vocabulary WHERE user_id = ? AND id = ?').bind(userId, id).run();
  return Response.json({ success: true });
};
