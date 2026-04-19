import type { Env } from '../../lib/env';

export async function handleBackup(context: { env: Env }): Promise<Response> {
  const tables = ['questions', 'daily_quizzes', 'submissions', 'knowledge_mastery', 'quiz_requests'];
  const data: Record<string, any[]> = {};
  for (const table of tables) {
    const rows = await context.env.DB.prepare(`SELECT * FROM ${table}`).all();
    data[table] = rows.results;
  }
  return new Response(JSON.stringify({ backup: data, created_at: new Date().toISOString() }), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="gongzu-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
