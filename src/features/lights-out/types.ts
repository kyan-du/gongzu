export type LightsOutLevel = {
  id: string;
  title: string;
  subtitle: string;
  size: number;
  start: boolean[];
  optimalMoves: number;
};

export type LightsOutMove = {
  index: number;
  before: boolean[];
  after: boolean[];
};
