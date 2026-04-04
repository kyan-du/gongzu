import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Keyboard, Check, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';

interface ExtractedWord {
  front: string;
  back: string;
  phonetic?: string;
  example?: string;
  exampleCn?: string;
  selected?: boolean;
}

export default function AddWords() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'choose' | 'manual' | 'photo'>('choose');
  const [inputWord, setInputWord] = useState('');
  const [addedWords, setAddedWords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Photo mode
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleManualAdd = async () => {
    const w = inputWord.trim();
    if (!w || submitting) return;
    setSubmitting(true);

    try {
      const resp = await fetch('/api/cards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, word: w }),
      });
      const data = await resp.json();
      if (data.success) {
        setAddedWords(prev => [...prev, `${w} — ${data.word.back}`]);
        setInputWord('');
      }
    } catch (e) { /* ignore */ }
    setSubmitting(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoPreview(base64);
      setAnalyzing(true);
      setMode('photo');

      try {
        const resp = await fetch('/api/cards/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, image: base64 }),
        });
        const data = await resp.json();
        if (data.words) {
          setExtractedWords(data.words.map((w: any) => ({ ...w, selected: true })));
        }
      } catch (e) { /* ignore */ }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleWord = (idx: number) => {
    setExtractedWords(prev => prev.map((w, i) => i === idx ? { ...w, selected: !w.selected } : w));
  };

  const handleConfirmPhoto = async () => {
    const selected = extractedWords.filter(w => w.selected);
    if (!selected.length || submitting) return;
    setSubmitting(true);

    try {
      await fetch('/api/cards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, words: selected }),
      });
      navigate(`/${userId}/cards`);
    } catch (e) { /* ignore */ }
    setSubmitting(false);
  };

  // Choose mode
  if (mode === 'choose') {
    return (
      <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
        <div className="py-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">
            添加生词
          </h1>

          <div className="space-y-3 max-w-sm mx-auto">
            <button
              onClick={() => setMode('manual')}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                <Keyboard className="w-6 h-6 text-violet-500" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">手动输入</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">输入单词，AI 自动补全释义</div>
              </div>
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                <Camera className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">拍照识别</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">拍卷子/课本，AI 提取生词</div>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Manual input mode
  if (mode === 'manual') {
    return (
      <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
        <div className="py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">手动添加</h1>
            <button onClick={() => setMode('choose')} className="text-sm text-gray-400 hover:text-gray-600">
              返回
            </button>
          </div>

          {/* Input area */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={inputWord}
              onChange={e => setInputWord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
              placeholder="输入英文单词…"
              autoFocus
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 transition"
            />
            <button
              onClick={handleManualAdd}
              disabled={submitting || !inputWord.trim()}
              className="px-5 py-3 rounded-xl bg-violet-600 dark:bg-violet-500 text-white font-medium hover:bg-violet-700 dark:hover:bg-violet-600 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '添加'}
            </button>
          </div>

          {/* Added words list */}
          {addedWords.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                已添加 {addedWords.length} 个单词
              </p>
              {addedWords.map((w, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{w}</span>
                </div>
              ))}
            </div>
          )}

          {addedWords.length > 0 && (
            <button
              onClick={() => navigate(`/${userId}/cards`)}
              className="mt-6 w-full py-3 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
            >
              完成，开始背
            </button>
          )}
        </div>
      </Layout>
    );
  }

  // Photo analysis mode
  return (
    <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">拍照识别</h1>
          <button onClick={() => { setMode('choose'); setExtractedWords([]); setPhotoPreview(null); }} className="text-sm text-gray-400 hover:text-gray-600">
            返回
          </button>
        </div>

        {/* Photo preview */}
        {photoPreview && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img src={photoPreview} alt="uploaded" className="w-full max-h-48 object-cover" />
          </div>
        )}

        {/* Analyzing */}
        {analyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">AI 正在识别生词…</p>
          </div>
        )}

        {/* Extracted words list */}
        {!analyzing && extractedWords.length > 0 && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              识别出 {extractedWords.length} 个单词，取消勾选不需要的：
            </p>
            <div className="space-y-2 mb-6">
              {extractedWords.map((w, i) => (
                <button
                  key={i}
                  onClick={() => toggleWord(i)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                    w.selected
                      ? 'bg-white dark:bg-gray-800 border-violet-300 dark:border-violet-600'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    w.selected ? 'bg-violet-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {w.selected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{w.front}</span>
                      {w.phonetic && <span className="text-xs text-gray-400">{w.phonetic}</span>}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{w.back}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirmPhoto}
              disabled={submitting || !extractedWords.some(w => w.selected)}
              className="w-full py-3 rounded-full bg-violet-600 text-white font-medium hover:bg-violet-700 transition disabled:opacity-50"
            >
              {submitting ? '添加中…' : `添加 ${extractedWords.filter(w => w.selected).length} 个单词`}
            </button>
          </>
        )}

        {!analyzing && extractedWords.length === 0 && !photoPreview && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-violet-400 hover:text-violet-400 transition"
          >
            <Camera className="w-8 h-8 mx-auto mb-2" />
            <span className="text-sm">点击拍照或上传图片</span>
          </button>
        )}
      </div>
    </Layout>
  );
}
