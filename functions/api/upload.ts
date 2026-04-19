/**
 * POST /api/upload
 * Upload handwritten proof image to R2
 * Body: multipart/form-data with file field "image"
 * Query: ?userId=cyan&date=2026-04-19&questionId=xxx
 */

interface Env {
  R2: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    const date = url.searchParams.get('date');
    const questionId = url.searchParams.get('questionId');

    if (!userId || !date || !questionId) {
      return new Response(JSON.stringify({ error: 'userId, date, questionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await context.request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (max 10MB — frontend compresses to ~1MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate content type
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Only image files allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const key = `proofs/${userId}/${date}/${questionId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    await context.env.R2.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return new Response(JSON.stringify({ key, size: file.size }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
