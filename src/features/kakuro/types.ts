export type KakuroCellKind = 'block' | 'play';
export type KakuroClue = { right?: number; down?: number };
export type KakuroCell = { kind: 'block'; clue?: KakuroClue } | { kind: 'play' };
export type KakuroRun = { id: string; clue: number; cells: { row: number; col: number }[] };
export type KakuroPuzzle = { id: string; title: string; rows: number; cols: number; cells: KakuroCell[][]; acrossRuns: KakuroRun[]; downRuns: KakuroRun[]; solution: (number | null)[][] };
export type KakuroGrid = (number | null)[][];
export type KakuroCheck = { ok: boolean; message: string };
