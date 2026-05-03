export type OddBallMode = 'find-heavy';

export type OddBallLevel = {
  id: string;
  title: string;
  subtitle: string;
  ballCount: number;
  maxWeighs: number;
  mode: OddBallMode;
  strategyHint: string;
};

export type WeighResult = 'left-heavy' | 'right-heavy' | 'balanced';

export type WeighRecord = {
  left: number[];
  right: number[];
  result: WeighResult;
};

export type PanSide = 'left' | 'right' | 'pool';
