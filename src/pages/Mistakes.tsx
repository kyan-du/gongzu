import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';

interface MasteryItem {
  id: string;
  knowledgePoint: string;
  category: string;
  errorCount: number;
  correctStreak: number;
  intervalDays: number;
  nextReviewAt: string;
  lastErrorAt: string;
  mastered: boolean;
}

export default function Mistakes() {
  const { userId } = useParams();
  const [items, setItems] = useState<MasteryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/review?userId=${userId}`)
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const today = new Date().toISOString().split('T')[0];
  const overdue = items.filter(i => !i.mastered && i.nextReviewAt <= today);
  const upcoming = items.filter(i => !i.mastered && i.nextReviewAt > today);
  const mastered = items.filter(i => i.mastered);

  const formatRelative = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays < 0) return `${-diffDays}天前`;
    return `${diffDays}天后`;
  };

  const handleMastered = async (id: string) => {
    await fetch(`/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-mastered', masteryId: id, userId }),
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, mastered: true } : i));
  };

  const renderItem = (item: MasteryItem, isOverdue: boolean) => (
    <div key={item.id} className={`p-4 rounded-xl shadow-sm ${
      isOverdue
        ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30'
        : 'bg-white dark:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100">{item.knowledgePoint}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            错 {item.errorCount} 次 · 下次复习 {formatRelative(item.nextReviewAt)}
          </div>
        </div>
        {!item.mastered && (
          <button
            onClick={() => handleMastered(item.id)}
            className="text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 px-2 py-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition whitespace-nowrap"
          >
            我会了
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header userId={userId || ''} />
      <div className="max-w-lg mx-auto px-4 pb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">📋 错题本</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p>还没有错题记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue */}
            {overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">需要复习</span>
                  <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">{overdue.length}</span>
                </div>
                <div className="space-y-2">
                  {overdue.map(i => renderItem(i, true))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">即将复习</span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">{upcoming.length}</span>
                </div>
                <div className="space-y-2">
                  {upcoming.map(i => renderItem(i, false))}
                </div>
              </div>
            )}

            {/* Mastered */}
            {mastered.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">已掌握</span>
                  <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">{mastered.length}</span>
                </div>
                <div className="space-y-2 opacity-60">
                  {mastered.map(i => renderItem(i, false))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
