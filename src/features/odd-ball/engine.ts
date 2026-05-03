import type { WeighResult } from './types';

export function createBalls(ballCount: number): number[] {
  return Array.from({ length: ballCount }, (_, index) => index + 1);
}

export function deterministicOddBall(levelId: string, ballCount: number): number {
  const seed = Array.from(levelId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (seed % ballCount) + 1;
}

export function weigh(left: number[], right: number[], oddBall: number): WeighResult {
  const leftHasOdd = left.includes(oddBall);
  const rightHasOdd = right.includes(oddBall);

  if (leftHasOdd && !rightHasOdd) return 'left-heavy';
  if (rightHasOdd && !leftHasOdd) return 'right-heavy';
  return 'balanced';
}

export function resultText(result: WeighResult): string {
  if (result === 'left-heavy') return '左边重';
  if (result === 'right-heavy') return '右边重';
  return '平衡';
}

export function resultHint(result: WeighResult): string {
  if (result === 'left-heavy') return '重球一定在左盘这些球里。';
  if (result === 'right-heavy') return '重球一定在右盘这些球里。';
  return '两边都不是重球，去没称的球里找。';
}
