import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImagePlus, Send, X, Loader2, Check, Plus } from 'lucide-react';
import Layout from '../components/Layout';

interface ExtractedWord {
  front: string;
  back: string;
  phonetic?: string;
  example?: string;
  exampleCn?: string;
}

// Compress image to max 800px and JPEG quality 0.5 (keep small for API)
function compressImage(dataUrl: string, maxWidth = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
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

  // Send to AI for extraction
  const handleExtract = async () => {
    if ((!text.trim() && images.length === 0) || extracting) return;
    setExtracting(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

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
        alert('提取失败: ' + data.error);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        alert('请求超时，请重试');
      } else {
        alert('提取失败，请重试');
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
    <Layout userId={userId || ''} showBack maxWidth="max-w-3xl">
      <div className="flex flex-col min-h-[calc(100vh-120px)]">
        {/* Word list area */}
        <div className="flex-1 py-4">
          {words.length === 0 && !extracting && (
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

        {/* Input area — pinned at bottom, ChatGPT style */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 pt-3 pb-4 -mx-4 px-4 border-t border-gray-100 dark:border-gray-800">
          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800/70 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Image button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex-shrink-0"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
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
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExtract();
                }
              }}
              placeholder="粘贴英文、输入单词、或补充说明…"
              rows={1}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500 resize-none transition leading-relaxed"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />

            {/* Send button */}
            <button
              onClick={handleExtract}
              disabled={extracting || !hasInput}
              className={`p-2.5 rounded-xl flex-shrink-0 transition ${
                hasInput && !extracting
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'
              }`}
            >
              {extracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
