export type KillerCell = { row: number; col: number };
export type KillerCage = { id: string; sum: number; cells: KillerCell[] };
export type KillerPuzzle = { id: string; title: string; size: number; boxSize: number; cages: KillerCage[]; solution: number[][] };
export type KillerGrid = (number | null)[][];
export type KillerCheck = { ok: boolean; message: string };
