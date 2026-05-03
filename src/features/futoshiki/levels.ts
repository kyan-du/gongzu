import type { FutoshikiPuzzle } from './types';

export const FUTOSHIKI_LEVELS: FutoshikiPuzzle[] = [
  { id: 'f1', title: '入门：看清大小', size: 4, solution: [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]], givens: { '0,0': 1, '1,2': 1, '2,3': 3, '3,0': 4 }, relations: [
    { id: 'a', a: { row: 0, col: 0 }, b: { row: 0, col: 1 }, op: '<' },
    { id: 'b', a: { row: 0, col: 2 }, b: { row: 0, col: 3 }, op: '<' },
    { id: 'c', a: { row: 1, col: 0 }, b: { row: 1, col: 1 }, op: '<' },
    { id: 'd', a: { row: 2, col: 1 }, b: { row: 2, col: 2 }, op: '<' },
    { id: 'e', a: { row: 3, col: 0 }, b: { row: 3, col: 1 }, op: '>' },
  ]},
  { id: 'f2', title: '进阶：上下也比较', size: 4, solution: [[2,1,4,3],[4,3,2,1],[1,2,3,4],[3,4,1,2]], givens: { '0,2': 4, '1,3': 1, '2,0': 1, '3,2': 1 }, relations: [
    { id: 'a', a: { row: 0, col: 0 }, b: { row: 1, col: 0 }, op: '<' },
    { id: 'b', a: { row: 1, col: 1 }, b: { row: 2, col: 1 }, op: '>' },
    { id: 'c', a: { row: 2, col: 2 }, b: { row: 3, col: 2 }, op: '>' },
    { id: 'd', a: { row: 3, col: 0 }, b: { row: 3, col: 1 }, op: '<' },
    { id: 'e', a: { row: 0, col: 3 }, b: { row: 1, col: 3 }, op: '>' },
  ]},
  { id: 'f3', title: '链式：连续排除', size: 4, solution: [[3,4,1,2],[1,2,3,4],[4,3,2,1],[2,1,4,3]], givens: { '0,2': 1, '1,0': 1, '2,3': 1, '3,1': 1 }, relations: [
    { id: 'a', a: { row: 0, col: 0 }, b: { row: 0, col: 1 }, op: '<' },
    { id: 'b', a: { row: 1, col: 0 }, b: { row: 1, col: 1 }, op: '<' },
    { id: 'c', a: { row: 1, col: 2 }, b: { row: 1, col: 3 }, op: '<' },
    { id: 'd', a: { row: 2, col: 0 }, b: { row: 3, col: 0 }, op: '>' },
    { id: 'e', a: { row: 3, col: 2 }, b: { row: 3, col: 3 }, op: '>' },
  ]},
  { id: 'f4', title: '综合：横竖混合', size: 4, solution: [[4,3,2,1],[2,1,4,3],[3,4,1,2],[1,2,3,4]], givens: { '0,0': 4, '1,1': 1, '2,2': 1, '3,3': 4 }, relations: [
    { id: 'a', a: { row: 0, col: 0 }, b: { row: 0, col: 1 }, op: '>' },
    { id: 'b', a: { row: 0, col: 2 }, b: { row: 1, col: 2 }, op: '<' },
    { id: 'c', a: { row: 1, col: 2 }, b: { row: 1, col: 3 }, op: '>' },
    { id: 'd', a: { row: 2, col: 0 }, b: { row: 2, col: 1 }, op: '<' },
    { id: 'e', a: { row: 3, col: 0 }, b: { row: 3, col: 1 }, op: '<' },
  ]},
];
