import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Target, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';
import { getAllUsers } from '../lib/users';
import { rateColor, rateBg } from '../lib/utils';
import type {
  DayData,
  TagData,
  UserModule,
  QuizTagConfig as QuizTagConfigType,
} from '../lib/types';
import TrendChart from '../components/charts/TrendChart';
import QuizTagConfig from '../components/parent/QuizTagConfig';
import ModuleConfig from '../components/parent/ModuleConfig';

interface ParentData {
  today: { total: number; completed: number; correct: number; rate: number };
  history: DayData[];
  byTag: TagData[];
}

const MODULE_DEFS: Record<string, { name: string; icon: string; hasTarget: boolean; targetLabel?: string }> = {
  vocab: { name: '单词本', icon: '📖', hasTarget: true, targetLabel: '每日新词数' },
  mistakes: { name: '错题本', icon: '❌', hasTarget: false },
  memory_game: { name: '思维训练', icon: '🧩', hasTarget: true, targetLabel: '每日轮数' },
};

export default function ParentChild() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const child = getAllUsers().find(u => u.id === childId);
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [modules, setModules] = useState<UserModule[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [newQuizName, setNewQuizName] = useState('');

  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    fetch(`/api/parent?child=${childId}&range=${range}`)
      .then(r => r.json()).then(setData)
      .catch(() => {}).finally(() => setLoading(false));
  }, [childId, range]);

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/modules?userId=${childId}`)
      .then(r => r.json()).then((d: any) => setModules(d.modules || []))
      .catch(() => {});
  }, [childId]);

  const updateModule = async (mod: string, patch: Partial<UserModule>) => {
    setSaving(mod);
    try {
      await fetch('/api/modules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: childId, module: mod, ...patch }),
      });
      const res = await fetch(`/api/modules?userId=${childId}`);
      const d = await res.json();
      setModules(d.modules || []);
    } catch {} finally { setSaving(null); }
  };

  if (!child) return <div className="p-8 text-center text-gray-400">用户不存在</div>;

  const allModules = Object.keys(MODULE_DEFS);
  const modMap = new Map(modules.map(m => [m.module, m]));
  const displayMods = allModules.map(k => modMap.get(k) || { module: k, enabled: false, isTask: false, dailyTarget: null, config: {} });

  // Quiz sub-modules by tag
  const quizMod = modMap.get('quiz');
  const quizTags: QuizTagConfigType[] = quizMod?.config?.tags || [];

  const updateQuizTag = async (tag: string, patch: Partial<QuizTagConfigType>) => {
    if (!quizMod) return;
    setSaving(`quiz:${tag}`);
    try {
      const currentTags: QuizTagConfigType[] = [...(quizMod.config?.tags || [])];
      const idx = currentTags.findIndex(t => t.tag === tag);
      if (idx >= 0) {
        currentTags[idx] = { ...currentTags[idx], ...patch };
      }
      await fetch('/api/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: childId, module: 'quiz', config: { ...quizMod.config, tags: currentTags } }),
      });
      const res = await fetch(`/api/modules?userId=${childId}`);
      const d = await res.json();
      setModules(d.modules || []);
    } catch {} finally { setSaving(null); }
  };

  return (
    <Layout userId="parent">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/parent')} className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center hover:shadow-md transition">
          <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <img src={child.avatar} alt={child.name} className="w-9 h-9 rounded-full object-cover" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{child.name}</h2>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12 text-sm">加载中...</div>
      ) : data ? (
        <>
          {/* Today stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 text-center">
              <Target className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.today.completed}<span className="text-sm font-normal text-gray-400">/{data.today.total}</span></div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">完成</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 text-center">
              <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1.5" />
              <div className={`text-xl font-bold ${rateColor(data.today.rate)}`}>{data.today.total > 0 ? Math.round(data.today.rate * 100) : 0}%</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">正确率</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 text-center">
              <BookOpen className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.today.correct}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">答对</div>
            </div>
          </div>

          {/* By tag */}
          {data.byTag.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">按科目</h3>
              <div className="space-y-2">
                {data.byTag.map(t => (
                  <div key={t.tag} className={`flex items-center justify-between p-3 rounded-xl ${rateBg(t.rate)}`}>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.tag}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.correct}/{t.total}</span>
                      <span className={`text-sm font-bold ${rateColor(t.rate)}`}>{Math.round(t.rate * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">正确率趋势</h3>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                {(['week', 'month'] as const).map(r => (
                  <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 text-xs font-medium rounded-md transition ${range === r ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                    {r === 'week' ? '7天' : '30天'}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart data={data.history} range={range} />
          </div>
        </>
      ) : null}

      {/* Module Config */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">每日练习</h3>
        <div className="space-y-2">
          {quizTags.map(qt => (
            <QuizTagConfig
              key={qt.tag}
              config={qt}
              saving={saving === `quiz:${qt.tag}`}
              onUpdate={(patch) => updateQuizTag(qt.tag, patch)}
              onLocalUpdate={(patch) => {
                const newTags = quizTags.map(t => t.tag === qt.tag ? { ...t, ...patch } : t);
                setModules(prev => prev.map(m => m.module === 'quiz' ? { ...m, config: { ...m.config, tags: newTags } } : m));
              }}
            />
          ))}

          {/* Add new quiz subject — inline input */}
          {newQuizName !== null && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newQuizName}
                  onChange={e => setNewQuizName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newQuizName.trim()) {
                      const newTag: QuizTagConfigType = { tag: newQuizName.trim(), count: 5, prompt: '', enabled: true };
                      const currentTags = [...quizTags, newTag];
                      const quizModCurrent = modules.find(m => m.module === 'quiz');
                      if (quizModCurrent) {
                        updateModule('quiz', { config: { ...quizModCurrent.config, tags: currentTags } });
                      }
                      setNewQuizName('');
                    } else if (e.key === 'Escape') {
                      setNewQuizName('');
                    }
                  }}
                  placeholder="输入科目名称，回车添加"
                  className="flex-1 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button
                  onClick={() => {
                    if (!newQuizName.trim()) return;
                    const newTag: QuizTagConfigType = { tag: newQuizName.trim(), count: 5, prompt: '', enabled: true };
                    const currentTags = [...quizTags, newTag];
                    const quizModCurrent = modules.find(m => m.module === 'quiz');
                    if (quizModCurrent) {
                      updateModule('quiz', { config: { ...quizModCurrent.config, tags: currentTags } });
                    }
                    setNewQuizName('');
                  }}
                  disabled={!newQuizName.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-green-500 text-white disabled:opacity-40 hover:bg-green-600 transition"
                >
                  添加
                </button>
              </div>
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 mt-6">其他模块</h3>
        <div className="space-y-2">
          {displayMods.map(m => {
            const def = MODULE_DEFS[m.module];
            if (!def) return null;
            return (
              <ModuleConfig
                key={m.module}
                module={m}
                definition={def}
                saving={saving === m.module}
                onUpdate={(patch) => updateModule(m.module, patch)}
              />
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
