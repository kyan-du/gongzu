import type { Matrix, GamePuzzle } from '../../../lib/grid-engine';
import { CELL_SIZES, MiniGridRenderer } from './cells';

type HiddenCell = { row: number; col: number };

type MemoryMatrixProps = {
  puzzle: GamePuzzle;
  hidePhase1: boolean;
  hidePhase2: boolean;
  matrixOverride?: Matrix;
  hiddenOverride?: HiddenCell[];
};

export function MemoryMatrix({ puzzle, hidePhase1, hidePhase2, matrixOverride, hiddenOverride }: MemoryMatrixProps) {
  const mat = matrixOverride || puzzle.matrix;
  const hiddenCells = hiddenOverride || [
    ...(hidePhase1 ? [puzzle.phase1Hidden] : []),
    ...(hidePhase2 ? puzzle.phase2Hidden : []),
  ];
  let hiddenCounter = 0;
  return (
    <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto select-none">
      {mat.map((row, rowIdx) =>
        row.map((miniGrid, colIdx) => {
          const isHidden = hiddenCells.some((h) => h.row === rowIdx && h.col === colIdx);
          if (isHidden) hiddenCounter++;

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className="aspect-square flex items-center justify-center rounded-lg border-[3px] border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800 relative overflow-hidden"
              style={{ containerType: 'inline-size' }}
            >
              {/* 虚线十字分隔线 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 border-t-2 border-dashed border-gray-400 dark:border-gray-600" />
                <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-400 dark:border-gray-600" />
              </div>
              {isHidden ? (
                <div className="grid grid-cols-2 w-full h-full relative z-10">
                  {[1, 2, 3, 4].map((n) => {
                    // 按矩阵从上到下、从左到右的顺序编号：第一个隐藏格 1-4，第二个 5-8
                    const baseNum = (hiddenCounter - 1) * 4;
                    return (
                      <div key={n} className="flex items-center justify-center overflow-hidden">
                      <span className="font-black text-gray-800 dark:text-gray-200" style={{
                        fontSize: CELL_SIZES.question.fontSize,
                        lineHeight: '1',
                        transform: `translate(${CELL_SIZES.question.offset.x}px, ${CELL_SIZES.question.offset.y}px)`,
                      }}>
                        ?<sub style={{ fontSize: CELL_SIZES.question.subSize }}>{baseNum + n}</sub>
                      </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <MiniGridRenderer grid={miniGrid} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
