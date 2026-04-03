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
    if (diffDays < 0) return `${-diffDays}天前到期`;
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

  const renderItem = (item: MasteryItem, accent: 'red' | 'gray' | 'green') => (
    <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 ${
      accent === 'red' ? 'border-l-red-500' :
      accent === 'green' ? 'border-l-green-400' :
      'border-l-gray-200 dark:border-l-gray-600'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.knowledgePoint}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded shrink-0">{item.category}</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            错 {item.errorCount} 次{item.mastered ? '' : ` · 复习 ${formatRelative(item.nextReviewAt)}`}
          </div>
        </div>
        {!item.mastered && (
          <button
            onClick={() => handleMastered(item.id)}
            className="text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 px-2.5 py-1 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition whitespace-nowrap shrink-0"
          >
            我会了
          </button>
        )}
      </div>
    </div>
  );

  const SectionHeader = ({ label, count, color }: { label: string; count: number; color: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
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
                <SectionHeader label="需要复习" count={overdue.length} color="text-red-600 dark:text-red-400" />
                <div className="space-y-2">{overdue.map(i => renderItem(i, 'red'))}</div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <SectionHeader label="即将复习" count={upcoming.length} color="text-gray-500 dark:text-gray-400" />
                <div className="space-y-2">{upcoming.map(i => renderItem(i, 'gray'))}</div>
              </div>
            )}

            {mastered.length > 0 && (
              <div>
                <SectionHeader label="已掌握" count={mastered.length} color="text-green-600 dark:text-green-400" />
                <div className="space-y-2 opacity-50">{mastered.map(i => renderItem(i, 'green'))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
