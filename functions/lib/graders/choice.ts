export interface ChoiceGradeResult {
  correct: boolean;
  correctAnswer: string;
}

export function gradeChoice(qAnswer: any, userAnswer: string | undefined): ChoiceGradeResult {
  let correct = false;
  let correctAnswer = '';

  if (qAnswer.correctIndex !== undefined) {
    // correctIndex is 0-based → convert to letter (0=A, 1=B, 2=C, 3=D)
    const correctLetter = String.fromCharCode(65 + qAnswer.correctIndex);
    correct = userAnswer?.toUpperCase() === correctLetter;
    correctAnswer = correctLetter;
  } else {
    correct = userAnswer?.toUpperCase() === qAnswer.answer?.toUpperCase();
    correctAnswer = qAnswer.answer || '';
  }

  return { correct, correctAnswer };
}
