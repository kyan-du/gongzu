import { useState } from 'react';

interface FlashCardProps {
  front: string;
  back: string;
  phonetic?: string;
  onResult: (remembered: boolean) => void;
  disabled?: boolean;
}

export default function FlashCard({ front, back, phonetic, onResult, disabled }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped && !disabled) setFlipped(true);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Card */}
      <div
        onClick={handleFlip}
        className="relative w-full aspect-[3/2] cursor-pointer"
        style={{ perspective: '800px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 px-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">
              {front}
            </span>
            {!flipped && (
              <span className="mt-4 text-xs text-gray-400 dark:text-gray-500">点击翻转</span>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800 px-6"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">
              {back}
            </span>
            {phonetic && (
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">{phonetic}</span>
            )}
          </div>
        </div>
      </div>

      {/* Buttons — only show after flip */}
      {flipped && (
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={() => onResult(false)}
            disabled={disabled}
            className="px-6 py-2.5 rounded-full text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
          >
            没记住
          </button>
          <button
            onClick={() => onResult(true)}
            disabled={disabled}
            className="px-6 py-2.5 rounded-full text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
          >
            记住了
          </button>
        </div>
      )}
    </div>
  );
}
