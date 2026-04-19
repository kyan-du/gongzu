import type { Env } from '../../lib/env';

export async function handlePendingRequests(context: { env: Env }): Promise<Response> {
  const rows = await context.env.DB.prepare(
    "SELECT * FROM quiz_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10"
  ).all();
  return new Response(JSON.stringify({ requests: rows.results }), { headers: { 'Content-Type': 'application/json' } });
}
