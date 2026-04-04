// GET /api/cards/image/tmp/[uuid].[ext] — serve image from R2
interface Env {
  R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  // context.params.path is an array of path segments: ["tmp", "uuid.ext"]
  const segments = context.params.path as string[];
  const key = segments.join('/');

  const obj = await context.env.R2.get(key);
  if (!obj) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
