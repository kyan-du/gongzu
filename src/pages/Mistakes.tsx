import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface MistakeItem {
  questionId: string;
  submittedAt: number;
  stem: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  tags: string[];
}

interface MistakeGroup {
  tag: string;
  count: number;
  mistakes: MistakeItem[];
}

export default function Mistakes() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<MistakeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');


  useEffect(() => {
    const fetchMistakes = async () => {
      setLoading(true);
      try {
        const url = selectedTag === 'all' 
          ? `/api/mistakes?userId=${userId}`
          : `/api/mistakes?userId=${userId}&tag=${encodeURIComponent(selectedTag)}`;
        const res = await fetch(url);
        const data = await res.json();
        setGroups(data.groups || []);
      } catch (e) {
        console.error('Failed to fetch mistakes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [userId, selectedTag]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${m}/${day}`;
  };

  const toggleTag = (tag: string) => {
    setExpandedTag(expandedTag === tag ? null : tag);
  };

  const handleRetry = () => {
    // TODO: 生成临时 quiz 并导航
    alert('重做错题功能即将推出');
  };

  // 收集所有标签
  const allTags = Array.from(new Set(groups.flatMap(g => [g.tag])));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/${userId}/today`)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">错题本</h1>
          </div>
          <div>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部标签</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-gray-500 dark:text-gray-400">太棒了！没有错题</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">继续保持！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.tag} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                {/* 标签头部 */}
                <button
                  onClick={() => toggleTag(group.tag)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{group.tag}</span>
                    <span className="text-sm text-red-500 dark:text-red-400">（{group.count}次错误）</span>
                  </div>
                  {expandedTag === group.tag ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* 展开的错题列表 */}
                {expandedTag === group.tag && (
                  <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {group.mistakes.map((mistake, idx) => (
                      <div key={`${mistake.questionId}-${idx}`} className="px-4 py-3 space-y-2">
                        {/* 日期 */}
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(mistake.submittedAt)}
                        </div>
                        {/* 题目 */}
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {mistake.stem.length > 100 
                            ? `${mistake.stem.substring(0, 100)}...` 
                            : mistake.stem}
                        </div>
                        {/* 答案对比 */}
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">你的答案:</span>
                            <span className="font-medium text-red-500 dark:text-red-400">
                              {mistake.userAnswer || '(未作答)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">正确答案:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {mistake.correctAnswer}
                            </span>
                          </div>
                        </div>
                        {/* 解析 */}
                        {mistake.explanation && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 mt-2">
                            <span className="font-medium">解析: </span>
                            {mistake.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 重做错题按钮 */}
            <button
              onClick={handleRetry}
              className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              重做错题
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
