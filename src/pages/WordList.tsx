import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Trash2, ChevronDown, ArrowUpDown, CheckSquare, Square, Undo2 } from 'lucide-react';
import Layout from '../components/Layout';

interface Word {
  id: string;
  front: string;
  back: string;
  phonetic: string;
  createdAt: number;
}

type SortType = 'newest' | 'oldest' | 'alpha';
const sortLabels: Record<SortType, string> = { newest: '最新', oldest: '最早', alpha: '字母' };

interface DeletedItem {
  word: Word;
  index: number; // position in original list for undo
  timer: ReturnType<typeof setTimeout>;
}

export default function WordList() {
  const { userId } = useParams<{ userId: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showSort, setShowSort] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Map<string, DeletedItem>>(new Map());
  const [selectMode, setSelectMode] = useState(false);
  const pageSize = 20;

  const fetchWords = useCallback(async (p: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: userId || '',
        page: String(p),
        pageSize: String(pageSize),
        sort,
      });
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/cards/manage?${params}`);
      const data = await res.json();
      setWords(prev => append ? [...prev, ...(data.words || [])] : (data.words || []));
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
      setPage(p);
    } catch (e) {
      console.error('Failed to fetch words:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, sort, search]);

  useEffect(() => {
    fetchWords(1);
  }, [fetchWords]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      deleted.forEach(d => clearTimeout(d.timer));
    };
  }, []);

  const handleSearch = () => { setSelected(new Set()); fetchWords(1); };
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) fetchWords(page + 1, true);
  };

  // Soft-delete: mark as deleted, defer API call to after undo window
  const softDelete = (ids: string[]) => {
    const newDeleted = new Map(deleted);
    ids.forEach(id => {
      const word = words.find(w => w.id === id);
      if (!word) return;
      if (newDeleted.has(id)) clearTimeout(newDeleted.get(id)!.timer);
      const timer = setTimeout(() => {
        // 5s passed — actually delete from server + remove from UI
        setDeleted(prev => { const n = new Map(prev); n.delete(id); return n; });
        setWords(prev => prev.filter(w => w.id !== id));
        setTotal(prev => prev - 1);
        fetch(`/api/cards/manage?id=${id}`, { method: 'DELETE' }).catch(console.error);
      }, 5000);
      newDeleted.set(id, { word, index: words.findIndex(w => w.id === id), timer });
    });
    setDeleted(newDeleted);
    setSelected(new Set());
  };

  // Undo: cancel timer, remove deleted mark — pure frontend, no API call
  const undoDelete = (id: string) => {
    const item = deleted.get(id);
    if (!item) return;
    clearTimeout(item.timer);
    setDeleted(prev => { const n = new Map(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const liveWords = words.filter(w => !deleted.has(w.id));
    if (selected.size === liveWords.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(liveWords.map(w => w.id)));
    }
  };

  const liveCount = words.filter(w => !deleted.has(w.id)).length;

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/cards`} maxWidth="max-w-3xl"
      title="生词本"
      rightAction={<span className="text-sm text-gray-400 dark:text-gray-500">{total - deleted.size} 词</span>}
    >
      {/* Search + Sort bar */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索单词或释义…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-violet-600 dark:bg-violet-500 text-white text-sm font-medium rounded-xl hover:bg-violet-700 dark:hover:bg-violet-600 transition active:scale-95"
          >
            搜索
          </button>
        </div>

        {/* Sort + select mode controls */}
        <div className="flex items-center justify-between">
          <div className="relative inline-block">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              <ArrowUpDown className="w-3 h-3" />
              排序：{sortLabels[sort]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSort && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                {(Object.keys(sortLabels) as SortType[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setSort(s); setShowSort(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${s === sort ? 'text-violet-600 dark:text-violet-400 font-medium' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    {sortLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`text-xs px-2 py-1 rounded-lg transition ${
              selectMode
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {selectMode ? '取消' : '管理'}
          </button>
        </div>
      </div>

      {/* Select all + batch delete bar */}
      {selectMode && liveCount > 0 && (
        <div className="mb-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
          <button onClick={selectAll} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            {selected.size === liveCount
              ? <CheckSquare className="w-4 h-4 text-violet-500" />
              : <Square className="w-4 h-4" />
            }
            全选
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => softDelete(Array.from(selected))}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除 {selected.size} 个
            </button>
          )}
        </div>
      )}

      {/* Word list */}
      {loading ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-12">加载中...</div>
      ) : words.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-gray-500 dark:text-gray-400">
            {search ? '没有找到匹配的单词' : '生词本还是空的'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {words.map(word => {
            const isDeleted = deleted.has(word.id);

            return (
              <div
                key={word.id}
                className={`rounded-xl shadow-sm px-4 py-3 flex items-center transition-all duration-300 ${
                  isDeleted
                    ? 'bg-gray-100 dark:bg-gray-800/50 opacity-50'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                {/* Checkbox in select mode */}
                {selectMode && !isDeleted && (
                  <button
                    onClick={() => toggleSelect(word.id)}
                    className="mr-3 flex-shrink-0"
                  >
                    {selected.has(word.id)
                      ? <CheckSquare className="w-5 h-5 text-violet-500" />
                      : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    }
                  </button>
                )}

                <div className={`flex-1 min-w-0 ${isDeleted ? 'line-through' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isDeleted ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}`}>{word.front}</span>
                    {word.phonetic && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{word.phonetic}</span>
                    )}
                  </div>
                  <div className={`text-sm truncate ${isDeleted ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>{word.back}</div>
                </div>

                {isDeleted ? (
                  <button
                    onClick={() => undoDelete(word.id)}
                    className="ml-3 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition"
                  >
                    <Undo2 className="w-3 h-3" />
                    恢复
                  </button>
                ) : !selectMode ? (
                  <button
                    onClick={() => softDelete([word.id])}
                    className="ml-3 p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            );
          })}

          {/* Load more */}
          {page < totalPages && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-3 text-sm text-violet-600 dark:text-violet-400 font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition"
            >
              {loadingMore ? '加载中...' : `加载更多（${words.length}/${total}）`}
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
