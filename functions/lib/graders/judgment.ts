export interface JudgmentGradeResult {
  correct: boolean;
  correctAnswer: string;
}

export function gradeJudgment(qAnswer: any, userAnswer: string | undefined): JudgmentGradeResult {
  const expectedCorrect = qAnswer.correct;
  const userBool = userAnswer === 'true';
  const correct = userBool === expectedCorrect;
  const correctAnswer = expectedCorrect ? 'true' : 'false';
  return { correct, correctAnswer };
}
