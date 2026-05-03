export type SkyscrapersClues = { top: number[]; right: number[]; bottom: number[]; left: number[] };
export type SkyscrapersPuzzle = { id: string; title: string; size: number; clues: SkyscrapersClues; givens: Record<string, number>; solution: number[][] };
export type SkyscrapersGrid = (number | null)[][];
export type SkyscrapersCheck = { ok: boolean; message: string };
