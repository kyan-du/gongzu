export interface BlankGradeResult {
  correct: boolean;
  correctAnswer: string;
}

// Normalize: lowercase, strip punctuation/separators, collapse whitespace
function normBlank(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[;；,，]/g, ' ')   // treat ; , as spaces
    .replace(/[.!?。！？]+$/, '') // strip trailing punctuation
    .replace(/\s+/g, ' ')         // collapse whitespace
    .trim();
}

export function gradeBlank(qAnswer: any, qContent: any, userAnswer: string | undefined): BlankGradeResult {
  const userAns = normBlank(userAnswer || '');

  // qAnswer can be: string "peaceful", object {answers:["peaceful"]}, or "tall as" for multi-blank
  let expectedAnswers: string[] = [];
  if (typeof qAnswer === 'string') {
    expectedAnswers = [qAnswer];
  } else if (Array.isArray(qAnswer)) {
    expectedAnswers = qAnswer;
  } else if (qAnswer.answers) {
    expectedAnswers = Array.isArray(qAnswer.answers) ? qAnswer.answers : [qAnswer.answers];
  }

  // Single-blank: check accepts[0] or expectedAnswers
  const accepts = qContent.blanks?.[0]?.accepts;
  const flatAccepted = accepts
    ? accepts.map((a: string) => normBlank(a))
    : expectedAnswers.map((a: string) => normBlank(a));

  // Multi-blank: also match per-blank individually
  const blanksDef = qContent.blanks || [];
  let correct = false;

  if (blanksDef.length > 1) {
    // Split user answer into parts (front-end joins with space)
    const userParts = userAns.split(/\s+/);
    // Try per-blank matching: each part matches its blank's accepts
    let allBlanksCorrect = userParts.length === blanksDef.length;
    if (allBlanksCorrect) {
      for (let bi = 0; bi < blanksDef.length; bi++) {
        const blankAccepts = (blanksDef[bi].accepts || []).map((a: string) => normBlank(a));
        if (blankAccepts.length > 0) {
          allBlanksCorrect = blankAccepts.includes(userParts[bi]);
        } else {
          // No accepts for this blank, fall through to full-string match
          allBlanksCorrect = false;
          break;
        }
      }
    }
    correct = allBlanksCorrect || flatAccepted.some((a: string) => a === userAns);
  } else {
    correct = flatAccepted.some((a: string) => a === userAns);
  }

  const correctAnswer = expectedAnswers[0] || '';
  return { correct, correctAnswer };
}
