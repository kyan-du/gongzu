import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getUser } from '../lib/api';

export default function Landing() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const handleEnter = () => {
    // Already logged in? Go directly to home
    if (isLoggedIn()) {
      const user = getUser();
      if (user) {
        navigate(`/${user}/home`);
        return;
      }
      navigate('/login/select');
      return;
    }
    navigate('/login');
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
    setMuted(!muted);
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden bg-gray-900">
      {/* 视频区域 */}
      <div className="relative flex-1 min-h-0 cursor-pointer" onClick={handleEnter}>
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

        {/* 声音按钮 */}
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

      {/* 底部入口 */}
      <div className="bg-gray-900 px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">拱卒</h1>
        <p className="text-sm text-gray-400 mb-6">日拱一卒，功不唐捐</p>
        <button
          onClick={handleEnter}
          className="w-full max-w-xs mx-auto bg-blue-600 text-white py-3 px-8 rounded-xl font-medium hover:bg-blue-700 transition shadow-lg text-lg"
        >
          开始学习
        </button>
      </div>
    </div>
  );
}
