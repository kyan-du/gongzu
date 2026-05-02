/**
 * AI Judge for rewrite questions
 * Primary: ai-proxy GPT-5.2
 * Fallback: webhook to OpenClaw (hooks mode)
 */

interface JudgeInput {
  instruction: string;
  original: string;
  correctAnswer: string;
  studentAnswer: string;
}

interface JudgeResult {
  correct: boolean;
  score: number;         // 0-1
  feedback: string;      // 错因分析（中文）
  correctedAnswer: string;
}

const SYSTEM_PROMPT = `你是英语老师，判断学生的句子改写是否正确。

判断标准：
1. 语法正确
2. 意思符合题目要求
3. 不要求与标准答案完全一致，合理的替代表达也算对
4. 格式问题（逗号后有无空格、大小写、标点符号）不扣分
5. 如果学生答案有实质性拼写错误（不是格式问题），视为错误

返回严格的 JSON（不要 markdown 代码块）：
{
  "correct": true或false,
  "score": 0到1之间的数字,
  "feedback": "简短中文点评，最多50字",
  "correctedAnswer": "修正后的正确答案"
}`;

function buildUserPrompt(input: JudgeInput): string {
  return `题目要求：${input.instruction}
原句：${input.original}
标准答案：${input.correctAnswer}
学生答案：${input.studentAnswer}`;
}

async function judgeViaAiProxy(input: JudgeInput, apiKey: string): Promise<JudgeResult> {
  const resp = await fetch('https://gru.ai/api/ai-proxy/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // Keep this on a chat-completions-compatible model. GPT-5.x currently
      // returns provider-side invalid_request_error on this AI Proxy route.
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI Proxy error ${resp.status}: ${text}`);
  }

  const data = await resp.json() as any;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty AI response');

  // Parse JSON, handle potential markdown wrapping
  const jsonStr = content.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
  const result = JSON.parse(jsonStr);

  return {
    correct: !!result.correct,
    score: typeof result.score === 'number' ? result.score : (result.correct ? 1 : 0),
    feedback: result.feedback || '',
    correctedAnswer: result.correctedAnswer || input.correctAnswer,
  };
}

async function judgeViaWebhook(input: JudgeInput, webhookUrl: string, webhookToken: string): Promise<JudgeResult> {
  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${webhookToken}`,
    },
    body: JSON.stringify({
      message: `请判断这道改写题：\n${buildUserPrompt(input)}\n\n${SYSTEM_PROMPT}`,
      name: '拱卒-AI判分',
      deliver: false,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Webhook error ${resp.status}`);
  }

  // Webhook mode: return a pending result, actual judging happens async
  // For now, fall back to simple string matching
  throw new Error('Webhook mode not yet implemented for sync judging');
}

export async function judgeRewrite(
  input: JudgeInput,
  env: { AI_PROXY_KEY?: string; WEBHOOK_URL?: string; WEBHOOK_TOKEN?: string }
): Promise<JudgeResult> {
  // Try AI Proxy first
  if (env.AI_PROXY_KEY) {
    try {
      return await judgeViaAiProxy(input, env.AI_PROXY_KEY);
    } catch (e) {
      console.error('AI Proxy judge failed, falling back:', e);
    }
  }

  // Fallback: normalize and compare (lenient on formatting)
  const normJudge = (s: string) =>
    s.trim().toLowerCase()
     .replace(/[;；,，]/g, ' ')
     .replace(/[.!?。！？]+$/, '')
     .replace(/\s+/g, ' ')
     .trim();
  const studentNorm = normJudge(input.studentAnswer);
  const correctNorm = normJudge(input.correctAnswer);
  const isMatch = studentNorm === correctNorm;

  return {
    correct: isMatch,
    score: isMatch ? 1 : 0,
    feedback: isMatch ? '正确！' : `参考答案：${input.correctAnswer}`,
    correctedAnswer: input.correctAnswer,
  };
}
