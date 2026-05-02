export type JugId = string;
export type WaterLevel = Record<JugId, number>;
export type Jug = { id: JugId; name: string; capacity: number; color: string };
export type WaterLevelDef = { id: string; title: string; subtitle: string; jugs: Jug[]; target: { amount: number; jugId?: JugId }; optimalMoves?: number };
export type MoveRecord = { action: string; before: WaterLevel; after: WaterLevel };
