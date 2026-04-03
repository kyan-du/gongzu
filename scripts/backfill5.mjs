#!/usr/bin/env node
const API = 'https://gongzu.pages.dev/api/quiz';
const KEY = 'gongzu-admin-402e83c1e2db3dc1';

async function createQuiz(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function choiceQ(stem, choices, correctIdx, explanation, tags, difficulty = 3) {
  return {
    type: 'choice',
    content: { stem, choices },
    answer: { correctIndex: correctIdx },
    explanation,
    tags,
    difficulty,
  };
}

const quizzes = [
  {
    date: '2026-03-19', tag: '阅读理解', title: '名人小故事·阅读理解',
    questions: [
      choiceQ('诸葛亮在五丈原临终前的夜晚，抱病做的最后一件事是什么？',
        ['写给后主的遗嘱', '检查军中账目和士兵粮饷', '和部下告别', '修改《出师表》'],
        1, '诸葛亮临终前仍在检查军中账目和士兵粮饷，事必躬亲到最后。', ['名人故事', '诸葛亮'], 3),
      choiceQ('刘备白帝城托孤时对诸葛亮说"你若觉得后主不行，你就自己做皇帝"，诸葛亮的回应体现了他怎样的品质？',
        ['谦虚谨慎', '胸怀大志', '忠诚守信', '深谋远虑'],
        2, '诸葛亮誓死效忠，体现的是忠诚守信。', ['名人故事', '诸葛亮'], 2),
      choiceQ('文中提到诸葛亮"六出祁山，屡战屡败，屡败屡战"，却依然坚持北伐的根本原因是？',
        ['对刘备的承诺和托付', '想要统一天下', '证明自己的军事才能', '为蜀国争取更多领土'],
        0, '诸葛亮坚持北伐的根本动力是对刘备"兴复汉室"的承诺。', ['名人故事', '诸葛亮'], 3),
    ],
  },
];

async function main() {
  for (const q of quizzes) {
    try {
      const res = await createQuiz({ userId: 'cyan', ...q });
      console.log(`✅ ${q.date} ${q.tag}: ${res.questionCount} questions (${res.quizId})`);
    } catch (e) {
      console.error(`❌ ${q.date} ${q.tag}: ${e.message}`);
    }
  }
}
main().catch(console.error);
