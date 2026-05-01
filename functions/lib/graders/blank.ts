export interface BlankGradeResult {
  correct: boolean;
  correctAnswer: string;
}

// Normalize: lowercase, strip punctuation/separators, collapse whitespace
function normBlank(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[×＊]/g, '*')       // normalize multiplication symbols
    .replace(/[÷／]/g, '/')       // normalize division symbols
    .replace(/[＝]/g, '=')        // normalize full-width equals
    .replace(/[;；,，]/g, ' ')   // treat ; , as spaces
    .replace(/[.!?。！？]+$/, '') // strip trailing punctuation
    .replace(/\s+/g, ' ')         // collapse whitespace
    .trim();
}

export function gradeBlank(qAnswer: any, qContent: any, userAnswer: string | undefined): BlankGradeResult {
  const userAns = normBlank(userAnswer || '');

  // qAnswer can be: string "peaceful", object {answers:["peaceful"]},
  // object {blanks:[{accepts:[...]}]}, or array for older multi-blank data.
  let expectedAnswers: string[] = [];
  if (typeof qAnswer === 'string') {
    expectedAnswers = [qAnswer];
  } else if (Array.isArray(qAnswer)) {
    expectedAnswers = qAnswer;
  } else if (Array.isArray(qAnswer.blanks) && qAnswer.blanks.length > 0) {
    expectedAnswers = qAnswer.blanks.map((b: any) => typeof b === 'string' ? b : ((b.accepts || [])[0] || b.answer || ''));
  } else if (qAnswer.answers) {
    expectedAnswers = Array.isArray(qAnswer.answers) ? qAnswer.answers : [qAnswer.answers];
  }

  // Accepted answers may live either in content.blanks (old format) or answer.blanks
  // (multi-field math/word-problem format: formula + answer).
  const answerBlanks = Array.isArray(qAnswer?.blanks) ? qAnswer.blanks : [];
  const contentBlanks = Array.isArray(qContent?.blanks) ? qContent.blanks : [];
  const accepts = contentBlanks[0]?.accepts || answerBlanks[0]?.accepts;
  const flatAccepted = accepts
    ? accepts.map((a: string) => normBlank(a))
    : expectedAnswers.map((a: string) => normBlank(a));

  // Multi-blank: also match per-blank individually
  const blanksDef = contentBlanks;
  let correct = false;

  if (blanksDef.length > 1) {
    // Front-end joins multi-field answers with newline. Preserve formula spaces;
    // only fall back to whitespace split for simple old data.
    let userParts = (userAnswer || '').split(/\r?\n/).map(normBlank).filter(Boolean);
    if (userParts.length !== blanksDef.length) {
      userParts = userAns.split(/\s+/);
    }

    const answerDefs = answerBlanks.length ? answerBlanks : blanksDef;
    let allBlanksCorrect = userParts.length === blanksDef.length;
    if (allBlanksCorrect) {
      for (let bi = 0; bi < blanksDef.length; bi++) {
        const blankAccepts = (answerDefs[bi]?.accepts || blanksDef[bi]?.accepts || []).map((a: string) => normBlank(a));
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

  const correctAnswer = expectedAnswers.join('\n') || '';
  return { correct, correctAnswer };
}
