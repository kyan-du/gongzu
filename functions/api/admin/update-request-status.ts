import type { Env } from '../../lib/env';

export async function handleUpdateRequestStatus(context: { env: Env }, body: Record<string, any>): Promise<Response> {
  const { requestId, status } = body;
  if (!requestId || !status) {
    return new Response(JSON.stringify({ error: 'requestId and status required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  await context.env.DB.prepare('UPDATE quiz_requests SET status = ? WHERE id = ?').bind(status, requestId).run();
  return new Response(JSON.stringify({ action: 'update-request-status', requestId, status }), { headers: { 'Content-Type': 'application/json' } });
}
