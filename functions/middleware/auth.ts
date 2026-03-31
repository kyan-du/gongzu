// 认证中间件
import type { Env } from '../lib/db';

// 验证家庭口令
export function verifyPassphrase(passphrase: string, env: Env): boolean {
  return passphrase === env.FAMILY_PASSPHRASE;
}

// 验证 API Key
export function verifyApiKey(apiKey: string, env: Env): boolean {
  return apiKey === env.ADMIN_API_KEY;
}

// 从请求头中提取 Bearer Token
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// API 认证中间件
export async function requireApiKey(request: Request, env: Env): Promise<Response | null> {
  const apiKey = extractBearerToken(request);

  if (!apiKey || !verifyApiKey(apiKey, env)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid API key' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null; // 认证通过
}

// 用户认证中间件（从 cookie 或请求体中验证）
export async function requireAuth(request: Request, env: Env): Promise<{ userId: string } | Response> {
  // 从 cookie 中读取 userId
  const cookies = request.headers.get('Cookie');
  if (cookies) {
    const match = cookies.match(/userId=([^;]+)/);
    if (match) {
      return { userId: match[1] };
    }
  }

  // 如果没有 cookie，返回未授权
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message: 'Please login first' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

// 创建响应助手
export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

// 错误响应助手
export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: true, message }, status);
}
