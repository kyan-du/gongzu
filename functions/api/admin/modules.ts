// Admin modules API
// GET  /api/admin/modules?userId=cyan  — 查配置
// PUT  /api/admin/modules              — 整行写入/更新
// PATCH /api/admin/modules             — 部分字段更新

interface Env {
  DB: D1Database;
  ADMIN_API_KEY: string;
  FAMILY_PASSPHRASE: string;
}

function checkAuth(request: Request, env: Env): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return token === env.ADMIN_API_KEY || token === env.FAMILY_PASSPHRASE;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// GET — 查询某用户所有模块配置
export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: JSON_HEADERS });
  }

  const { results } = await context.env.DB.prepare(
    'SELECT * FROM user_modules WHERE user_id = ?'
  ).bind(userId).all();

  const modules = (results || []).map((r: any) => ({
    module: r.module,
    enabled: r.enabled === 1,
    isTask: r.is_task === 1,
    dailyTarget: r.daily_target,
    config: r.config ? JSON.parse(r.config) : {},
    updatedAt: r.updated_at,
  }));

  return new Response(JSON.stringify({ modules }), { headers: JSON_HEADERS });
};

// PUT — 完整写入（upsert 整行）
// Body: { userId, module, enabled?, isTask?, dailyTarget?, config? }
// 或批量: { userId, modules: [{ module, enabled?, isTask?, dailyTarget?, config? }] }
export const onRequestPut: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const body: any = await context.request.json();
  const userId = body.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: JSON_HEADERS });
  }

  const items = body.modules || [body];
  const stmts: D1PreparedStatement[] = [];

  for (const item of items) {
    if (!item.module) continue;
    const configStr = item.config != null ? JSON.stringify(item.config) : '{}';
    stmts.push(
      context.env.DB.prepare(
        `INSERT INTO user_modules (user_id, module, enabled, is_task, daily_target, config, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, unixepoch())
         ON CONFLICT(user_id, module) DO UPDATE SET
           enabled = excluded.enabled,
           is_task = excluded.is_task,
           daily_target = excluded.daily_target,
           config = excluded.config,
           updated_at = unixepoch()`
      ).bind(
        userId,
        item.module,
        item.enabled != null ? (item.enabled ? 1 : 0) : 1,
        item.isTask != null ? (item.isTask ? 1 : 0) : 0,
        item.dailyTarget ?? null,
        configStr,
      )
    );
  }

  if (stmts.length > 0) {
    await context.env.DB.batch(stmts);
  }

  return new Response(JSON.stringify({ ok: true, updated: stmts.length }), { headers: JSON_HEADERS });
};

// PATCH — 部分更新（只改传入的字段）
// Body: { userId, module, enabled?, isTask?, dailyTarget?, config? }
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  if (!checkAuth(context.request, context.env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const body: any = await context.request.json();
  const { userId, module: mod } = body;
  if (!userId || !mod) {
    return new Response(JSON.stringify({ error: 'userId and module required' }), { status: 400, headers: JSON_HEADERS });
  }

  // Read current
  const existing = await context.env.DB.prepare(
    'SELECT * FROM user_modules WHERE user_id = ? AND module = ?'
  ).bind(userId, mod).first<any>();

  if (!existing) {
    // Insert new with provided fields
    const configStr = body.config != null ? JSON.stringify(body.config) : '{}';
    await context.env.DB.prepare(
      `INSERT INTO user_modules (user_id, module, enabled, is_task, daily_target, config, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, unixepoch())`
    ).bind(
      userId, mod,
      body.enabled != null ? (body.enabled ? 1 : 0) : 1,
      body.isTask != null ? (body.isTask ? 1 : 0) : 0,
      body.dailyTarget ?? null,
      configStr,
    ).run();
  } else {
    // Merge
    const sets: string[] = ['updated_at = unixepoch()'];
    const binds: any[] = [];

    if (body.enabled != null) {
      sets.push('enabled = ?');
      binds.push(body.enabled ? 1 : 0);
    }
    if (body.isTask != null) {
      sets.push('is_task = ?');
      binds.push(body.isTask ? 1 : 0);
    }
    if (body.dailyTarget !== undefined) {
      sets.push('daily_target = ?');
      binds.push(body.dailyTarget);
    }
    if (body.config != null) {
      sets.push('config = ?');
      binds.push(JSON.stringify(body.config));
    }

    binds.push(userId, mod);
    await context.env.DB.prepare(
      `UPDATE user_modules SET ${sets.join(', ')} WHERE user_id = ? AND module = ?`
    ).bind(...binds).run();
  }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};
