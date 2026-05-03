import { makeBoard } from './engine';
import type { LightsOutLevel } from './types';

const level = (id: string, title: string, subtitle: string, size: number, clicks: number[], optimalMoves: number): LightsOutLevel => ({
  id,
  title,
  subtitle,
  size,
  start: makeBoard(size, clicks),
  optimalMoves,
});

export const LIGHTS_OUT_LEVELS: LightsOutLevel[] = [
  level('three-cross', '1 十字初亮', '点击中心，观察上下左右怎么变化。', 3, [4], 1),
  level('three-corners', '2 角落呼应', '四个角会互相牵动，先找边角规律。', 3, [0, 2, 6, 8], 4),
  level('three-stairs', '3 阶梯光路', '像走楼梯一样一层层清掉亮灯。', 3, [0, 4, 8], 3),
  level('four-small', '4 四宫进阶', '变成 4×4，先从亮灯最多的一片下手。', 4, [1, 4, 6, 11, 14], 5),
  level('four-ring', '5 环形闪烁', '外圈和内侧会互相影响，别急着乱点。', 4, [0, 3, 5, 6, 9, 10, 12, 15], 8),
];
