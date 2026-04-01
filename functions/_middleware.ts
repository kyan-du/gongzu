export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  const url = new URL(context.request.url);

  // HTML pages: no cache
  if (!url.pathname.match(/\.\w+$/) || url.pathname.endsWith('.html')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
};
