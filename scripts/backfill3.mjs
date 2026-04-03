#!/usr/bin/env node
// Backfill submissions via wrangler d1 execute
import { execSync } from 'child_process';

function uuid() { return crypto.randomUUID(); }

// 已知答题记录: [quizId, questionId, answer, correct(1/0), date_approx_ts]
const submissions = [
  // 西游记
  ['5b08b5e0-4773-47cc-a7d1-80cb2e328290', 'c6658ce4-2ee9-4b6a-934a-1ad188d567d1', 'A', 1, '2026-03-05'],
  ['91fec731-aab2-44c4-92c4-a81db7a21917', '8cbdd642-312d-4099-ae7e-97ffd07e41c4', 'D', 1, '2026-03-11'],
  ['dcfc8dad-fb53-498f-a18f-2421d9d2f941', '4b60efe9-3422-40cb-acb2-1253910b17b7', 'D', 0, '2026-03-18'],
  ['8d2cbd02-9030-434d-8274-b92da1921ee2', 'ba8cdfd8-4d16-429c-a91a-b0a460404ae1', 'A', 1, '2026-03-22'],
  ['5b2fb00b-8e77-44b4-8149-471654aea212', 'f6f77c84-87da-4ed6-a8f3-ac5595f58dfb', 'C', 1, '2026-03-24'],
  
  // 名人故事 3/22 老子
  ['7aafd80d-db07-4671-8482-835cb35e7ff4', 'f92e4f57-b176-4080-8dcd-e601b765b2b7', 'C', 1, '2026-03-22'],
  ['7aafd80d-db07-4671-8482-835cb35e7ff4', '9b55b1f5-77e5-49a1-8e75-f653dcd33456', 'A', 1, '2026-03-22'],
  ['7aafd80d-db07-4671-8482-835cb35e7ff4', '5abf9e5e-fc59-4c50-ba8a-481f299cb1cd', 'C', 0, '2026-03-22'],
  
  // 名人故事 3/24 张衡
  ['65ae8e10-aabe-486a-bcc6-a6248c8b060d', '0dc9d43d-2409-4d22-9368-01d92f04b821', 'B', 1, '2026-03-24'],
  ['65ae8e10-aabe-486a-bcc6-a6248c8b060d', '09f79eb8-01c0-43c5-ba94-f2125310f72c', 'C', 1, '2026-03-24'],
  ['65ae8e10-aabe-486a-bcc6-a6248c8b060d', 'da8c7d71-5152-409d-9ef9-3b1184656997', 'C', 0, '2026-03-24'],
];

const stmts = [];
for (const [quizId, qId, answer, correct, date] of submissions) {
  const id = uuid();
  const ts = new Date(date + 'T19:00:00+08:00').getTime();
  stmts.push(`INSERT INTO submissions (id, user_id, question_id, quiz_id, answer, correct, submitted_at) VALUES ('${id}', 'cyan', '${qId}', '${quizId}', '${answer}', ${correct}, ${ts});`);
}

// knowledge_mastery for wrong answers
// 3/18 西游记 细节辨析
stmts.push(`INSERT INTO knowledge_mastery (id, user_id, knowledge_point, category, error_count, correct_streak, interval_days, next_review_at, last_error_at, last_review_at, created_at) VALUES ('${uuid()}', 'cyan', '细节辨析', '西游记', 1, 0, 1, '2026-03-19', '2026-03-18', '2026-03-18', ${Math.floor(new Date('2026-03-18T19:00:00+08:00').getTime()/1000)});`);
// 3/22 名人故事 老子  
stmts.push(`INSERT INTO knowledge_mastery (id, user_id, knowledge_point, category, error_count, correct_streak, interval_days, next_review_at, last_error_at, last_review_at, created_at) VALUES ('${uuid()}', 'cyan', '老子', '名人故事', 1, 0, 1, '2026-03-23', '2026-03-22', '2026-03-22', ${Math.floor(new Date('2026-03-22T20:00:00+08:00').getTime()/1000)});`);
// 3/24 名人故事 张衡
stmts.push(`INSERT INTO knowledge_mastery (id, user_id, knowledge_point, category, error_count, correct_streak, interval_days, next_review_at, last_error_at, last_review_at, created_at) VALUES ('${uuid()}', 'cyan', '张衡', '名人故事', 1, 0, 1, '2026-03-25', '2026-03-24', '2026-03-24', ${Math.floor(new Date('2026-03-24T20:00:00+08:00').getTime()/1000)});`);

const sql = stmts.join('\n');
console.log(`Executing ${stmts.length} statements...`);
console.log(sql);
