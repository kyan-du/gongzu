// API 调用库
const API_BASE = import.meta.env.DEV ? 'http://localhost:8788' : '';

export interface QuizContent {
  stem: string;
  options?: { label: string; text: string }[];
  blanks?: { hint: string; accepts: string[] }[];
  original?: string;
  instruction?: string;
  front?: string;
  back?: string;
}

export interface Question {
  id: string;
  type: 'choice' | 'blank' | 'rewrite' | 'card';
  content: QuizContent;
  answer: any;
  explanation?: string;
  tags?: string[];
  difficulty: number;
}

export interface DailyQuiz {
  id: string;
  userId: string;
  date: string;
  tag: string;
  title?: string;
  questions: Question[];
}

export interface SubmitAnswer {
  questionId: string;
  answer: any;
}

export interface SubmitResult {
  questionId: string;
  correct: boolean;
  score: number;
  correctAnswer: any;
  explanation?: string;
  feedback?: string;
}

// 登录
export async function login(passphrase: string, userId?: string) {
  const response = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passphrase, userId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

// 获取作业列表
export async function getQuizzes(userId?: string, date?: string) {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (date) params.append('date', date);

  const response = await fetch(`${API_BASE}/api/quiz?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch quizzes');
  }

  const data = await response.json();
  return data.quizzes as DailyQuiz[];
}

// 提交答案
export async function submitAnswers(quizId: string, answers: SubmitAnswer[]) {
  const response = await fetch(`${API_BASE}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quizId, answers }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Submit failed');
  }

  return response.json();
}

// 工具函数：格式化日期
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

// 工具函数：获取今天的日期字符串
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}
