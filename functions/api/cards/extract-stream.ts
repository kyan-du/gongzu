// POST /api/cards/extract-stream — SSE streaming word extraction
// Returns text/event-stream with incremental word results

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  AI_PROXY_KEY: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  AI_VISION_MODEL?: string;
}

function getAIConfig(env: Env, vision = false) {
  return {
    url: (env.AI_BASE_URL || 'https://gru.ai/api/ai-proxy/openai/v1') + '/chat/completions',
    model: vision ? (env.AI_VISION_MODEL || env.AI_MODEL || 'gpt-5.2') : (env.AI_MODEL || 'gpt-5.2'),
    key: env.AI_PROXY_KEY,
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { text, images, imageKeys } = body;

  if (!text?.trim() && !images?.length && !imageKeys?.length) {
    return Response.json({ error: 'text, images, or imageKeys required' }, { status: 400 });
  }

  const hasImages = !!(images?.length || imageKeys?.length);
  const cfg = getAIConfig(context.env, hasImages);

  const systemPrompt = `You are an AI that extracts English vocabulary for a Chinese student.

From the given text or image(s), extract ALL English words AND phrases following these rules:
- If it's a vocabulary list / word table: extract EVERY item — scan ALL columns, ALL rows, left to right, top to bottom. Do NOT stop after the first column.
- If it's a test paper / exam: focus on words from INCORRECT answers or marked/circled items
- If it's a text passage: extract all noteworthy English words and phrases
- When in doubt, include the word/phrase rather than skip it
- Include phrases and collocations such as "both...and...", "look forward to", "be famous for", "not only...but also...", etc.
- Make sure to scan the ENTIRE image — many vocabulary pages have 2 or 3 columns side by side.

For each item, provide:
- front: the English word or phrase (for patterns use "..." as placeholder, e.g. "both...and...")
- back: Chinese meaning with part of speech (e.g. "美丽的 adj." or "两者都…… conj.")
- phonetic: IPA pronunciation (for phrases, leave empty string "")
- example: a simple example sentence (bold the key word/phrase with **...**)
- exampleCn: Chinese translation of the example

IMPORTANT: Output each word as a SEPARATE JSON object on its own line, one by one.
Do NOT wrap in an array. Each line should be a complete JSON object like:
{"front":"beautiful","back":"美丽的 adj.","phonetic":"/ˈbjuːtɪfl/","example":"The sunset was **beautiful**.","exampleCn":"日落很美丽。"}
{"front":"courage","back":"勇气 n.","phonetic":"/ˈkʌrɪdʒ/","example":"She showed great **courage**.","exampleCn":"她展现了巨大的勇气。"}

Output words one per line. No array brackets, no commas between objects. Just one JSON object per line.`;

  const userContent: any[] = [];

  // Prefer imageKeys (R2 URLs) — smaller request body, faster
  if (imageKeys?.length) {
    const origin = new URL(context.request.url).origin;
    for (const key of imageKeys) {
      const url = `${origin}/api/cards/image/${key}`;
      userContent.push({
        type: 'image_url',
        image_url: { url, detail: 'auto' },
      });
    }
  } else if (images?.length) {
    for (const img of images) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`,
          detail: 'auto',
        },
      });
    }
  }

  let textInstruction = 'Extract English vocabulary words from the above.';
  if (text && images?.length) {
    textInstruction = `Extract English vocabulary words. User's note: "${text}"`;
  } else if (text && !images?.length) {
    textInstruction = `Extract English vocabulary words from this text:\n\n${text}`;
  }
  userContent.push({ type: 'text', text: textInstruction });

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  // Call AI with streaming
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 80000);

  let aiResp: Response;
  try {
    aiResp = await fetch(cfg.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.key}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.2,
        max_tokens: 3000,
        stream: true,
      }),
    });
  } catch (e: any) {
    clearTimeout(timer);
    return Response.json({ error: 'AI request failed: ' + e.message }, { status: 502 });
  }

  if (!aiResp.ok || !aiResp.body) {
    clearTimeout(timer);
    const errText = await aiResp.text();
    return Response.json({ error: `AI API ${aiResp.status}: ${errText.slice(0, 200)}` }, { status: 502 });
  }

  // Transform AI SSE stream → our SSE stream with parsed words
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  (async () => {
    const reader = aiResp.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';        // raw SSE buffer from upstream
    let jsonBuffer = '';    // accumulated JSON content from AI
    let wordCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (!delta) continue;

            jsonBuffer += delta;

            // Try to extract complete JSON objects (one per line)
            const jsonLines = jsonBuffer.split('\n');
            jsonBuffer = jsonLines.pop() || '';

            for (const jl of jsonLines) {
              const trimmed = jl.trim();
              if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') continue;

              // Strip leading comma or array bracket
              let clean = trimmed;
              if (clean.startsWith(',')) clean = clean.slice(1).trim();
              if (clean.startsWith('[')) clean = clean.slice(1).trim();
              if (clean.endsWith(',')) clean = clean.slice(0, -1).trim();
              if (clean.endsWith(']')) clean = clean.slice(0, -1).trim();
              if (!clean) continue;

              try {
                const word = JSON.parse(clean);
                if (word.front) {
                  wordCount++;
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'word', word })}\n\n`));
                }
              } catch {
                // incomplete JSON, put back
                jsonBuffer = clean + '\n' + jsonBuffer;
                break;
              }
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }

      // Final flush: try to parse remaining buffer
      if (jsonBuffer.trim()) {
        let remaining = jsonBuffer.trim();
        // Could be last word without newline, or a partial array
        if (remaining.startsWith('[')) remaining = remaining.slice(1);
        if (remaining.endsWith(']')) remaining = remaining.slice(0, -1);

        for (const piece of remaining.split('\n')) {
          let clean = piece.trim();
          if (!clean) continue;
          if (clean.startsWith(',')) clean = clean.slice(1).trim();
          if (clean.endsWith(',')) clean = clean.slice(0, -1).trim();
          if (!clean) continue;
          try {
            const word = JSON.parse(clean);
            if (word.front) {
              wordCount++;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'word', word })}\n\n`));
            }
          } catch {
            // ignore
          }
        }
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', count: wordCount })}\n\n`));
    } catch (e: any) {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`));
    } finally {
      clearTimeout(timer);
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
