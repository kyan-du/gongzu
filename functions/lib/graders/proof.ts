export interface ProofGradeResult {
  correct: boolean;
  correctAnswer: string;
  aiFeedback: string;
  aiScore: number | undefined;
}

export async function gradeProof(
  qAnswer: any,
  qContent: any,
  userAnswer: string | undefined,
  env: { AI_PROXY_KEY: string; R2: R2Bucket }
): Promise<ProofGradeResult> {
  // AI-powered judging for handwritten proof/solution
  const { judgeProof } = await import('../ai-judge-proof');
  const solution = typeof qAnswer === 'string' ? qAnswer : (qAnswer.solution || qAnswer.answer || '');
  const finalAnswer = qAnswer.finalAnswer || '';
  const expectedDesc = finalAnswer ? `${solution}\n最终答案：${finalAnswer}` : solution;
  const imageKey = userAnswer || '';  // R2 key from upload

  try {
    const judgeResult = await judgeProof({
      stem: qContent.stem || '',
      expectedAnswer: expectedDesc,
      imageKey,
    }, { AI_PROXY_KEY: env.AI_PROXY_KEY, R2: env.R2 });

    return {
      correct: judgeResult.correct,
      correctAnswer: finalAnswer || solution,
      aiFeedback: judgeResult.feedback,
      aiScore: judgeResult.score,
    };
  } catch (e: any) {
    // If AI judge fails, mark as needs-review
    return {
      correct: false,
      correctAnswer: finalAnswer || solution,
      aiFeedback: `AI判分暂时不可用：${e.message}。请等待老师批改。`,
      aiScore: undefined,
    };
  }
}
