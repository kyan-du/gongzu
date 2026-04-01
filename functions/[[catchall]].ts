// SPA fallback: serve index.html for all non-API, non-asset routes
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  
  // Let /api/* pass through to API functions
  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }
  
  // Try to serve the static asset first
  try {
    const response = await context.env.ASSETS.fetch(context.request);
    if (response.status !== 404) {
      return response;
    }
  } catch {}
  
  // Fallback to index.html for SPA routes
  const indexResponse = await context.env.ASSETS.fetch(new URL('/', context.request.url));
  return new Response(indexResponse.body, {
    headers: indexResponse.headers,
    status: 200,
  });
};
