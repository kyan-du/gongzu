#!/usr/bin/env node
// Backfill round 3: submissions + knowledge_mastery
const API_BASE = 'https://gongzu.pages.dev';
const KEY = 'gongzu-admin-402e83c1e2db3dc1';

async function submitAnswer(userId, questionId, quizId, answer, correct) {
  const res = await fetch(`${API_BASE}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionId, quizId, answer, correct }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// Map: date + tag -> quizId + questionIds (from the query above)
const submissions = [
  // 西游记 - 有答题记录的
  { date: '2026-03-05', quizId: '5b08b5e0-4773-47cc-a7d1-80cb2e328290', qId: 'c6658ce4-2ee9-4b6a-934a-1ad188d567d1', answer: 'A', correct: true },
  { date: '2026-03-11', quizId: '91fec731-aab2-44c4-92c4-a81db7a21917', qId: '8cbdd642-312d-4099-ae7e-97ffd07e41c4', answer: 'D', correct: true },
  { date: '2026-03-18', quizId: 'dcfc8dad-fb53-498f-a18f-2421d9d2f941', qId: '4b60efe9-3422-40cb-acb2-1253910b17b7', answer: 'D', correct: false },
  { date: '2026-03-22', quizId: '8d2cbd02-9030-434d-8274-b92da1921ee2', qId: 'ba8cdfd8-4d16-429c-a91a-b0a460404ae1', answer: 'A', correct: true },
  { date: '2026-03-24', quizId: '5b2fb00b-8e77-44b4-8149-471654aea212', qId: 'f6f77c84-87da-4ed6-a8f3-ac5595f58dfb', answer: 'C', correct: true },
  
  // 名人故事选择题 3/22 老子 (3 questions)
  { date: '2026-03-22', quizId: '7aafd80d-db07-4671-8482-835cb35e7ff4', qId: 'f92e4f57-b176-4080-8dcd-e601b765b2b7', answer: 'C', correct: true },
  { date: '2026-03-22', quizId: '7aafd80d-db07-4671-8482-835cb35e7ff4', qId: '9b55b1f5-77e5-49a1-8e75-f653dcd33456', answer: 'A', correct: true },
  { date: '2026-03-22', quizId: '7aafd80d-db07-4671-8482-835cb35e7ff4', qId: '5abf9e5e-fc59-4c50-ba8a-481f299cb1cd', answer: 'C', correct: false },
  
  // 名人故事选择题 3/24 张衡 (3 questions)
  { date: '2026-03-24', quizId: '65ae8e10-aabe-486a-bcc6-a6248c8b060d', qId: '0dc9d43d-2409-4d22-9368-01d92f04b821', answer: 'B', correct: true },
  { date: '2026-03-24', quizId: '65ae8e10-aabe-486a-bcc6-a6248c8b060d', qId: '09f79eb8-01c0-43c5-ba94-f2125310f72c', answer: 'C', correct: true },
  { date: '2026-03-24', quizId: '65ae8e10-aabe-486a-bcc6-a6248c8b060d', qId: 'da8c7d71-5152-409d-9ef9-3b1184656997', answer: 'C', correct: false },
];

async function main() {
  let success = 0, fail = 0;
  for (const s of submissions) {
    try {
      const res = await submitAnswer('cyan', s.qId, s.quizId, s.answer, s.correct);
      console.log(`✅ ${s.date} q=${s.qId.slice(0,8)} correct=${s.correct}`);
      success++;
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`❌ ${s.date} q=${s.qId.slice(0,8)}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${success} success, ${fail} fail`);
}

main().catch(console.error);
