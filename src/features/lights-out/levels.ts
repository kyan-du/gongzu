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
  level('four-ring', '5 环形闪烁', '外圈和内侧会互相影响，别急着乱点。', 4, [0, 3, 5, 6, 9, 10, 12, 15], 4),
  level('four-upper-wave', '6 上沿波纹', '先从上半区整理，别让亮灯一路传到底。', 4, [0, 1, 2, 4, 5, 6], 6),
  level('four-zigzag-lane', '7 折线通道', '亮灯像折线一样展开，适合练习逐行推进。', 4, [0, 1, 2, 3, 4, 5, 6], 5),
  level('four-double-row', '8 双排压制', '两排灯互相牵制，需要提前想好下一行。', 4, [0, 1, 2, 3, 4, 5, 6, 7], 6),
  level('five-star-path', '9 星路初开', '进入 5×5，大棋盘要学会分区处理。', 5, [2, 6, 8, 10, 12, 14, 16, 18, 22], 9),
  level('five-diamond-grid', '10 菱形迷阵', '亮灯更多，先找中心和边缘的联动关系。', 5, [0, 3, 6, 9, 12, 15, 18, 21, 24], 9),
];
