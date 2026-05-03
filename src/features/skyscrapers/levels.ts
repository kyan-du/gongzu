import { cluesFromSolution } from './engine';
import type { SkyscrapersPuzzle } from './types';

const makePuzzle = (id: string, title: string, solution: number[][], givens: Record<string, number> = {}): SkyscrapersPuzzle => ({
  id,
  title,
  size: 4,
  solution,
  givens,
  clues: cluesFromSolution(solution),
});

export const SKYSCRAPERS_LEVELS: SkyscrapersPuzzle[] = [
  makePuzzle('s1', '入门：从 4 开始看', [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]], { '0,3': 4, '3,0': 4 }),
  makePuzzle('s2', '进阶：两边一起看', [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]], { '0,2': 4, '2,3': 4 }),
  makePuzzle('s3', '链式：视线排除', [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]], { '0,1': 4, '2,0': 4 }),
  makePuzzle('s4', '综合：四边提示', [[4,3,2,1],[2,1,4,3],[3,4,1,2],[1,2,3,4]], { '0,0': 4, '3,3': 4 }),
];
