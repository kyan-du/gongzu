// POST /api/cards/add — unified word extraction + add
// Modes:
//   { extract: true, text?, images?, userId } → AI extract, return word list (don't save)
//   { word, userId, enrichOnly: true } → AI enrich single word, return (don't save)
//   { words, userId } → save confirmed words to DB

interface Env {
  DB: D1Database;
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

async function callAI(env: Env, messages: any[], maxTokens = 3000, vision = false): Promise<string> {
  const cfg = getAIConfig(env, vision);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 80000); // 80s timeout
  try {
    const resp = await fetch(cfg.url, {
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
        max_tokens: maxTokens,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`AI API ${resp.status}: ${errText.slice(0, 200)}`);
    }
    const data = await resp.json() as any;
    let content = data.choices?.[0]?.message?.content || '';
    content = content.trim();
    if (content.startsWith('```')) {
      content = content.split('\n').slice(1).join('\n');
      content = content.replace(/```\s*$/, '').trim();
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function extractWords(env: Env, text?: string, images?: string[], userPrompt?: string): Promise<any[]> {
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

Return a JSON array. If no words found, return [].
ONLY return the JSON array, no other text.`;

  const userContent: any[] = [];

  if (images?.length) {
    for (const img of images) {
      userContent.push({
        type: 'image_url',
        image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`, detail: 'high' }
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

  const hasImages = !!(images?.length);
  const result = await callAI(env, messages, 3000, hasImages);
  try {
    return JSON.parse(result);
  } catch {
    throw new Error(`AI returned invalid JSON (${result.length} chars): ${result.slice(0, 100)}`);
  }
}

async function enrichWord(env: Env, word: string): Promise<any> {
  const messages = [
    {
      role: 'system',
      content: 'You are an English dictionary for Chinese middle school students. Return JSON only.'
    },
    {
      role: 'user',
      content: `For the English word "${word}", provide:
- front: the word itself
- back: Chinese meaning with part of speech (e.g. "美丽的 adj.")
- phonetic: IPA pronunciation (e.g. "/ˈbjuːtɪfl/")
- example: A simple example sentence with **word** bolded
- exampleCn: Chinese translation of the example

Return ONLY a JSON object: {"front":"...","back":"...","phonetic":"...","example":"...","exampleCn":"..."}`
    }
  ];

  const result = await callAI(env, messages, 500);
  return JSON.parse(result);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { userId, extract, text, images, image, word, enrichOnly, words } = body;

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  const db = context.env.DB;
  const apiKey = context.env.AI_PROXY_KEY;

  // Mode 1: Extract words from text/images (don't save)
  if (extract) {
    try {
      // Support both `images` array and legacy `image` single
      const imgs = images || (image ? [image] : undefined);
      const extracted = await extractWords(context.env, text, imgs);
      return Response.json({ success: true, words: extracted });
    } catch (e: any) {
      return Response.json({ error: 'Extract failed: ' + e.message }, { status: 500 });
    }
  }

  // Mode 2: Enrich single word (don't save)
  if (word && enrichOnly) {
    try {
      const enriched = await enrichWord(context.env, word.trim());
      return Response.json({ success: true, word: enriched });
    } catch (e: any) {
      return Response.json({ error: 'Enrich failed: ' + e.message }, { status: 500 });
    }
  }

  // Mode 3: Save words to DB
  if (words?.length) {
    let count = 0;
    const tags = JSON.stringify(['生词本']);

    for (const w of words) {
      const front = (w.front || w.word || '').trim().toLowerCase();
      if (!front) continue;

      // Check for duplicate
      const existing = await db.prepare(
        "SELECT id FROM questions WHERE type = 'card' AND json_extract(content, '$.front') = ?"
      ).bind(front).first();
      if (existing) continue; // skip duplicate

      const id = crypto.randomUUID();
      const content = JSON.stringify({
        front,
        back: w.back || '',
        phonetic: w.phonetic || '',
        example: w.example || '',
        exampleCn: w.exampleCn || '',
      });
      const answer = JSON.stringify({ front, back: w.back });

      await db.prepare(
        'INSERT INTO questions (id, type, content, answer, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, 'card', content, answer, tags, 3, Date.now()).run();
      count++;
    }
    return Response.json({ success: true, count });
  }

  // Legacy: single word save (non-enrichOnly)
  if (word && !enrichOnly) {
    try {
      const front = word.trim().toLowerCase();

      // Check for duplicate
      const existing = await db.prepare(
        "SELECT id FROM questions WHERE type = 'card' AND json_extract(content, '$.front') = ?"
      ).bind(front).first();
      if (existing) {
        return Response.json({ success: true, duplicate: true, message: `"${front}" 已在生词本中` });
      }

      const enriched = await enrichWord(context.env, word.trim());
      const id = crypto.randomUUID();
      const content = JSON.stringify({
        front,
        back: enriched.back,
        phonetic: enriched.phonetic,
        example: enriched.example,
        exampleCn: enriched.exampleCn,
      });
      const tags = JSON.stringify(['生词本']);

      await db.prepare(
        'INSERT INTO questions (id, type, content, answer, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, 'card', content, JSON.stringify({ front, back: enriched.back }), tags, 3, Date.now()).run();

      return Response.json({ success: true, word: { id, front, ...enriched } });
    } catch (e: any) {
      return Response.json({ error: 'Failed: ' + e.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Provide extract, word, or words' }, { status: 400 });
};
