import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { getAllUsers } from '../lib/users';
import { formatAgo, rateColor } from '../lib/utils';
import type { ParentDashboardData } from '../lib/types';
import MiniSparkline from '../components/charts/MiniSparkline';
import ProgressRing from '../components/charts/ProgressRing';

const getChildren = () => getAllUsers().filter(u => u.id !== 'parent');
const childMap = new Map(getAllUsers().map(u => [u.id, u]));

export default function ParentDashboard() {
  const children = getChildren();
  const navigate = useNavigate();
  const [childData, setChildData] = useState<Record<string, ParentDashboardData>>({});
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results: Record<string, ParentDashboardData> = {};
      await Promise.all(children.map(async (child) => {
        try {
          const res = await fetch(`/api/parent?child=${child.id}&range=week`);
          const data = await res.json();
          results[child.id] = { today: data.today, history: data.history || [], byTag: data.byTag || [] };

          // Memory game
          const modRes = await fetch(`/api/modules?userId=${child.id}`);
          const modData = await modRes.json();
          const mgMod = (modData.modules || []).find((m: any) => m.module === 'memory_game' && m.isTask);
          if (mgMod) {
            try {
              const today = new Date().toISOString().slice(0, 10);
              const mgRes = await fetch(`/api/memory-game?userId=${child.id}&date=${today}&type=matryoshka`);
              const mgData = await mgRes.json();
              results[child.id].memoryGames = { completed: mgData.completed || 0, target: mgMod.dailyTarget || 5 };
            } catch {}
          }
        } catch {}
      }));
      setChildData(results);
      setLoading(false);

      // Fetch recent activity
      try {
        const actRes = await fetch('/api/parent/activity?limit=15');
        const actData = await actRes.json();
        setActivities(actData.events || []);
      } catch {}
    };
    fetchAll();
  }, []);

  return (
    <Layout userId="parent">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">今日概览</h2>

      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">加载中...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {children.map((child) => {
            const d = childData[child.id];
            if (!d) return null;
            const hasQuiz = d.today.total > 0;
            const hasMg = !!d.memoryGames;
            const hasAny = hasQuiz || hasMg;
            const allDone = hasQuiz
              ? d.today.completed >= d.today.total && (!hasMg || d.memoryGames!.completed >= d.memoryGames!.target)
              : hasMg
                ? d.memoryGames!.completed >= d.memoryGames!.target
                : false;

            return (
              <button
                key={child.id}
                onClick={() => navigate(`/parent/${child.id}`)}
                className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition active:scale-[0.98] text-left overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 pb-0">
                  <img src={child.avatar} alt={child.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{child.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {!hasAny ? '今日暂无任务' : allDone ? '✅ 全部完成' : '⏳ 进行中'}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>

                {/* Stats */}
                <div className="px-4 pb-4 pt-3">
                  {hasAny ? (
                    <>
                      {/* One row: rings + accuracy + sparkline */}
                      <div className="flex items-center gap-2">
                        {hasQuiz && (
                          <ProgressRing value={d.today.completed} max={d.today.total} color="#3B82F6" size={44} />
                        )}
                        {hasMg && (
                          <ProgressRing value={d.memoryGames!.completed} max={d.memoryGames!.target} color="#F59E0B" size={44} />
                        )}
                        {/* Accuracy */}
                        {hasQuiz && d.today.total > 0 && (
                          <div className="text-center flex-shrink-0">
                            <div className={`text-base font-bold leading-tight ${rateColor(d.today.rate)}`}>
                              {Math.round(d.today.rate * 100)}%
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">正确率</div>
                          </div>
                        )}
                        {!hasQuiz && hasMg && d.memoryGames!.completed > 0 && (
                          <div className="text-center flex-shrink-0">
                            <div className={`text-base font-bold leading-tight ${rateColor(d.memoryAvgAccuracy || 0)}`}>
                              {Math.round((d.memoryAvgAccuracy || 0) * 100)}%
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">准确率</div>
                          </div>
                        )}
                        {/* Sparkline fills remaining space */}
                        {d.history.length > 1 && (
                          <div className="flex-1 min-w-0">
                            <MiniSparkline data={d.history} />
                          </div>
                        )}
                        {/* Flat line for memory-only users with no quiz history */}
                        {d.history.length <= 1 && hasMg && (
                          <div className="flex-1 min-w-0">
                            <svg viewBox="0 0 120 36" className="w-full" style={{ height: '36px' }}>
                              <line x1="4" y1="18" x2="116" y2="18" stroke="#10B981" strokeWidth="1.5" opacity="0.4" />
                              <circle cx="116" cy="18" r="2.5" fill="#10B981" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Tag badges */}
                      {d.byTag.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {d.byTag.map(t => (
                            <span key={t.tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              t.rate >= 0.8 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : t.rate >= 0.6 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                              {t.tag} {Math.round(t.rate * 100)}%
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Memory game badge for memory-only users */}
                      {!hasQuiz && hasMg && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            🧩 记忆游戏 {d.memoryGames!.completed}/{d.memoryGames!.target}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-400 dark:text-gray-500 py-1">点击查看详情和配置</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">最近动态</h3>
          <div className="space-y-1">
            {activities.map((act, i) => {
              const child = childMap.get(act.userId);
              const ago = formatAgo(act.ts);
              if (act.type === 'quiz_complete') {
                const rate = Math.round(act.data.rate * 100);
                const emoji = rate >= 80 ? '🎉' : rate >= 60 ? '📝' : '💪';
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <img src={child?.avatar || ''} alt="" className="w-7 h-7 rounded-full object-cover mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{child?.name}</span>
                        {' 完成了 '}
                        <span className="font-medium">{act.data.tag}</span>
                        {' '}{emoji}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {act.data.correct}/{act.data.total} 正确 · {rate}%
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">{ago}</span>
                  </div>
                );
              }
              if (act.type === 'memory_game') {
                const acc = Math.round(act.data.accuracy * 100);
                const dur = act.data.durationSec ? `${act.data.durationSec}秒` : '';
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <img src={child?.avatar || ''} alt="" className="w-7 h-7 rounded-full object-cover mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{child?.name}</span>
                        {' 玩了一轮记忆游戏 🧩'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {act.data.correct}/{act.data.total} 正确 · {acc}%{dur && ` · ${dur}`}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">{ago}</span>
                  </div>
                );
              }
              if (act.type === 'quiz_created') {
                const targetChild = childMap.get(act.userId);
                return (
                  <div key={i} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <img src="/avatar-chanting.jpg" alt="春庭" className="w-7 h-7 rounded-full object-cover mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">春庭</span>
                        {' 给 '}
                        <span className="font-medium">{targetChild?.name || act.userId}</span>
                        {' 出了 '}
                        <span className="font-medium">{act.data.tag}</span>
                        {` ${act.data.count}题 📋`}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">{ago}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
