// GET /api/modules?userId=cyan — 前端查询
// PATCH /api/modules — 前端更新模块配置（parent 用）

interface Env {
  DB: D1Database;
}

interface ModuleRow {
  user_id: string;
  module: string;
  enabled: number;
  is_task: number;
  daily_target: number | null;
  config: string | null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await context.env.DB.prepare(
    'SELECT * FROM user_modules WHERE user_id = ?'
  ).bind(userId).all<ModuleRow>();

  const modules = (results || []).map((r) => ({
    module: r.module,
    enabled: r.enabled === 1,
    isTask: r.is_task === 1,
    dailyTarget: r.daily_target,
    config: r.config ? JSON.parse(r.config) : {},
  }));

  return new Response(JSON.stringify({ modules }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PATCH — 部分更新（前端 parent 配置页用）
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const body: any = await context.request.json();
  const { userId, module: mod } = body;
  if (!userId || !mod) {
    return new Response(JSON.stringify({ error: 'userId and module required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const existing = await context.env.DB.prepare(
    'SELECT * FROM user_modules WHERE user_id = ? AND module = ?'
  ).bind(userId, mod).first<any>();

  if (!existing) {
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
    const sets: string[] = ['updated_at = unixepoch()'];
    const binds: any[] = [];
    if (body.enabled != null) { sets.push('enabled = ?'); binds.push(body.enabled ? 1 : 0); }
    if (body.isTask != null) { sets.push('is_task = ?'); binds.push(body.isTask ? 1 : 0); }
    if (body.dailyTarget !== undefined) { sets.push('daily_target = ?'); binds.push(body.dailyTarget); }
    if (body.config != null) { sets.push('config = ?'); binds.push(JSON.stringify(body.config)); }
    binds.push(userId, mod);
    await context.env.DB.prepare(
      `UPDATE user_modules SET ${sets.join(', ')} WHERE user_id = ? AND module = ?`
    ).bind(...binds).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT — 替换模块配置（前端 quiz tag 配置用）
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const body: any = await context.request.json();
  const { userId, module: mod, config } = body;
  if (!userId || !mod) {
    return new Response(JSON.stringify({ error: 'userId and module required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const existing = await context.env.DB.prepare(
    'SELECT * FROM user_modules WHERE user_id = ? AND module = ?'
  ).bind(userId, mod).first<any>();

  if (!existing) {
    await context.env.DB.prepare(
      `INSERT INTO user_modules (user_id, module, enabled, is_task, daily_target, config, updated_at)
       VALUES (?, ?, 1, 1, NULL, ?, unixepoch())`
    ).bind(userId, mod, config != null ? JSON.stringify(config) : '{}').run();
  } else {
    await context.env.DB.prepare(
      `UPDATE user_modules SET config = ?, updated_at = unixepoch() WHERE user_id = ? AND module = ?`
    ).bind(config != null ? JSON.stringify(config) : '{}', userId, mod).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
