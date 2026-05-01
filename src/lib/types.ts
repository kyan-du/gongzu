// All question/quiz IDs are strings throughout the frontend.
// Backend may return numbers — normalize at the API boundary.

export interface GeometrySpec {
  points: Record<string, [number, number]>;
  segments?: { from: string; to: string; style?: string; color?: string; label?: string; text?: string }[];
  angles?: { points: [string, string, string]; type?: string; label?: string }[];
  highlights?: { from: string; to: string; color?: string; label?: string; text?: string }[];
  equalMarks?: [string, string][];
  labels?: Record<string, [number, number]>;
  sideLabels?: { from: string; to: string; text?: string; label?: string; offset?: number; color?: string }[];
  boundingBox?: [number, number, number, number];
  angleLabels?: { vertex: string; from: string; to: string; text: string }[];
}

export interface Question {
  id: string;
  type: 'choice' | 'blank' | 'reading' | 'rewrite' | 'judgment' | 'proof';
  content: any;
  answer: any;
  explanation?: string;
  tags?: string[];
}

export interface Quiz {
  id: string;
  date: string;
  tag: string;
  title: string;
  passage?: string | null;
  questions: Question[];
}

export interface SubmissionResult {
  questionId: string;
  answer: string;
  correct: boolean;
  correctAnswer: string;
}

export interface QuizStatus {
  completed: boolean;
  answered: number;
  total: number;
  correct: number;
  accuracy: number | null;
}

// Normalize API response: coerce all IDs to strings
export function normalizeQuiz(raw: any): Quiz {
  return {
    ...raw,
    id: String(raw.id),
    questions: (raw.questions || []).map((q: any) => ({
      ...q,
      id: String(q.id),
    })),
  };
}

export function normalizeSubmissionResults(results: any[]): SubmissionResult[] {
  return results.map((r: any) => ({
    ...r,
    questionId: String(r.questionId),
  }));
}

// ========== 父母端数据类型 ==========

export interface DayData {
  date: string;
  total: number;
  completed: number;
  correct: number;
  rate: number;
}

export interface TagData {
  tag: string;
  total: number;
  correct: number;
  rate: number;
}

export interface ParentDashboardData {
  today: {
    total: number;
    completed: number;
    correct: number;
    rate: number;
  };
  history: DayData[];
  byTag: TagData[];
  memoryGames?: {
    completed: number;
    target: number;
  };
  memoryAvgAccuracy?: number;
}

export interface UserModule {
  module: string;
  enabled: boolean;
  isTask: boolean;
  dailyTarget: number | null;
  config: Record<string, any>;
}

export interface QuizTagConfig {
  tag: string;
  count: number;
  prompt: string;
  enabled?: boolean;
  // 向后兼容字段
  type?: string;
  focus?: string[];
  exclude?: string[];
  difficulty?: number;
  schedule?: string;
  config?: Record<string, any>;
  [key: string]: any;
}
