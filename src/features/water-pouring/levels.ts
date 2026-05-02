import type { WaterLevelDef } from './types';
const colors = ['from-blue-400 to-cyan-500', 'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500'];
const c = (i: number) => colors[i % colors.length];
export const WATER_LEVELS: WaterLevelDef[] = [
  { id: 'three-five-four', title: '1 经典 3 和 5', subtitle: '用 3L 和 5L 杯量出 4L。', target: { amount: 4 }, optimalMoves: 6, jugs: [{ id: 'a', name: '3L杯', capacity: 3, color: c(0) }, { id: 'b', name: '5L杯', capacity: 5, color: c(1) }] },
  { id: 'four-seven-five', title: '2 反复倒换', subtitle: '用 4L 和 7L 杯量出 5L，需要来回倒换。', target: { amount: 5 }, optimalMoves: 8, jugs: [{ id: 'a', name: '4L杯', capacity: 4, color: c(0) }, { id: 'b', name: '7L杯', capacity: 7, color: c(1) }] },
  { id: 'four-nine-six', title: '3 差量挑战', subtitle: '用 4L 和 9L 杯量出 6L，别被大杯迷惑。', target: { amount: 6 }, optimalMoves: 8, jugs: [{ id: 'a', name: '4L杯', capacity: 4, color: c(0) }, { id: 'b', name: '9L杯', capacity: 9, color: c(1) }] },
  { id: 'six-ten-eight', title: '4 先倒再留', subtitle: '用 6L 和 10L 杯量出 8L。', target: { amount: 8 }, optimalMoves: 6, jugs: [{ id: 'a', name: '6L杯', capacity: 6, color: c(0) }, { id: 'b', name: '10L杯', capacity: 10, color: c(1) }] },
  { id: 'three-five-eight-four', title: '5 三个杯子', subtitle: '多一个 8L 杯，量出 4L。', target: { amount: 4 }, optimalMoves: 6, jugs: [{ id: 'a', name: '3L杯', capacity: 3, color: c(0) }, { id: 'b', name: '5L杯', capacity: 5, color: c(1) }, { id: 'c', name: '8L杯', capacity: 8, color: c(2) }] },
  { id: 'six-seven-ten-five', title: '6 三杯进阶', subtitle: '用 6L、7L、10L 杯量出 5L。', target: { amount: 5 }, optimalMoves: 4, jugs: [{ id: 'a', name: '6L杯', capacity: 6, color: c(0) }, { id: 'b', name: '7L杯', capacity: 7, color: c(1) }, { id: 'c', name: '10L杯', capacity: 10, color: c(2) }] },
  { id: 'nine-fourteen-twelve', title: '7 大杯来回倒', subtitle: '用 9L 和 14L 杯量出 12L，要反复腾挪。', target: { amount: 12 }, optimalMoves: 18, jugs: [{ id: 'a', name: '9L杯', capacity: 9, color: c(0) }, { id: 'b', name: '14L杯', capacity: 14, color: c(1) }] },
  { id: 'eleven-fourteen-ten', title: '8 接近满杯', subtitle: '用 11L 和 14L 杯量出 10L，关键是控制差量。', target: { amount: 10 }, optimalMoves: 18, jugs: [{ id: 'a', name: '11L杯', capacity: 11, color: c(0) }, { id: 'b', name: '14L杯', capacity: 14, color: c(1) }] },
  { id: 'ten-seventeen-eight', title: '9 大容量烧脑', subtitle: '用 10L 和 17L 杯量出 8L，步骤长，别急。', target: { amount: 8 }, optimalMoves: 18, jugs: [{ id: 'a', name: '10L杯', capacity: 10, color: c(0) }, { id: 'b', name: '17L杯', capacity: 17, color: c(1) }] },
  { id: 'six-ten-fifteen-one', title: '10 压轴 1L', subtitle: '量出 1L，考验反复倒换。', target: { amount: 1 }, optimalMoves: 6, jugs: [{ id: 'a', name: '6L杯', capacity: 6, color: c(0) }, { id: 'b', name: '10L杯', capacity: 10, color: c(1) }, { id: 'c', name: '15L杯', capacity: 15, color: c(2) }] },
];
