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

const makePuzzle = (id: string, title: string, cells: KakuroCell[][], solution: (number | null)[][]): KakuroPuzzle => ({
  id,
  title,
  rows: cells.length,
  cols: cells[0].length,
  cells,
  solution,
  ...makeRuns(cells),
});

function rectanglePuzzle(id: string, title: string, answer: number[][]): KakuroPuzzle {
  const cols = answer[0].length;
  const colSums = Array.from({ length: cols }, (_, c) => answer.reduce((sum, row) => sum + row[c], 0));
  const rowSums = answer.map(row => row.reduce((sum, n) => sum + n, 0));
  const cells: KakuroCell[][] = [
    [B(), ...colSums.map(sum => B(undefined, sum))],
    ...answer.map((_, r) => [B(rowSums[r]), ...Array.from({ length: cols }, () => P())]),
  ];
  const solution: (number | null)[][] = [
    Array(cols + 1).fill(null),
    ...answer.map(row => [null, ...row]),
  ];
  return makePuzzle(id, title, cells, solution);
}

export const KAKURO_LEVELS: KakuroPuzzle[] = [
  rectanglePuzzle('kakuro1', '1 三格起步', [
    [1, 2, 4],
    [2, 4, 3],
    [4, 3, 1],
  ]),
  rectanglePuzzle('kakuro2', '2 四格横竖', [
    [1, 3, 4, 2],
    [2, 4, 1, 3],
    [3, 1, 2, 4],
  ]),
  rectanglePuzzle('kakuro3', '3 交叉加深', [
    [2, 5, 1, 4],
    [3, 1, 4, 5],
    [5, 4, 2, 1],
    [1, 2, 5, 3],
  ]),
  rectanglePuzzle('kakuro4', '4 大和数训练', [
    [6, 1, 5, 2],
    [2, 6, 3, 5],
    [5, 3, 2, 6],
    [1, 5, 6, 3],
  ]),
  rectanglePuzzle('kakuro5', '5 五列迷阵', [
    [1, 4, 6, 2, 5],
    [3, 6, 2, 5, 1],
    [6, 2, 5, 1, 4],
    [2, 5, 1, 4, 6],
  ]),
  rectanglePuzzle('kakuro6', '6 五行推进', [
    [7, 1, 4, 6, 2],
    [2, 7, 6, 1, 4],
    [4, 6, 2, 7, 1],
    [1, 4, 7, 2, 6],
    [6, 2, 1, 4, 7],
  ]),
  rectanglePuzzle('kakuro7', '7 高位数字', [
    [8, 2, 5, 7, 1],
    [3, 8, 7, 1, 5],
    [5, 7, 1, 3, 8],
    [7, 1, 8, 5, 3],
    [1, 5, 3, 8, 7],
  ]),
  rectanglePuzzle('kakuro8', '8 六列挑战', [
    [1, 4, 7, 2, 6, 8],
    [2, 6, 8, 1, 4, 7],
    [4, 7, 1, 6, 8, 2],
    [6, 8, 2, 4, 7, 1],
    [8, 1, 4, 7, 2, 6],
  ]),
  rectanglePuzzle('kakuro9', '9 六行六列', [
    [9, 1, 5, 8, 2, 6],
    [1, 5, 8, 2, 6, 9],
    [5, 8, 2, 6, 9, 1],
    [8, 2, 6, 9, 1, 5],
    [2, 6, 9, 1, 5, 8],
    [6, 9, 1, 5, 8, 2],
  ]),
  rectanglePuzzle('kakuro10', '10 终极十关', [
    [3, 7, 9, 1, 5, 8],
    [8, 3, 1, 5, 9, 7],
    [7, 9, 5, 8, 1, 3],
    [1, 5, 8, 7, 3, 9],
    [5, 8, 3, 9, 7, 1],
    [9, 1, 7, 3, 8, 5],
  ]),
];
