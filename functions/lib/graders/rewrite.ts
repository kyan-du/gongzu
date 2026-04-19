export interface RewriteGradeResult {
  correct: boolean;
  correctAnswer: string;
  aiFeedback: string;
  aiScore: number | undefined;
}

export async function gradeRewrite(
  qAnswer: any,
  qContent: any,
  userAnswer: string | undefined,
  env: { AI_PROXY_KEY: string }
): Promise<RewriteGradeResult> {
  // AI-powered judging for rewrite questions
  const { judgeRewrite } = await import('../ai-judge');
  const expectedAnswer = typeof qAnswer === 'string' ? qAnswer : (qAnswer.answer || qAnswer.answers?.[0] || '');
  const judgeResult = await judgeRewrite({
    instruction: qContent.stem || qContent.instruction || '请改写下列句子',
    original: qContent.original || '',
    correctAnswer: expectedAnswer,
    studentAnswer: userAnswer || '',
  }, { AI_PROXY_KEY: env.AI_PROXY_KEY });

  return {
    correct: judgeResult.correct,
    correctAnswer: judgeResult.correctedAnswer || expectedAnswer,
    aiFeedback: judgeResult.feedback,
    aiScore: judgeResult.score,
  };
}
