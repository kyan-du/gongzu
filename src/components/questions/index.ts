import ChoiceQuestion from './ChoiceQuestion';
import BlankQuestion from './BlankQuestion';
import RewriteQuestion from './RewriteQuestion';
import ReadingQuestion from './ReadingQuestion';
import JudgmentQuestion from './JudgmentQuestion';
import ProofQuestion from './ProofQuestion';

export const questionRenderers: Record<string, React.ComponentType<any>> = {
  choice: ChoiceQuestion,
  blank: BlankQuestion,
  rewrite: RewriteQuestion,
  reading: ReadingQuestion,
  judgment: JudgmentQuestion,
  proof: ProofQuestion,
};

export { default as QuestionCard } from './QuestionCard';
export { default as ChoiceQuestion } from './ChoiceQuestion';
export { default as BlankQuestion } from './BlankQuestion';
export { default as RewriteQuestion } from './RewriteQuestion';
export { default as ReadingQuestion } from './ReadingQuestion';
export { default as JudgmentQuestion } from './JudgmentQuestion';
export { default as ProofQuestion } from './ProofQuestion';
