// 题型格式定义 — quiz-plan 生成 prompt 和 quiz POST 验证共用
// 新增题型只需在这里加一条

export interface QuestionTypeSchema {
  type: string;
  label: string;
  example: Record<string, any>;  // 完整的 question 对象示例
  requiredFields: string[];       // content 里必须有的字段
}

export const QUESTION_TYPES: QuestionTypeSchema[] = [
  {
    type: 'choice',
    label: '选择题',
    example: {
      type: 'choice',
      content: {
        stem: '题目',
        options: [
          { label: 'A', text: '选项A' },
          { label: 'B', text: '选项B' },
          { label: 'C', text: '选项C' },
          { label: 'D', text: '选项D' },
        ],
      },
      answer: { correctIndex: 0 },
      explanation: '解析',
      tags: ['科目标签', '知识点'],
      difficulty: 3,
    },
    requiredFields: ['stem', 'options'],
  },
  {
    type: 'blank',
    label: '填空题',
    example: {
      type: 'blank',
      content: {
        stem: '用所给词的适当形式填空',
        blanks: [
          { before: 'She is a ', after: ' (success) woman.', accepts: ['successful'] },
        ],
      },
      answer: 'successful',
      explanation: '解析',
      tags: ['科目标签', '知识点'],
      difficulty: 3,
    },
    requiredFields: ['stem', 'blanks'],
  },
  {
    type: 'rewrite',
    label: '改写题',
    example: {
      type: 'rewrite',
      content: {
        stem: '将下列句子改为感叹句',
        original: 'The flowers are beautiful.',
      },
      answer: 'How beautiful the flowers are!',
      explanation: '解析',
      tags: ['科目标签', '知识点'],
      difficulty: 3,
    },
    requiredFields: ['stem', 'original'],
  },
  {
    type: 'reading',
    label: '阅读理解',
    example: {
      type: 'reading',
      content: {
        title: '阅读标题',
        passage: '文章正文',
        questions: [
          {
            stem: '题目',
            options: [
              { label: 'A', text: '...' },
              { label: 'B', text: '...' },
              { label: 'C', text: '...' },
              { label: 'D', text: '...' },
            ],
          },
        ],
      },
      answer: ['B', 'C', 'A'],
      explanation: '逐题解析',
      tags: ['科目标签', '知识点'],
      difficulty: 3,
    },
    requiredFields: ['title', 'passage', 'questions'],
  },
];

// 根据题型列表动态生成 prompt 中的格式说明
export function buildFormatPrompt(types?: string[]): string {
  const schemas = types?.length
    ? QUESTION_TYPES.filter(t => types.includes(t.type))
    : QUESTION_TYPES;

  if (schemas.length === 0) return '';

  const typeExamples = schemas.map(s =>
    `### ${s.label}（type: "${s.type}"）\n\`\`\`json\n${JSON.stringify(s.example, null, 2)}\n\`\`\``
  ).join('\n\n');

  const wrapper = {
    userId: '用户ID',
    date: 'YYYY-MM-DD',
    tag: '科目标签',
    title: '标题',
    passage: '（仅阅读理解需要）文章正文',
    questions: ['... 见下方题型示例'],
  };

  return `## 输出格式

输出一个合法 JSON 对象，可直接 POST /api/quiz。外层结构：

\`\`\`json
${JSON.stringify(wrapper, null, 2)}
\`\`\`

questions 数组中每个元素按题型选用：

${typeExamples}

## 规则
- 只选用需要的题型，不必全部用上
- tags 数组：第一个元素是科目标签，最后一个是细粒度知识点
- difficulty: 1-5，默认 3
- JSON 必须合法，不能有中文引号（""）、注释、trailing comma
- 直接输出 JSON，不要包裹在 markdown code block 里`;
}
