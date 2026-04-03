import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, BookX } from 'lucide-react';
import Layout from '../components/Layout';

interface KnowledgePoint {
  id: string;
  knowledgePoint: string;
  category: string | null;
  errorCount: number;
  correctStreak: number;
  intervalDays: number;
  nextReviewAt: string | null;
  mastered: boolean;
  masteredReason: string | null;
  lastErrorAt: string | null;
}

interface MistakeDetail {
  date: string;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export default function Mistakes() {
  const { userId } = useParams<{ userId: string }>();

  const [points, setPoints] = useState<KnowledgePoint[]>([]);
  const [masteredPoints, setMasteredPoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());
  const [mistakesMap, setMistakesMap] = useState<Record<string, MistakeDetail[]>>({});
  const [showMastered, setShowMastered] = useState(false);

  useEffect(() => {
    fetchPoints();
  }, [userId]);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mistakes?userId=${userId}`);
      const data = await res.json();
      setPoints(data.points || []);
      setMasteredPoints(data.masteredPoints || []);
    } catch (e) {
      console.error('Failed to fetch knowledge points:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMistakesForPoint = async (point: string) => {
    try {
      const res = await fetch(`/api/mistakes?userId=${userId}&point=${encodeURIComponent(point)}`);
      const data = await res.json();
      setMistakesMap(prev => ({ ...prev, [point]: data.mistakes || [] }));
    } catch (e) {
      console.error('Failed to fetch mistakes:', e);
    }
  };

  const togglePoint = async (point: KnowledgePoint) => {
    if (expandedPoints.has(point.id)) {
      setExpandedPoints(prev => { const next = new Set(prev); next.delete(point.id); return next; });
    } else {
      setExpandedPoints(prev => new Set(prev).add(point.id));
      await fetchMistakesForPoint(point.knowledgePoint);
    }
  };

  const handleMastery = async (pointId: string, action: 'master' | 'unmaster') => {
    try {
      await fetch('/api/mistakes/mastery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, masteryId: pointId, action }),
      });
      await fetchPoints();
      setExpandedPoints(prev => { const next = new Set(prev); next.delete(pointId); return next; });
    } catch (e) {
      console.error('Failed to update mastery:', e);
    }
  };

  const formatReviewDate = (date: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(d);
    reviewDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays < 0) return `${Math.abs(diffDays)}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const renderPointCard = (point: KnowledgePoint) => (
    <div key={point.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => togglePoint(point)}
        className="w-full px-4 py-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100">{point.knowledgePoint}</span>
            {point.category && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{point.category}</span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            错 {point.errorCount} 次 · 下次复习 {formatReviewDate(point.nextReviewAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleMastery(point.id, 'master'); }}
            className="px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition"
          >
            我会了
          </button>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedPoints.has(point.id) ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expandedPoints.has(point.id) && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {!mistakesMap[point.knowledgePoint] ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">加载中...</div>
          ) : mistakesMap[point.knowledgePoint].length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">没有错题记录</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {mistakesMap[point.knowledgePoint].map((mistake, idx) => (
                <div key={idx} className="px-4 py-3 space-y-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500">{mistake.date}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{mistake.stem}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-500 dark:text-red-400 font-medium">{mistake.userAnswer || '(未作答)'}</span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">{mistake.correctAnswer}</span>
                  </div>
                  {mistake.explanation && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 mt-2">{mistake.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  const overdue = points.filter(p => !p.nextReviewAt || p.nextReviewAt <= today);
  const upcoming = points.filter(p => p.nextReviewAt && p.nextReviewAt > today);

  return (
    <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
        {/* Title card */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <BookX className="w-5 h-5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">错题本</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              共 {points.length + masteredPoints.length} 个知识点跟踪中
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : (
          <>
            {overdue.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">需要复习（{overdue.length}）</p>
                <div className="space-y-3">{overdue.map(renderPointCard)}</div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">即将复习（{upcoming.length}）</p>
                <div className="space-y-3">{upcoming.map(renderPointCard)}</div>
              </div>
            )}

            {masteredPoints.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowMastered(!showMastered)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1 hover:text-gray-700 dark:hover:text-gray-300 transition"
                >
                  <span>已掌握（{masteredPoints.length}）</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMastered ? 'rotate-180' : ''}`} />
                </button>
                {showMastered && (
                  <div className="space-y-3">
                    {masteredPoints.map((point) => (
                      <div key={point.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{point.knowledgePoint}</span>
                              {point.category && <span className="text-xs text-gray-400 dark:text-gray-500">{point.category}</span>}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              已掌握 {point.masteredReason === 'auto' ? '(自动)' : '(手动标记)'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleMastery(point.id, 'unmaster')}
                            className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          >
                            再练练
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {points.length === 0 && masteredPoints.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-gray-500 dark:text-gray-400">太棒了！没有错题</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">继续保持！</p>
              </div>
            )}
          </>
        )}
    </Layout>
  );
}
