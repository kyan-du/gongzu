// 认证 API
import { verifyPassphrase, jsonResponse, errorResponse } from '../middleware/auth';
import { getUser, type Env } from '../lib/db';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { passphrase, userId } = body;

    if (!passphrase) {
      return errorResponse('Passphrase is required');
    }

    // 验证家庭口令
    if (!verifyPassphrase(passphrase, env)) {
      return errorResponse('Invalid passphrase', 401);
    }

    // 如果提供了 userId，验证用户是否存在
    if (userId) {
      const user = await getUser(env.DB, userId);
      if (!user) {
        return errorResponse('User not found', 404);
      }

      // 设置 cookie
      return jsonResponse(
        { success: true, userId: user.id, name: user.name },
        200,
        {
          'Set-Cookie': `userId=${user.id}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`,
        }
      );
    }

    // 如果没有提供 userId，只验证口令
    return jsonResponse({ success: true, message: 'Passphrase verified' });
  } catch (error) {
    return errorResponse('Invalid request body');
  }
}

// 处理 OPTIONS 请求（CORS 预检）
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
