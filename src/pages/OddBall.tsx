import type { PointerEvent } from 'react';
import { useState } from 'react';
import { RotateCcw, Scale, SearchCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { resultHint, resultText } from '../features/odd-ball/engine';
import type { PanSide } from '../features/odd-ball/types';
import { useOddBallGame } from '../features/odd-ball/useOddBallGame';

const sideLabel: Record<PanSide, string> = { left: '放左盘', right: '放右盘', pool: '收回单球' };

type DragState = {
  ball: number;
  x: number;
  y: number;
  pointerId: number;
  moved: boolean;
} | null;

function BallButton({
  ball,
  onClick,
  selected,
  onPointerDown,
}: {
  ball: number;
  onClick: () => void;
  selected?: boolean;
  onPointerDown: (ball: number, event: PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={(event) => onPointerDown(ball, event)}
      className={`aspect-square min-h-11 rounded-full border-2 font-black shadow-sm transition active:scale-95 cursor-grab active:cursor-grabbing touch-none select-none ${selected ? 'border-purple-400 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-100' : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`}
      aria-label={`${ball} 号球`}
    >
      {ball}
    </button>
  );
}

export default function OddBall() {
  const { userId } = useParams<{ userId: string }>();
  const game = useOddBallGame();
  const isLastLevel = game.levelIndex === game.levels.length - 1;
  const [dragState, setDragState] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<PanSide | null>(null);

  const getDropSide = (x: number, y: number): PanSide | null => {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-side]');
    const side = element?.dataset.dropSide;
    if (side === 'left' || side === 'right' || side === 'pool') return side;
    return null;
  };

  const beginPointerDrag = (ball: number, event: PointerEvent<HTMLButtonElement>) => {
    if (game.solved || game.failed) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ ball, x: event.clientX, y: event.clientY, pointerId: event.pointerId, moved: false });
    setDropTarget(getDropSide(event.clientX, event.clientY));
  };

  const movePointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const moved = dragState.moved || Math.abs(event.clientX - dragState.x) > 6 || Math.abs(event.clientY - dragState.y) > 6;
    setDragState({ ...dragState, x: event.clientX, y: event.clientY, moved });
    setDropTarget(getDropSide(event.clientX, event.clientY));
  };

  const endPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const side = getDropSide(event.clientX, event.clientY);
    if (dragState.moved && side) game.placeBallOnSide(dragState.ball, side);
    setDragState(null);
    setDropTarget(null);
  };

  const cancelPointerDrag = () => {
    setDragState(null);
    setDropTarget(null);
  };

  const dropClass = (side: PanSide) => dropTarget === side ? 'ring-4 ring-purple-300 dark:ring-purple-600 scale-[1.01]' : '';
  const ballProps = {
    onPointerDown: beginPointerDrag,
  };

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/brain`} maxWidth="max-w-5xl">
      <div
        className="py-4 space-y-4"
        onPointerMove={movePointerDrag}
        onPointerUp={endPointerDrag}
        onPointerCancel={cancelPointerDrag}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">天平侦探</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">用最少称重次数，找出那颗偏重的球</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <select
            value={game.levelIndex}
            onChange={e => game.chooseLevel(Number(e.target.value))}
            className="w-full md:hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-3 text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {game.levels.map((level, index) => <option key={level.id} value={index}>{level.title}</option>)}
          </select>

          <div className="hidden md:grid grid-cols-3 xl:grid-cols-6 gap-2">
            {game.levels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => game.chooseLevel(index)}
                className={`rounded-xl px-3 py-2 text-left text-sm transition ${index === game.levelIndex ? 'bg-purple-600 text-white shadow' : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
              >
                <div className="font-semibold truncate">{level.title}</div>
                <div className={`text-xs truncate ${index === game.levelIndex ? 'text-purple-50' : 'text-gray-500 dark:text-gray-400'}`}>{level.ballCount} 球 · 最多 {level.maxWeighs} 次</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/20 rounded-3xl p-5 shadow-sm border border-purple-100 dark:border-purple-900/40">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{game.level.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{game.level.subtitle}</p>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-2">提示：{game.level.strategyHint}</p>
            </div>
            <div className="rounded-2xl bg-white/80 dark:bg-gray-900/70 px-4 py-3 min-w-36">
              <div className="text-xs text-gray-500 dark:text-gray-400">剩余称重</div>
              <div className="font-black text-2xl text-purple-700 dark:text-purple-300">{game.remainingWeighs}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => game.setActiveSide('left')}
              className={`rounded-2xl py-3 font-bold transition active:scale-[0.98] ${game.activeSide === 'left' ? 'bg-purple-600 text-white shadow' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
            >
              放左盘
            </button>
            <button
              onClick={() => game.setActiveSide('right')}
              className={`rounded-2xl py-3 font-bold transition active:scale-[0.98] ${game.activeSide === 'right' ? 'bg-purple-600 text-white shadow' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200'}`}
            >
              放右盘
            </button>
            <button
              onClick={game.resetCurrentWeigh}
              className="rounded-2xl py-3 font-bold transition active:scale-[0.98] bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
            >
              全部收回
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-stretch">
            <div
              data-drop-side="left"
              className={`rounded-3xl bg-white dark:bg-gray-900 p-2 sm:p-4 border-2 border-dashed border-purple-200 dark:border-purple-800 transition ${dropClass('left')}`}
            >
              <div className="text-center font-bold text-purple-700 dark:text-purple-300 mb-2 sm:mb-3">左盘</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 min-h-32 sm:min-h-28 content-start">
                {game.left.map(ball => <BallButton key={ball} ball={ball} onClick={() => game.placeBall(ball)} selected {...ballProps} />)}
              </div>
              <div className="text-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-2">拖到这里</div>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 min-w-16 sm:min-w-24">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                <Scale className="w-7 h-7 sm:w-10 sm:h-10" />
              </div>
              <button
                onClick={game.doWeigh}
                disabled={!game.canWeigh}
                className="rounded-2xl bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-black shadow active:scale-[0.98] whitespace-nowrap"
              >
                称一下
              </button>
              <button onClick={game.resetCurrentWeigh} className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 underline whitespace-nowrap">全部收回</button>
            </div>

            <div
              data-drop-side="right"
              className={`rounded-3xl bg-white dark:bg-gray-900 p-2 sm:p-4 border-2 border-dashed border-indigo-200 dark:border-indigo-800 transition ${dropClass('right')}`}
            >
              <div className="text-center font-bold text-indigo-700 dark:text-indigo-300 mb-2 sm:mb-3">右盘</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 min-h-32 sm:min-h-28 content-start">
                {game.right.map(ball => <BallButton key={ball} ball={ball} onClick={() => game.placeBall(ball)} selected {...ballProps} />)}
              </div>
              <div className="text-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-2">拖到这里</div>
            </div>
          </div>

          <div
            data-drop-side="pool"
            className={`mt-4 rounded-3xl bg-white dark:bg-gray-900 p-4 border-2 border-dashed border-transparent transition ${dropClass('pool')}`}
          >
            <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">球池：点球后会执行“{sideLabel[game.activeSide]}”</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">“全部收回”会把左右盘的球都放回球池；也可以按住单个球拖回球池。</div>
            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2 min-h-14">
              {game.pool.map(ball => <BallButton key={ball} ball={ball} onClick={() => game.placeBall(ball)} {...ballProps} />)}
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-3xl bg-white dark:bg-gray-900 p-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">称重记录</h3>
              {game.records.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">还没有称重。左右盘放一样多的球，再点“称一下”。</p>
              ) : (
                <div className="space-y-3">
                  {game.records.map((record, index) => (
                    <div key={`${index}-${record.result}`} className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                      <div className="font-bold text-gray-800 dark:text-gray-100">{index + 1}. {record.left.join(', ')} vs {record.right.join(', ')} → {resultText(record.result)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{resultHint(record.result)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white dark:bg-gray-900 p-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">提交判断</h3>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-4 max-h-48 overflow-auto pr-1">
                {game.balls.map(ball => (
                  <button
                    key={ball}
                    onClick={() => !game.solved && game.setSelectedAnswer(ball)}
                    className={`rounded-2xl py-3 font-black transition active:scale-95 ${game.selectedAnswer === ball ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                  >
                    {ball}
                  </button>
                ))}
              </div>
              <button
                onClick={game.submitAnswer}
                disabled={game.selectedAnswer === null || game.solved}
                className="w-full rounded-2xl bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white py-3 font-black flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <SearchCheck className="w-5 h-5" />提交答案：这颗是重球
              </button>

              {game.solved && (
                <div className="mt-4 rounded-3xl border-4 border-green-300 bg-green-50 dark:bg-green-900/30 p-4 text-center">
                  <div className="text-2xl font-black text-green-700 dark:text-green-300">破案成功！</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                    {isLastLevel ? '天平侦探全部通关！' : '可以挑战下一关了。'}
                  </div>
                </div>
              )}

              {game.failed && (
                <div className="mt-4 rounded-3xl border-4 border-orange-300 bg-orange-50 dark:bg-orange-900/30 p-4 text-center">
                  <div className="text-xl font-black text-orange-700 dark:text-orange-300">还差一点</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">真正的重球是 {game.oddBall} 号。复盘记录再试一次。</div>
                </div>
              )}

              <button onClick={game.restart} className="mt-3 w-full rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
                <RotateCcw className="w-4 h-4" />重新开始本关
              </button>
            </div>
          </div>
        </div>
      </div>

      {dragState?.moved && (
        <div
          className="fixed z-50 pointer-events-none w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple-400 bg-white dark:bg-gray-900 text-purple-700 dark:text-purple-200 flex items-center justify-center font-black shadow-2xl"
          style={{ left: dragState.x, top: dragState.y }}
        >
          {dragState.ball}
        </div>
      )}
    </Layout>
  );
}
