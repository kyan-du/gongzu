// POST /api/vocab/upload — upload image to R2, return public URL
// Body: { image: "data:image/jpeg;base64,..." }
// Returns: { url: "https://..." }

interface Env {
  R2: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { image } = body;

  if (!image) {
    return Response.json({ error: 'image required' }, { status: 400 });
  }

  // Parse data URL
  const match = image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return Response.json({ error: 'invalid data URL' }, { status: 400 });
  }

  const mimeType = match[1];
  const base64 = match[2];
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const key = `tmp/${crypto.randomUUID()}.${ext}`;

  await context.env.R2.put(key, bytes, {
    httpMetadata: { contentType: mimeType },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });

  // R2 public URL — use the bucket's default domain
  // For CF Pages + R2 binding, we serve via a proxy endpoint
  const url = `/api/vocab/image/${key}`;

  return Response.json({ success: true, key, url });
};
