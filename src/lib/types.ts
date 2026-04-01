// All question/quiz IDs are strings throughout the frontend.
// Backend may return numbers — normalize at the API boundary.

export interface Question {
  id: string;
  type: 'choice' | 'blank' | 'reading';
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
