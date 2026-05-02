import type { WaterLevelDef } from './types';
const colors = ['from-blue-400 to-cyan-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500'];
const c = (i: number) => colors[i % colors.length];
export const WATER_LEVELS: WaterLevelDef[] = [
  { id: 'three-five-four', title: '1 经典 3 和 5', subtitle: '用 3L 和 5L 杯量出 4L。', target: { amount: 4 }, optimalMoves: 6, jugs: [{ id: 'a', name: '3L杯', capacity: 3, color: c(0) }, { id: 'b', name: '5L杯', capacity: 5, color: c(1) }] },
  { id: 'two-seven-five', title: '2 小杯配大杯', subtitle: '用 2L 和 7L 杯量出 5L。', target: { amount: 5 }, optimalMoves: 2, jugs: [{ id: 'a', name: '2L杯', capacity: 2, color: c(0) }, { id: 'b', name: '7L杯', capacity: 7, color: c(1) }] },
  { id: 'four-nine-one', title: '3 量出 1L', subtitle: '差一点点最关键。', target: { amount: 1 }, optimalMoves: 4, jugs: [{ id: 'a', name: '4L杯', capacity: 4, color: c(0) }, { id: 'b', name: '9L杯', capacity: 9, color: c(1) }] },
  { id: 'six-ten-eight', title: '4 先倒再留', subtitle: '用 6L 和 10L 杯量出 8L。', target: { amount: 8 }, optimalMoves: 6, jugs: [{ id: 'a', name: '6L杯', capacity: 6, color: c(0) }, { id: 'b', name: '10L杯', capacity: 10, color: c(1) }] },
  { id: 'three-five-eight-four', title: '5 三个杯子', subtitle: '多一个 8L 杯，量出 4L。', target: { amount: 4 }, optimalMoves: 6, jugs: [{ id: 'a', name: '3L杯', capacity: 3, color: c(0) }, { id: 'b', name: '5L杯', capacity: 5, color: c(1) }, { id: 'c', name: '8L杯', capacity: 8, color: c(2) }] },
  { id: 'six-seven-ten-five', title: '6 三杯进阶', subtitle: '用 6L、7L、10L 杯量出 5L。', target: { amount: 5 }, optimalMoves: 4, jugs: [{ id: 'a', name: '6L杯', capacity: 6, color: c(0) }, { id: 'b', name: '7L杯', capacity: 7, color: c(1) }, { id: 'c', name: '10L杯', capacity: 10, color: c(2) }] },
  { id: 'eight-eleven-fourteen-six', title: '7 大杯挑战', subtitle: '杯子变大，但规则不变。', target: { amount: 6 }, optimalMoves: 6, jugs: [{ id: 'a', name: '8L杯', capacity: 8, color: c(0) }, { id: 'b', name: '11L杯', capacity: 11, color: c(1) }, { id: 'c', name: '14L杯', capacity: 14, color: c(2) }] },
  { id: 'four-seven-nine-two', title: '8 量出 2L', subtitle: '目标很小，步骤不能乱。', target: { amount: 2 }, optimalMoves: 4, jugs: [{ id: 'a', name: '4L杯', capacity: 4, color: c(0) }, { id: 'b', name: '7L杯', capacity: 7, color: c(1) }, { id: 'c', name: '9L杯', capacity: 9, color: c(2) }] },
  { id: 'five-nine-twelve-three', title: '9 三杯烧脑', subtitle: '用 5L、9L、12L 杯量出 3L。', target: { amount: 3 }, optimalMoves: 4, jugs: [{ id: 'a', name: '5L杯', capacity: 5, color: c(0) }, { id: 'b', name: '9L杯', capacity: 9, color: c(1) }, { id: 'c', name: '12L杯', capacity: 12, color: c(2) }] },
  { id: 'six-ten-fifteen-one', title: '10 压轴 1L', subtitle: '量出 1L，考验反复倒换。', target: { amount: 1 }, optimalMoves: 6, jugs: [{ id: 'a', name: '6L杯', capacity: 6, color: c(0) }, { id: 'b', name: '10L杯', capacity: 10, color: c(1) }, { id: 'c', name: '15L杯', capacity: 15, color: c(2) }] },
];
