import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Props {
  onImageReady: (file: File) => void;
  maxSizeKB?: number;  // target max after compression, default 1024KB
}

/**
 * PhotoCapture — Take/select photo → crop → compress → return File.
 *
 * Flow:
 * 1. User takes photo or picks from gallery
 * 2. Shows crop overlay (free aspect ratio)
 * 3. On confirm, crops + compresses to target size via canvas
 * 4. Calls onImageReady with the final File
 */
export default function PhotoCapture({ onImageReady, maxSizeKB = 1024 }: Props) {
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [cropping, setCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawSrc(reader.result as string);
      setCropping(true);
      setCrop(undefined);
      setCompletedCrop(undefined);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const compressImage = useCallback(async (
    canvas: HTMLCanvasElement,
    targetKB: number
  ): Promise<File> => {
    // Try quality steps from 0.9 down to 0.3
    const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
    let blob: Blob | null = null;

    for (const q of qualities) {
      blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', q)
      );
      if (blob && blob.size <= targetKB * 1024) break;
    }

    // If still too large, scale down the canvas
    if (blob && blob.size > targetKB * 1024) {
      const scale = Math.sqrt((targetKB * 1024) / blob.size);
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = Math.round(canvas.width * scale);
      smallCanvas.height = Math.round(canvas.height * scale);
      const ctx = smallCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
      blob = await new Promise<Blob | null>(resolve =>
        smallCanvas.toBlob(resolve, 'image/jpeg', 0.8)
      );
    }

    return new File([blob!], 'proof.jpg', { type: 'image/jpeg' });
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const canvas = document.createElement('canvas');
    const cropW = completedCrop.width * scaleX;
    const cropH = completedCrop.height * scaleY;

    // Cap resolution at 2048px on longest side
    const maxDim = 2048;
    let outW = cropW;
    let outH = cropH;
    if (outW > maxDim || outH > maxDim) {
      const ratio = Math.min(maxDim / outW, maxDim / outH);
      outW = Math.round(outW * ratio);
      outH = Math.round(outH * ratio);
    }

    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropW,
      cropH,
      0, 0, outW, outH
    );

    const file = await compressImage(canvas, maxSizeKB);
    setCropping(false);
    setRawSrc(null);
    onImageReady(file);
  }, [completedCrop, compressImage, maxSizeKB, onImageReady]);

  // Skip crop — use full image compressed
  const handleSkipCrop = useCallback(async () => {
    if (!imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');

    let w = image.naturalWidth;
    let h = image.naturalHeight;
    const maxDim = 2048;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, w, h);

    const file = await compressImage(canvas, maxSizeKB);
    setCropping(false);
    setRawSrc(null);
    onImageReady(file);
  }, [compressImage, maxSizeKB, onImageReady]);

  const handleCancel = () => {
    setCropping(false);
    setRawSrc(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  if (cropping && rawSrc) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          拖动选择要上传的区域，或直接使用完整图片
        </p>
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={rawSrc}
              alt="待裁剪"
              style={{ maxHeight: '60vh', width: '100%', objectFit: 'contain' }}
            />
          </ReactCrop>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            取消
          </button>
          <button
            onClick={handleSkipCrop}
            className="px-4 py-2 text-sm rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
          >
            使用完整图片
          </button>
          {completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
            <button
              onClick={handleCropConfirm}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium"
            >
              ✂️ 裁剪并上传
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 dark:hover:border-green-500 transition-colors"
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="text-3xl mb-2">📸</div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        拍照上传手写解答
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        点击拍照或从相册选择
      </p>
    </div>
  );
}
