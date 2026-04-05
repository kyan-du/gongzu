/**
 * 格式化时间戳为友好的相对时间
 * @param ts Unix 时间戳（秒）
 * @returns 如 "刚刚"、"5分钟前"、"3小时前"、"2天前"
 */
export function formatAgo(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return new Date(ts * 1000).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 根据正确率返回颜色类名（支持深色模式）
 * @param rate 正确率 0-1
 * @returns Tailwind 颜色类名
 */
export function rateColor(rate: number): string {
  if (rate >= 0.8) return 'text-green-600 dark:text-green-400';
  if (rate >= 0.6) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * 根据正确率返回背景颜色类名（支持深色模式）
 * @param rate 正确率 0-1
 * @returns Tailwind 背景色类名
 */
export function rateBg(rate: number): string {
  if (rate >= 0.8) return 'bg-green-50 dark:bg-green-900/20';
  if (rate >= 0.6) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}
