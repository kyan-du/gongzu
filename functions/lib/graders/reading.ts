export interface ReadingGradeResult {
  correct: boolean;
  correctAnswer: string;
}

export function gradeReading(qAnswer: any, userAnswer: string | undefined): ReadingGradeResult {
  // answer is array like ["B", "A", "C"], user submits comma-separated "B,A,C"
  const userAnswers = (userAnswer || '').split(',').map((a: string) => a.trim().toUpperCase());
  const expectedAnswers = Array.isArray(qAnswer) ? qAnswer : (qAnswer.answers || []);
  const correct = expectedAnswers.length > 0 && expectedAnswers.every((exp: string, i: number) =>
    userAnswers[i]?.toUpperCase() === exp.toUpperCase()
  );
  const correctAnswer = expectedAnswers.join(',');
  return { correct, correctAnswer };
}
