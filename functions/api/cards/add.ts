// POST /api/cards/add — user adds words (manual or from AI photo analysis)
// Supports: { word } for single word auto-enrichment
//           { words: [{front, back, ...}] } for batch add (from photo analysis)

interface Env {
  DB: D1Database;
  AI_PROXY_KEY: string;
}

async function enrichWord(word: string, apiKey: string): Promise<any> {
  const resp = await fetch('https://gru.ai/api/ai-proxy/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: 'You are an English dictionary for Chinese middle school students. Return JSON only.'
        },
        {
          role: 'user',
          content: `For the English word "${word}", provide:
- back: Chinese meaning with part of speech (e.g. "美丽的 adj.")
- phonetic: IPA pronunciation (e.g. "/ˈbjuːtɪfl/")
- example: A simple example sentence with **word** bolded
- exampleCn: Chinese translation of the example

Return ONLY a JSON object: {"back":"...","phonetic":"...","example":"...","exampleCn":"..."}`
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  const data = await resp.json() as any;
  let content = data.choices?.[0]?.message?.content || '';
  content = content.trim();
  if (content.startsWith('```')) {
    content = content.split('\n').slice(1).join('\n').replace(/```$/, '');
  }
  return JSON.parse(content);
}

async function analyzePhoto(imageBase64: string, apiKey: string): Promise<any[]> {
  const resp = await fetch('https://gru.ai/api/ai-proxy/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: `You are an AI that analyzes photos of English test papers, textbooks, or vocabulary notes for Chinese middle school students.
Extract English words that are:
- Marked as wrong / circled / highlighted
- Handwritten corrections
- Vocabulary words from word lists
- Any word that appears to be a study target

For each word, provide the Chinese meaning, pronunciation, and a simple example sentence.
Return a JSON array only.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image and extract English vocabulary words that need to be studied. Return a JSON array: [{"front":"word","back":"中文释义 词性","phonetic":"/...../","example":"Example with **word** bolded","exampleCn":"中文翻译"}]' },
            { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  const data = await resp.json() as any;
  let content = data.choices?.[0]?.message?.content || '[]';
  content = content.trim();
  if (content.startsWith('```')) {
    content = content.split('\n').slice(1).join('\n').replace(/```$/, '');
  }
  return JSON.parse(content);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json() as any;
  const { userId, word, words: batchWords, image } = body;

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 });
  }

  const db = context.env.DB;
  const apiKey = context.env.AI_PROXY_KEY;

  // Mode 1: Photo analysis — return extracted words for confirmation, don't save yet
  if (image) {
    try {
      const extracted = await analyzePhoto(image, apiKey);
      return Response.json({ success: true, words: extracted, needsConfirm: true });
    } catch (e: any) {
      return Response.json({ error: 'Photo analysis failed: ' + e.message }, { status: 500 });
    }
  }

  // Mode 2: Single word — AI enrich then save
  if (word && !batchWords) {
    try {
      const enriched = await enrichWord(word, apiKey);
      const id = crypto.randomUUID();
      const content = JSON.stringify({
        front: word.trim().toLowerCase(),
        back: enriched.back,
        phonetic: enriched.phonetic,
        example: enriched.example,
        exampleCn: enriched.exampleCn,
      });
      const tags = JSON.stringify(['生词本']);

      await db.prepare(
        'INSERT INTO questions (id, type, content, answer, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, 'card', content, JSON.stringify({ front: word, back: enriched.back }), tags, 3, Date.now()).run();

      return Response.json({
        success: true,
        word: { id, front: word, ...enriched },
      });
    } catch (e: any) {
      return Response.json({ error: 'Enrich failed: ' + e.message }, { status: 500 });
    }
  }

  // Mode 3: Batch add (from confirmed photo analysis or manual batch)
  if (batchWords?.length) {
    let count = 0;
    for (const w of batchWords) {
      const id = crypto.randomUUID();
      const content = JSON.stringify({
        front: (w.front || w.word || '').trim().toLowerCase(),
        back: w.back || w.meaning || '',
        phonetic: w.phonetic || '',
        example: w.example || '',
        exampleCn: w.exampleCn || '',
      });
      const tags = JSON.stringify(['生词本']);

      await db.prepare(
        'INSERT INTO questions (id, type, content, answer, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, 'card', content, JSON.stringify({ front: w.front, back: w.back }), tags, 3, Date.now()).run();
      count++;
    }
    return Response.json({ success: true, count });
  }

  return Response.json({ error: 'Provide word, words, or image' }, { status: 400 });
};
