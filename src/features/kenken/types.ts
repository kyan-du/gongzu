export type KenKenOp = '+' | '-' | '×' | '÷' | '=';
export type KenKenCell = { row: number; col: number };
export type KenKenCage = { id: string; cells: KenKenCell[]; target: number; op: KenKenOp };
export type KenKenPuzzle = { id: string; title: string; size: number; cages: KenKenCage[]; solution: number[][] };
export type KenKenGrid = (number | null)[][];
export type KenKenCheck = { ok: boolean; message: string };
