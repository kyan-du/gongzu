import type { CellContent, MiniGrid } from '../../../lib/grid-engine';

// 各类图形的尺寸定义 — 都基于宫格象限大小独立调整
export const CELL_SIZES = {
  emoji: {
    normal: '3.2rem',
    scaled: '1.8rem',
    grown: '4.2rem',
    normalOffset: { x: 0, y: 0 },
    scaledOffset: { x: 0, y: 0 },
    rotationOffset: { x: 0, y: 0 },
    mirrorOffset: { x: 0, y: 0 },
  },
  broken: {
    size: '50px',
    offset: { x: 0, y: 0 },
  },
  question: {
    fontSize: '3.2rem',
    subSize: '0.4em',
    offset: { x: 5, y: -4 },
  },
  grid: {
    boxSize: 120,
    gap: 8,
    dashWidth: 2,
  },
  small: {
    emoji: {
      normal: '2.0rem',
      scaled: '1.2rem',
      grown: '2.5rem',
    },
    broken: {
      size: '28px',
    },
    question: {
      fontSize: '1.5rem',
      subSize: '0.4em',
    },
  },
} as const;
function BrokenImageIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`w-full h-full text-gray-400 dark:text-gray-500 ${className}`}>
      <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <path d="M2 17l5.5-5.5 3 3 5-5L22 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 渲染单个 Cell（带变换）— 各类图形独立尺寸
export function CellRenderer({ content, size = 'normal', index }: { content: CellContent | null; size?: 'normal' | 'small'; index?: number }) {
  // null = 未作答，显示 ?N
  if (!content) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-600 font-bold" style={{ fontSize: '1.4rem' }}>
          ?{index !== undefined ? <sub style={{ fontSize: '0.75rem' }}>{index + 1}</sub> : ''}
        </span>
      </div>
    );
  }
  if (content.type === 'blank') {
    return <div className="w-full h-full" />;
  }

  if (content.type === 'broken') {
    const brokenSize = size === 'small' ? CELL_SIZES.small.broken.size : CELL_SIZES.broken.size;
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: brokenSize, height: brokenSize }}>
          <BrokenImageIcon />
        </div>
      </div>
    );
  }

  if (content.type === 'pass') {
    const passSize = size === 'small' ? CELL_SIZES.small.emoji.normal : CELL_SIZES.emoji.normal;
    return (
      <div className="w-full h-full flex items-center justify-center leading-none" style={{ fontSize: passSize }}>
        🔍
      </div>
    );
  }

  const rotation = content.rotation || 0;
  const mirror = content.mirror || 'none';
  const scaled = content.scaled || false;
  const grown = content.grown || false;

  let transform = '';
  if (rotation !== 0) transform += `rotate(${rotation}deg) `;
  if (mirror === 'horizontal') transform += 'scaleX(-1) ';
  if (mirror === 'vertical') transform += 'scaleY(-1) ';

  // emoji 大小：正常 vs 缩小 vs 放大，各有独立定义
  const sizeConfig = size === 'small' ? CELL_SIZES.small.emoji : CELL_SIZES.emoji;
  const fontSize = grown ? sizeConfig.grown : scaled ? sizeConfig.scaled : sizeConfig.normal;

  return (
    <div
      className="w-full h-full flex items-center justify-center leading-none overflow-hidden"
      style={{
        fontSize,
        transform: transform.trim() || undefined,
      }}
    >
      {content.emoji}
    </div>
  );
}

// 渲染 2×2 MiniGrid — 带虚线十字分隔（贯穿全格）
export function MiniGridRenderer({ grid, size = 'normal' }: { grid: MiniGrid; size?: 'normal' | 'small' }) {
  return (
    <div className="relative grid grid-cols-2 w-full h-full">
      {/* 虚线十字分隔线 — 贯穿 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
        <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
      </div>
      {grid.map((cell, i) => (
        <div key={i} className="flex items-center justify-center aspect-square relative z-10">
          <CellRenderer content={cell} size={size} />
        </div>
      ))}
    </div>
  );
}
