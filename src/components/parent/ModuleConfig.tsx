import type { UserModule } from '../../lib/types';
import Toggle from '../forms/Toggle';

interface ModuleDef {
  name: string;
  icon: string;
  hasTarget: boolean;
  targetLabel?: string;
}

interface ModuleConfigProps {
  module: UserModule;
  definition: ModuleDef;
  saving: boolean;
  onUpdate: (patch: Partial<UserModule>) => void;
}

export default function ModuleConfig({
  module,
  definition,
  saving,
  onUpdate,
}: ModuleConfigProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{definition.icon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {definition.name}
          </span>
          {saving && <span className="text-xs text-gray-400 animate-pulse">...</span>}
        </div>
        <Toggle
          on={module.enabled}
          onChange={() => onUpdate({ enabled: !module.enabled })}
        />
      </div>

      {module.enabled && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              计入每日任务
            </span>
            <Toggle
              on={module.isTask}
              onChange={() => onUpdate({ isTask: !module.isTask })}
              color="blue"
            />
          </div>

          {definition.hasTarget && module.isTask && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {definition.targetLabel}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdate({
                      dailyTarget: Math.max(1, (module.dailyTarget || 5) - 1),
                    })
                  }
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-6 text-center">
                  {module.dailyTarget || 5}
                </span>
                <button
                  onClick={() =>
                    onUpdate({ dailyTarget: (module.dailyTarget || 5) + 1 })
                  }
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
