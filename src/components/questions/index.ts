import ChoiceQuestion from './ChoiceQuestion';
import BlankQuestion from './BlankQuestion';
import RewriteQuestion from './RewriteQuestion';
import ReadingQuestion from './ReadingQuestion';

export const questionRenderers: Record<string, React.ComponentType<any>> = {
  choice: ChoiceQuestion,
  blank: BlankQuestion,
  rewrite: RewriteQuestion,
  reading: ReadingQuestion,
};

export { default as QuestionCard } from './QuestionCard';
export { default as ChoiceQuestion } from './ChoiceQuestion';
export { default as BlankQuestion } from './BlankQuestion';
export { default as RewriteQuestion } from './RewriteQuestion';
export { default as ReadingQuestion } from './ReadingQuestion';
