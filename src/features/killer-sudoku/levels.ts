import type { KillerPuzzle } from './types';

export const KILLER_SUDOKU_LEVELS: KillerPuzzle[] = [
  { id: 'ks1', title: '入门：看小笼和', size: 4, boxSize: 2, solution: [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]], cages: [
    { id:'a', sum:3, cells:[{row:0,col:0},{row:0,col:1}] }, { id:'b', sum:7, cells:[{row:0,col:2},{row:0,col:3}] },
    { id:'c', sum:7, cells:[{row:1,col:0},{row:1,col:1}] }, { id:'d', sum:3, cells:[{row:1,col:2},{row:1,col:3}] },
    { id:'e', sum:3, cells:[{row:2,col:0},{row:2,col:1}] }, { id:'f', sum:7, cells:[{row:2,col:2},{row:2,col:3}] },
    { id:'g', sum:7, cells:[{row:3,col:0},{row:3,col:1}] }, { id:'h', sum:3, cells:[{row:3,col:2},{row:3,col:3}] },
  ]},
  { id: 'ks2', title: '进阶：竖向小笼', size: 4, boxSize: 2, solution: [[1,3,2,4],[4,2,1,3],[2,4,3,1],[3,1,4,2]], cages: [
    { id:'a', sum:5, cells:[{row:0,col:0},{row:1,col:0}] }, { id:'b', sum:5, cells:[{row:0,col:1},{row:1,col:1}] },
    { id:'c', sum:3, cells:[{row:0,col:2},{row:1,col:2}] }, { id:'d', sum:7, cells:[{row:0,col:3},{row:1,col:3}] },
    { id:'e', sum:5, cells:[{row:2,col:0},{row:3,col:0}] }, { id:'f', sum:5, cells:[{row:2,col:1},{row:3,col:1}] },
    { id:'g', sum:7, cells:[{row:2,col:2},{row:3,col:2}] }, { id:'h', sum:3, cells:[{row:2,col:3},{row:3,col:3}] },
  ]},
  { id: 'ks3', title: '链式：宫内排除', size: 4, boxSize: 2, solution: [[2,1,4,3],[3,4,1,2],[1,2,3,4],[4,3,2,1]], cages: [
    { id:'a', sum:3, cells:[{row:0,col:0},{row:0,col:1}] }, { id:'b', sum:7, cells:[{row:0,col:2},{row:0,col:3}] },
    { id:'c', sum:7, cells:[{row:1,col:0},{row:1,col:1}] }, { id:'d', sum:3, cells:[{row:1,col:2},{row:1,col:3}] },
    { id:'e', sum:3, cells:[{row:2,col:0},{row:2,col:1}] }, { id:'f', sum:7, cells:[{row:2,col:2},{row:2,col:3}] },
    { id:'g', sum:7, cells:[{row:3,col:0},{row:3,col:1}] }, { id:'h', sum:3, cells:[{row:3,col:2},{row:3,col:3}] },
  ]},
  { id: 'ks4', title: '综合：横竖混合笼', size: 4, boxSize: 2, solution: [[4,1,3,2],[2,3,1,4],[1,4,2,3],[3,2,4,1]], cages: [
    { id:'a', sum:5, cells:[{row:0,col:0},{row:0,col:1}] }, { id:'b', sum:5, cells:[{row:0,col:2},{row:0,col:3}] },
    { id:'c', sum:7, cells:[{row:1,col:0},{row:2,col:0},{row:2,col:1}] }, { id:'d', sum:4, cells:[{row:1,col:1},{row:1,col:2}] },
    { id:'e', sum:7, cells:[{row:1,col:3},{row:2,col:3}] }, { id:'f', sum:2, cells:[{row:2,col:2}] },
    { id:'g', sum:5, cells:[{row:3,col:0},{row:3,col:1}] }, { id:'h', sum:5, cells:[{row:3,col:2},{row:3,col:3}] },
  ]},
];
