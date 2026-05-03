export type FutoshikiCell = { row: number; col: number };
export type FutoshikiRelation = { id: string; a: FutoshikiCell; b: FutoshikiCell; op: '<' | '>' };
export type FutoshikiPuzzle = { id: string; title: string; size: number; givens: Record<string, number>; relations: FutoshikiRelation[]; solution: number[][] };
export type FutoshikiGrid = (number | null)[][];
export type FutoshikiCheck = { ok: boolean; message: string };
