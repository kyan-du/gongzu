/**
 * GET /api/proof-image/:path
 * Serve proof images from R2
 */

import type { Env } from '../../lib/env';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { path } = context.params;
  const key = Array.isArray(path) ? path.join('/') : path;

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const fullKey = `proofs/${key}`;
  const object = await context.env.R2.get(fullKey);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(object.body, { headers });
};
