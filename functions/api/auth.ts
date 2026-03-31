interface Env {
  DB: D1Database;
  FAMILY_PASSPHRASE: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { passphrase, userId } = await context.request.json() as any;

    if (passphrase !== context.env.FAMILY_PASSPHRASE) {
      return new Response(JSON.stringify({ error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate a simple session token
    const token = crypto.randomUUID();

    return new Response(JSON.stringify({ token, userId: userId || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
