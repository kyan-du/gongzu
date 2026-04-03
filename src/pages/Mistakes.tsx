import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import { ChevronRight } from 'lucide-react';

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
      .then(data => setItems(data.points || []))
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

  const renderItem = (item: MasteryItem) => (
    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-gray-900 dark:text-gray-100">{item.knowledgePoint}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            错 {item.errorCount} 次 · {item.mastered ? '已掌握' : `下次复习 ${formatRelative(item.nextReviewAt)}`}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!item.mastered && (
            <button
              onClick={() => handleMastered(item.id)}
              className="text-sm text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 px-3 py-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition"
            >
              我会了
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header userId={userId || ''} />
      <div className="max-w-lg mx-auto px-4 pb-8">

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🎉</p>
            <p>还没有错题记录</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">需要复习（{overdue.length}）</p>
                <div className="space-y-2">{overdue.map(renderItem)}</div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">即将复习（{upcoming.length}）</p>
                <div className="space-y-2">{upcoming.map(renderItem)}</div>
              </div>
            )}

            {mastered.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">已掌握（{mastered.length}）</p>
                <div className="space-y-2 opacity-50">{mastered.map(renderItem)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
