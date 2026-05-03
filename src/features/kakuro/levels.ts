import type { KakuroCell, KakuroPuzzle, KakuroRun } from './types';

const B = (right?: number, down?: number): KakuroCell => ({ kind: 'block', clue: { right, down } });
const P = (): KakuroCell => ({ kind: 'play' });
const makeRuns = (cells: KakuroCell[][]) => {
  const acrossRuns: KakuroRun[] = [];
  const downRuns: KakuroRun[] = [];
  for (let r = 0; r < cells.length; r += 1) for (let c = 0; c < cells[r].length; c += 1) {
    const cell = cells[r][c];
    if (cell.kind !== 'block') continue;
    if (cell.clue?.right) {
      const runCells = []; let cc = c + 1;
      while (cc < cells[r].length && cells[r][cc].kind === 'play') { runCells.push({ row: r, col: cc }); cc += 1; }
      acrossRuns.push({ id: `A${r}-${c}`, clue: cell.clue.right, cells: runCells });
    }
    if (cell.clue?.down) {
      const runCells = []; let rr = r + 1;
      while (rr < cells.length && cells[rr][c].kind === 'play') { runCells.push({ row: rr, col: c }); rr += 1; }
      downRuns.push({ id: `D${r}-${c}`, clue: cell.clue.down, cells: runCells });
    }
  }
  return { acrossRuns, downRuns };
};
const makePuzzle = (id: string, title: string, cells: KakuroCell[][], solution: (number | null)[][]): KakuroPuzzle => ({ id, title, rows: cells.length, cols: cells[0].length, cells, solution, ...makeRuns(cells) });

export const KAKURO_LEVELS: KakuroPuzzle[] = [
  makePuzzle('kakuro1', '入门：两格求和', [[B(),B(undefined,4),B(undefined,6),B()],[B(3),P(),P(),B()],[B(7),P(),P(),B()],[B(),B(),B(),B()]], [[null,null,null,null],[null,1,2,null],[null,3,4,null],[null,null,null,null]]),
  makePuzzle('kakuro2', '进阶：三格组合', [[B(),B(undefined,5),B(undefined,7),B(undefined,9),B()],[B(6),P(),P(),P(),B()],[B(15),P(),P(),P(),B()],[B(),B(),B(),B(),B()]], [[null,null,null,null,null],[null,1,2,3,null],[null,4,5,6,null],[null,null,null,null,null]]),
  makePuzzle('kakuro3', '交叉：横竖互锁', [[B(),B(undefined,7),B(undefined,9),B(undefined,11),B()],[B(9),P(),P(),P(),B()],[B(18),P(),P(),P(),B()],[B(),B(),B(),B(),B()]], [[null,null,null,null,null],[null,2,3,4,null],[null,5,6,7,null],[null,null,null,null,null]]),
  makePuzzle('kakuro4', '综合：多段求和', [[B(),B(undefined,9),B(undefined,11),B(undefined,13),B()],[B(12),P(),P(),P(),B()],[B(21),P(),P(),P(),B()],[B(),B(),B(),B(),B()]], [[null,null,null,null,null],[null,3,4,5,null],[null,6,7,8,null],[null,null,null,null,null]]),
];
