import { useState, type MutableRefObject, type DragEvent } from 'react';
import type { CellContent, GamePuzzle } from '../../../lib/grid-engine';
import { CellRenderer } from './cells';

type AnswerInterfaceProps = {
  puzzle: GamePuzzle;
  isPhase1: boolean;
  currentAnswerIndex: number;
  phase1Answers: CellContent[];
  phase2Answers: CellContent[];
  setCurrentAnswerIndex: (index: number) => void;
  setPhase1Answers: (answers: CellContent[]) => void;
  setPhase2Answers: (answers: CellContent[]) => void;
  onPhase1Submit: () => void;
  onPhase2Submit: () => void;
  dragDroppedRef: MutableRefObject<boolean>;
};

function findNextEmpty(answers: (CellContent | null)[], fromIndex: number, max: number): number {
  // 从 fromIndex+1 开始往后找
  for (let i = fromIndex + 1; i < max; i++) {
    if (!answers[i]) return i;
  }
  // 往前找（环绕）
  for (let i = 0; i < fromIndex; i++) {
    if (!answers[i]) return i;
  }
  // 全满了，留在原地
  return fromIndex;
}

export function AnswerInterface({
  puzzle,
  isPhase1,
  currentAnswerIndex,
  phase1Answers,
  phase2Answers,
  setCurrentAnswerIndex,
  setPhase1Answers,
  setPhase2Answers,
  onPhase1Submit,
  onPhase2Submit,
  dragDroppedRef,
}: AnswerInterfaceProps) {
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const totalCells = isPhase1 ? 4 : 8;
  const answers = isPhase1 ? phase1Answers : phase2Answers;

  // 所有待填格子按编号排成一排
  const slots = Array.from({ length: totalCells }, (_, i) => i);

  const updateAnswers = (nextAnswers: CellContent[]) => {
    if (isPhase1) setPhase1Answers(nextAnswers);
    else setPhase2Answers(nextAnswers);
  };

  // 选择备选项
  const selectChoice = (content: CellContent) => {
    if (currentAnswerIndex >= totalCells) return;
    const newAnswers = [...answers];
    newAnswers[currentAnswerIndex] = content;
    updateAnswers(newAnswers);
    const next = findNextEmpty(newAnswers, currentAnswerIndex, totalCells);
    setCurrentAnswerIndex(next);
  };

  // 点击已填格子重选
  const deselectAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = null as any;
    updateAnswers(newAnswers);
    setCurrentAnswerIndex(index);
  };

  // 拖拽处理
  const handleDragStart = (e: DragEvent, choice: CellContent, sourceIndex?: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ choice, sourceIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: DragEvent, slotIndex: number) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.choice) {
        const newAnswers = [...answers];
        // 如果拖拽来源是另一个答案格，先清空那个格
        if (data.sourceIndex !== undefined && data.sourceIndex !== slotIndex) {
          newAnswers[data.sourceIndex] = null as any;
        }
        newAnswers[slotIndex] = data.choice;
        updateAnswers(newAnswers);
        // 不改变 currentAnswerIndex — 拖放不影响选中状态
      }
    } catch {}
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 拖出删除：从答案格拖出去，如果没有落在有效目标上就清空
  const handleAnswerDragStart = (e: DragEvent, choice: CellContent, sourceIndex: number) => {
    dragDroppedRef.current = false;
    // 先让浏览器截取当前元素快照（带 emoji），再隐藏原位
    requestAnimationFrame(() => setDraggingSlot(sourceIndex));
    handleDragStart(e, choice, sourceIndex);
  };

  const handleAnswerDragEnd = (_e: DragEvent, sourceIndex: number) => {
    setDraggingSlot(null);
    // 如果没有成功 drop 到任何格子，视为拖出删除
    if (!dragDroppedRef.current) {
      const newAnswers = [...answers];
      newAnswers[sourceIndex] = null as any;
      updateAnswers(newAnswers);
    }
  };

  const originalHandleDrop = (e: DragEvent, slotIndex: number) => {
    e.stopPropagation(); // 防止冒泡到外层 drop zone
    dragDroppedRef.current = true;
    handleDrop(e, slotIndex);
  };

  // 外层 drop zone — 接收所有拖放，防止浏览器“飘回”动画
  const handleOuterDrop = (e: DragEvent) => {
    e.preventDefault();
    // 不做任何写入，dragEnd 会处理删除逻辑
  };

  return (
    <div className="max-w-4xl mx-auto" onDragOver={handleDragOver} onDrop={handleOuterDrop}>
      {/* 上方：一排待填格子 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4 text-center">
          凭记忆填入 {totalCells} 个图案
        </h3>
        <div className="flex justify-center gap-2 mb-6 flex-nowrap">
          {slots.map((i) => {
            const answer = answers[i];
            const isActive = currentAnswerIndex === i;
            const label = i + 1;

            return (
              <div
                key={i}
                onClick={() => {
                  if (answer) {
                    deselectAnswer(i);
                  } else {
                    setCurrentAnswerIndex(i);
                  }
                }}
                onDrop={(e) => originalHandleDrop(e, i)}
                onDragOver={handleDragOver}
                draggable={!!answer}
                onDragStart={(e) => answer && handleAnswerDragStart(e, answer, i)}
                onDragEnd={(e) => answer && handleAnswerDragEnd(e, i)}
                className={`flex-1 max-w-[80px] aspect-square flex items-center justify-center rounded-lg border-[3px] cursor-pointer transition overflow-hidden p-1 ${
                  draggingSlot === i
                    ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                    : isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-300'
                    : answer
                    ? 'border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-800 hover:border-blue-400'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                }`}
                style={{ containerType: 'inline-size' }}
              >
                {answer && draggingSlot !== i ? (
                  <CellRenderer content={answer} size="normal" />
                ) : (
                  <span className="font-black text-gray-400 dark:text-gray-500 flex items-baseline leading-none" style={{ fontSize: '2.2rem' }}>
                    ?<span className="font-bold" style={{ fontSize: '0.4em' }}>{label}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 下方：备选池 */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 text-center">
          备选图案（点击或拖拽填入 ? 格）
        </h3>
        <div className="flex flex-wrap justify-center gap-2 mx-auto">
          {(isPhase1 ? puzzle.choices : puzzle.phase2Choices).map((choice, i) => {
            return (
              <button
                key={i}
                onClick={() => selectChoice(choice)}
                draggable
                onDragStart={(e) => handleDragStart(e, choice)}
                className="flex items-center justify-center rounded-lg border-2 transition border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 hover:scale-105 active:scale-95 cursor-grab"
                style={{ width: '80px', height: '80px', containerType: 'inline-size' }}
              >
                <CellRenderer content={choice} size="normal" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="text-center mt-6">
        <button
          onClick={isPhase1 ? onPhase1Submit : onPhase2Submit}
          disabled={answers.filter(Boolean).length < totalCells}
          className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isPhase1 ? '确认，进入阶段二' : '提交答案'}
        </button>
        {answers.filter(Boolean).length < totalCells && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            还有 {totalCells - answers.filter(Boolean).length} 个格子未填
          </p>
        )}
      </div>
    </div>
  );
}
