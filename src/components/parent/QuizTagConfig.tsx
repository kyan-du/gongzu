import type { QuizTagConfig as QuizTagConfigType } from '../../lib/types';
import Toggle from '../forms/Toggle';

interface QuizTagConfigProps {
  config: QuizTagConfigType;
  saving: boolean;
  onUpdate: (patch: Partial<QuizTagConfigType>) => void;
  onLocalUpdate?: (patch: Partial<QuizTagConfigType>) => void;
}

export default function QuizTagConfig({
  config,
  saving,
  onUpdate,
  onLocalUpdate,
}: QuizTagConfigProps) {
  const isEnabled = config.enabled !== false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {config.tag}
          </span>
          {saving && <span className="text-xs text-gray-400 animate-pulse">...</span>}
        </div>
        <Toggle on={isEnabled} onChange={() => onUpdate({ enabled: !isEnabled })} />
      </div>

      {isEnabled && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {/* Count control */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">每日题数</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdate({ count: Math.max(1, config.count - 1) })}
                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center"
              >
                −
              </button>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-6 text-center">
                {config.count}
              </span>
              <button
                onClick={() => onUpdate({ count: config.count + 1 })}
                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
              出题要求
            </span>
            <textarea
              value={config.prompt || ''}
              onChange={(e) => {
                // Local update for responsive typing
                if (onLocalUpdate) {
                  onLocalUpdate({ prompt: e.target.value });
                }
              }}
              onBlur={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="描述出题要求，如：初一英语，词性变换和句型转换为主，不考宾语从句和被动语态..."
              className="w-full text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}
