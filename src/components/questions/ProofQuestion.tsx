import { useState } from 'react';
import GeometryFigure from './GeometryFigure';
import PhotoCapture from './PhotoCapture';

interface ProofQuestionProps {
  index: number;
  question: {
    id: string;
    type: string;
    content: {
      stem: string;
      hint?: string;
      figure?: string;
      geometry?: any;
    };
    answer?: any;
    explanation?: string;
  };
  value: string;
  onChange: (value: string) => void;
  submitted: boolean;
  result?: {
    correct: boolean;
    feedback?: string;
    correctAnswer?: string;
    score?: number;
  };
  userId?: string;
  date?: string;
}

export default function ProofQuestion({ question, value, onChange, submitted, result, userId, date }: ProofQuestionProps) {
  const { hint } = question.content;
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageReady = async (file: File) => {
    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const params = new URLSearchParams({
        userId: userId || 'unknown',
        date: date || new Date().toISOString().split('T')[0],
        questionId: question.id,
      });

      const res = await fetch(`/api/upload?${params}`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '上传失败' }));
        throw new Error(err.error || '上传失败');
      }

      const data = await res.json();
      onChange(data.key);
    } catch (err: any) {
      setUploadError(err.message || '上传失败，请重试');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = value ? `/api/proof-image/${value.replace(/^proofs\//, '')}` : null;

  return (
    <div className="space-y-3">
      {/* Stem — larger font */}
      <div className="text-base text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
        {question.content.stem}
      </div>

      {/* Geometry diagram (JSXGraph) */}
      {question.content.geometry && (
        <GeometryFigure geometry={question.content.geometry} />
      )}

      {/* Figure (static image fallback) */}
      {question.content.figure && !question.content.geometry && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <img
            src={question.content.figure}
            alt="题目配图"
            className="w-full max-h-64 object-contain p-2"
          />
        </div>
      )}

      {/* Hint */}
      {hint && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <p className="text-sm text-amber-800 dark:text-amber-200">💡 {hint}</p>
        </div>
      )}

      {!submitted ? (
        <div className="space-y-3">
          {uploading ? (
            <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-6 text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">上传中...</p>
            </div>
          ) : previewUrl ? (
            <div
              className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-4 text-center cursor-pointer"
              onClick={() => { setPreviewUrl(null); }}
            >
              <img src={previewUrl} alt="手写解答" className="max-h-48 mx-auto rounded-lg shadow-sm" />
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                {value ? '✅ 已上传，点击可重新拍照' : '预览中...'}
              </p>
            </div>
          ) : (
            <PhotoCapture onImageReady={handleImageReady} maxSizeKB={1024} />
          )}

          {uploadError && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">{uploadError}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={imageUrl} alt="手写解答" className="w-full" />
            </div>
          )}

          {result && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
              result.correct
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : (result.score !== undefined && result.score >= 0.5)
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  result.correct
                    ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                    : (result.score !== undefined && result.score >= 0.5)
                      ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                }`}>
                  {result.score !== undefined ? Math.round(result.score * 100) : (result.correct ? '✅' : '❌')}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  result.correct
                    ? 'text-green-800 dark:text-green-200'
                    : (result.score !== undefined && result.score >= 0.5)
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.correct ? '解答正确！' : result.score !== undefined && result.score >= 0.5 ? '部分正确' : '需要改进'}
                </p>
                {result.feedback && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{result.feedback}</p>
                )}
              </div>
            </div>
          )}

          {result && !result.correct && result.correctAnswer && (
            <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
              ✏️ 参考解法：{result.correctAnswer}
            </div>
          )}

          {question.explanation && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
              📝 {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
