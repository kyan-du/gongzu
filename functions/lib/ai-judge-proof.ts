/**
 * AI Judge for handwritten proof/solution questions
 * Uses GPT-5.2 multimodal to evaluate handwritten math solutions
 */

interface ProofJudgeInput {
  stem: string;
  expectedAnswer: string;
  imageKey: string;      // R2 key: proofs/userId/date/questionId.jpg
}

interface ProofJudgeResult {
  correct: boolean;
  score: number;          // 0-1
  feedback: string;       // 中文点评，≤100字
  keySteps: string[];     // 识别到的关键步骤
  correctedAnswer: string;
}

const SYSTEM_PROMPT = `你是一位经验丰富的初中数学老师，正在批改学生的手写几何证明/计算题。

请根据题目要求和标准答案，评判学生的手写解答：

1. **思路判断**：学生的解题方法是否正确（允许使用不同于标准答案的方法）
2. **步骤完整性**：关键步骤是否齐全（如辅助线、定理引用、推导过程）
3. **结论正确性**：最终答案/结论是否正确
4. **书写清晰度**：如果手写难以辨认，指出来

评分标准：
- 1.0：完全正确，步骤完整
- 0.8-0.9：思路正确，个别步骤略有瑕疵或书写不够规范
- 0.5-0.7：方向正确但有明显缺漏
- 0.2-0.4：有部分正确的想法但整体有误
- 0-0.1：完全错误或无法辨认

返回严格的 JSON（不要 markdown 代码块）：
{
  "correct": true或false（score>=0.8为true）,
  "score": 0到1之间的数字,
  "feedback": "简短中文点评，最多100字，鼓励为主，指出关键问题",
  "keySteps": ["识别到的步骤1", "步骤2", ...],
  "correctedAnswer": "如果有错，给出正确的简要解法提示"
}`;

function buildUserPrompt(input: ProofJudgeInput): string {
  return `题目：${input.stem}

标准答案/解法参考：${input.expectedAnswer}

请查看学生的手写解答图片并评判。`;
}

export async function judgeProof(
  input: ProofJudgeInput,
  env: { AI_PROXY_KEY: string; R2: R2Bucket }
): Promise<ProofJudgeResult> {
  // Get image from R2
  const object = await env.R2.get(input.imageKey);
  if (!object) {
    throw new Error(`Image not found in R2: ${input.imageKey}`);
  }

  const arrayBuffer = await object.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  const contentType = object.httpMetadata?.contentType || 'image/jpeg';
  const dataUrl = `data:${contentType};base64,${base64}`;

  const resp = await fetch('https://gru.ai/api/ai-proxy/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.AI_PROXY_KEY}`,
    },
    body: JSON.stringify({
      // The current AI Proxy chat-completions route does not accept GPT-5.x
      // model names here and returns a provider-side 500/invalid_request_error.
      // Use a vision-capable chat model for handwritten proof grading.
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildUserPrompt(input) },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI Proxy error ${resp.status}: ${text}`);
  }

  const data = await resp.json() as any;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty AI response');

  const jsonStr = content.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
  const result = JSON.parse(jsonStr);

  return {
    correct: !!result.correct,
    score: typeof result.score === 'number' ? result.score : (result.correct ? 1 : 0),
    feedback: result.feedback || '',
    keySteps: Array.isArray(result.keySteps) ? result.keySteps : [],
    correctedAnswer: result.correctedAnswer || input.expectedAnswer,
  };
}
