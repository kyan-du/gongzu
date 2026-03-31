import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 计算点击位置相对于视频的百分比
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // 笔记本屏幕的热区：大约 x 12%-45%, y 15%-58%
    if (xPct >= 12 && xPct <= 45 && yPct >= 15 && yPct <= 58) {
      navigate('/login');
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
    setMuted(!muted);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onClick={handleClick}
    >
      {/* 背景视频 */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster="/bg-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      {/* 声音按钮 - 右上角 */}
      <button
        onClick={toggleSound}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition"
        aria-label={muted ? '开启声音' : '关闭声音'}
      >
        {muted ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}
