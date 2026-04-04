import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paperclip, ArrowUp, X, Loader2, Check, Plus } from 'lucide-react';
import Layout from '../components/Layout';

interface ExtractedWord {
  front: string;
  back: string;
  phonetic?: string;
  example?: string;
  exampleCn?: string;
}

// Compress image for OCR — max 1600px on longest side, JPEG 0.5
function compressImage(dataUrl: string, maxDim = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      const longest = Math.max(w, h);
      if (longest > maxDim) {
        const scale = maxDim / longest;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.src = dataUrl;
  });
}

export default function AddWords() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]); // base64 data URLs
  const [extracting, setExtracting] = useState(false);
  const [words, setWords] = useState<ExtractedWord[]>([]);
  const [saving, setSaving] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [enrichingManual, setEnrichingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image upload
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const raw = ev.target?.result as string;
        const compressed = await compressImage(raw);
        setImages(prev => [...prev, compressed]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const raw = ev.target?.result as string;
          const compressed = await compressImage(raw);
          setImages(prev => [...prev, compressed]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Send to AI for extraction
  const handleExtract = async () => {
    if ((!text.trim() && images.length === 0) || extracting) return;
    setExtracting(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const resp = await fetch('/api/cards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          extract: true,
          text: text.trim() || undefined,
          images: images.length > 0 ? images : undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await resp.json();
      if (data.words?.length) {
        setWords(prev => {
          const existing = new Set(prev.map(w => w.front.toLowerCase()));
          return [...prev, ...data.words.filter((w: ExtractedWord) => !existing.has(w.front.toLowerCase()))];
        });
        setText('');
        setImages([]);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('请求超时，请重试');
      } else {
        setError('提取失败，请重试');
      }
    }
    setExtracting(false);
  };

  // Remove a word from list
  const removeWord = (idx: number) => {
    setWords(prev => prev.filter((_, i) => i !== idx));
  };

  // Manually add a single word (AI enrich)
  const handleManualAdd = async () => {
    const w = manualInput.trim();
    if (!w || enrichingManual) return;
    setEnrichingManual(true);

    try {
      const resp = await fetch('/api/cards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, word: w, enrichOnly: true }),
      });
      const data = await resp.json();
      if (data.word) {
        setWords(prev => [...prev, data.word]);
        setManualInput('');
        setShowManualAdd(false);
      }
    } catch (e) { /* ignore */ }
    setEnrichingManual(false);
  };

  // Save all words
  const handleSave = async () => {
    if (!words.length || saving) return;
    setSaving(true);

    try {
      await fetch('/api/cards/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, words }),
      });
      navigate(`/${userId}/cards`);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  const hasInput = text.trim() || images.length > 0;

  return (
    <Layout userId={userId || ''} showBack backTo={`/${userId}/cards`} maxWidth="max-w-3xl" title="添加生词">
      <div className="flex flex-col">
        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="block mt-1 text-xs text-red-400 hover:text-red-500">关闭</button>
          </div>
        )}

        {/* Input area — SuperGrok style */}
        <div className="mb-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Image previews — above input */}
          {images.length > 0 && (
            <div className="flex gap-3 p-3 pb-0 overflow-x-auto">
              {images.map((img, i) => (
                <div key={i} className="relative flex-shrink-0 group">
                  <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input row: attach + textarea + send */}
          <div className="flex items-center gap-1 px-2 py-2">
            {/* Attach button */}
            <button
              onClick={() => fileRef.current?.click()}
              title="附件"
              className="p-2.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleImageAdd}
            />

            {/* Text area */}
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => {
                setText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExtract();
                }
              }}
              onPaste={handlePaste}
              placeholder="粘贴英文、截图、或输入单词…"
              rows={1}
              className="flex-1 py-2.5 bg-transparent text-base text-gray-900 dark:text-gray-100 focus:outline-none resize-none leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />

            {/* Send button */}
            <button
              onClick={handleExtract}
              disabled={extracting || !hasInput}
              className={`p-2.5 rounded-full flex-shrink-0 transition ${
                hasInput && !extracting
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
              }`}
            >
              {extracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

        {/* Word list area */}
        <div className="py-4">
          {words.length === 0 && !extracting && !error && (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-base mb-1">粘贴英文、拍课本、拍卷子</p>
              <p className="text-sm">AI 自动提取生词</p>
            </div>
          )}

          {extracting && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">AI 正在提取单词…</p>
            </div>
          )}

          {words.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  已提取 {words.length} 个单词
                </span>
                <button
                  onClick={() => setShowManualAdd(!showManualAdd)}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  手动追加
                </button>
              </div>

              {/* Manual add inline */}
              {showManualAdd && (
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                    placeholder="输入单词…"
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400"
                  />
                  <button
                    onClick={handleManualAdd}
                    disabled={enrichingManual || !manualInput.trim()}
                    className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-50"
                  >
                    {enrichingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : '添加'}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {words.map((w, i) => (
                  <div key={`${w.front}-${i}`} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{w.front}</span>
                        {w.phonetic && <span className="text-xs text-gray-400">{w.phonetic}</span>}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{w.back}</span>
                    </div>
                    <button
                      onClick={() => removeWord(i)}
                      className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 py-3 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    添加 {words.length} 个单词到生词本
                  </>
                )}
              </button>
            </>
          )}
        </div>

    </Layout>
  );
}
