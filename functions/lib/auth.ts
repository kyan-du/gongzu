/**
 * Authentication middleware for Cloudflare Pages Functions
 */
import type { Env } from './env';

/**
 * Check admin-only authentication (strict)
 * Requires ADMIN_API_KEY
 */
export function requireAdminAuth(request: Request, env: Env): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return token === env.ADMIN_API_KEY;
}

/**
 * Check family authentication (relaxed)
 * Accepts either ADMIN_API_KEY or FAMILY_PASSPHRASE
 */
export function requireAuth(request: Request, env: Env): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return token === env.ADMIN_API_KEY || token === env.FAMILY_PASSPHRASE;
}

/**
 * Create a JSON error response for unauthorized requests
 */
export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
