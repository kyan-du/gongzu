// D1 数据库操作封装
import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  FAMILY_PASSPHRASE: string;
  ADMIN_API_KEY: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  created_at: number;
}

export interface Question {
  id: string;
  type: 'choice' | 'blank' | 'rewrite' | 'card';
  content: string; // JSON
  answer: string; // JSON
  explanation: string | null;
  tags: string | null; // JSON array
  difficulty: number;
  created_at: number;
}

export interface DailyQuiz {
  id: string;
  user_id: string;
  date: string;
  tag: string;
  title: string | null;
  question_ids: string; // JSON array
  created_at: number;
}

export interface Submission {
  id: string;
  user_id: string;
  question_id: string;
  quiz_id: string;
  answer: string; // JSON
  correct: number;
  score: number;
  ai_feedback: string | null;
  submitted_at: number;
}

// 生成 UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// 获取用户
export async function getUser(db: D1Database, userId: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<User>();
  return result;
}

// 获取每日作业
export async function getDailyQuizzes(
  db: D1Database,
  userId: string,
  date?: string
): Promise<DailyQuiz[]> {
  let query = 'SELECT * FROM daily_quizzes WHERE user_id = ?';
  const params: any[] = [userId];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  query += ' ORDER BY date DESC';

  const result = await db.prepare(query).bind(...params).all<DailyQuiz>();
  return result.results || [];
}

// 获取题目
export async function getQuestions(
  db: D1Database,
  questionIds: string[]
): Promise<Question[]> {
  if (questionIds.length === 0) return [];

  const placeholders = questionIds.map(() => '?').join(',');
  const query = `SELECT * FROM questions WHERE id IN (${placeholders})`;

  const result = await db.prepare(query).bind(...questionIds).all<Question>();
  return result.results || [];
}

// 创建每日作业
export async function createDailyQuiz(
  db: D1Database,
  quiz: Omit<DailyQuiz, 'id' | 'created_at'>
): Promise<string> {
  const id = generateId();
  const created_at = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      'INSERT INTO daily_quizzes (id, user_id, date, tag, title, question_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(id, quiz.user_id, quiz.date, quiz.tag, quiz.title, quiz.question_ids, created_at)
    .run();

  return id;
}

// 创建题目
export async function createQuestion(
  db: D1Database,
  question: Omit<Question, 'id' | 'created_at'>
): Promise<string> {
  const id = generateId();
  const created_at = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      'INSERT INTO questions (id, type, content, answer, explanation, tags, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      id,
      question.type,
      question.content,
      question.answer,
      question.explanation,
      question.tags,
      question.difficulty,
      created_at
    )
    .run();

  return id;
}

// 创建提交记录
export async function createSubmission(
  db: D1Database,
  submission: Omit<Submission, 'id' | 'submitted_at'>
): Promise<string> {
  const id = generateId();
  const submitted_at = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      'INSERT INTO submissions (id, user_id, question_id, quiz_id, answer, correct, score, ai_feedback, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      id,
      submission.user_id,
      submission.question_id,
      submission.quiz_id,
      submission.answer,
      submission.correct,
      submission.score,
      submission.ai_feedback,
      submitted_at
    )
    .run();

  return id;
}

// 获取提交记录
export async function getSubmissions(
  db: D1Database,
  quizId: string
): Promise<Submission[]> {
  const result = await db
    .prepare('SELECT * FROM submissions WHERE quiz_id = ?')
    .bind(quizId)
    .all<Submission>();
  return result.results || [];
}
